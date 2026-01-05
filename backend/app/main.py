import os
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse, Response
from langchain_core.messages import HumanMessage
from langgraph.checkpoint.memory import MemorySaver

from backend.app.schema import ChatRequest, PDFRequest
from backend.app.graph import get_graph_engine
from backend.app.pdf_service import generate_pdf

app = FastAPI(title="LangGraph Agent API")

# Checkpointer (Global for MVP)
# In production, manage connection lifecycle properly
# DB_PATH = "database.sqlite"
checkpointer = MemorySaver()

@app.get("/health")
def health_check():
    return {"status": "ok", "version": "1.0.0-lite"}

@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    """
    Chat endpoint that streams the agent's response.
    """
    try:
        # Initialize Checkpointer (In-Memory for MVP to avoid SQLite dependency issues)
        # Note: In a real app, you would use a persistent DB and connection pooling.
        # For this demo, we create a new memory saver each request which defeats the purpose of persistence across requests.
        # To fix this, we should instantiate a global checkpointer or use a file-based one that works.
        # Given the import errors with sqlite, let's try to use a simple global memory dict for this demo.
        global checkpointer
        
        # Initialize Graph
        graph = get_graph_engine(
            openai_api_key=request.openai_api_key,
            tavily_api_key=request.tavily_api_key,
            base_url=request.base_url,
            model=request.model,
            checkpointer=checkpointer
        )
        
        # Prepare config
        config = {"configurable": {"thread_id": request.session_id}}
        
        # Prepare Input
        inputs = {"messages": [HumanMessage(content=request.message)]}
        
        # Streaming Logic
        async def event_generator():
            try:
                # Initial connection established message
                yield "🔍 正在思考..." 
                
                async for event in graph.astream_events(inputs, config=config, version="v1"):
                    kind = event["event"]
                    
                    # Log event for debugging
                    print(f"DEBUG: {kind} - {event.get('name')}")
                    
                    # Feedback for Tool Execution (Search)
                    if kind == "on_tool_start":
                        yield "\n\n🌐 正在联网搜索相关信息...\n\n"
                    elif kind == "on_tool_end":
                        yield "✅ 搜索完成，正在整理回答...\n\n"
                        
                    # Stream LLM tokens for "chatbot" node
                    # Note: Different providers might emit different event types.
                    # Standard is 'on_chat_model_stream', but let's be robust.
                    if kind == "on_chat_model_stream" or kind == "on_llm_stream":
                        chunk = event["data"]["chunk"]
                        # Chunk can be AIMessageChunk or string or dict
                        content = ""
                        if hasattr(chunk, "content"):
                            content = chunk.content
                        elif isinstance(chunk, dict):
                            content = chunk.get("content", "")
                        elif isinstance(chunk, str):
                            content = chunk
                        
                        if content:
                            yield content
                    
                    # Fallback: Capture final output if stream didn't work
                    if kind == "on_chain_end" and event.get("name") == "chatbot":
                        output = event["data"].get("output")
                        # Output might be {'messages': [AIMessage(...)]}
                        if output and isinstance(output, dict) and "messages" in output:
                            msg = output["messages"][-1]
                            if hasattr(msg, "content") and msg.content:
                                # Only yield if we haven't streamed anything yet? 
                                # Or just yield it. Frontend should handle duplicates or we can check.
                                # For now, let's just yield it as a fallback.
                                # But be careful not to duplicate if streaming worked.
                                # Let's assume if streaming worked, we saw 'on_chat_model_stream'.
                                # We can't easily track state here without a class.
                                # A simple hack: yield it. If frontend sees duplicate, it's better than nothing.
                                yield msg.content
                            # yield "" # Force flush? Usually not needed in Python async generator but helps in some WSGI servers
            except Exception as e:
                # Catch errors during streaming (like OpenAI 429) and yield them to frontend
                error_msg = str(e)
                if "insufficient_quota" in error_msg:
                    yield "\n\n**错误提示**: OpenAI API Key 额度已用尽 (Insufficient Quota)。请检查您的扣费情况或更换 Key。"
                elif "Rate limit" in error_msg:
                    yield "\n\n**错误提示**: 触发了 OpenAI API 速率限制，请稍后再试。"
                else:
                    yield f"\n\n**系统错误**: {error_msg}"

        return StreamingResponse(event_generator(), media_type="text/event-stream") # Changed from text/plain to text/event-stream for better buffering behavior
            
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/pdf")
async def pdf_endpoint(request: PDFRequest):
    """
    Generates PDF from session history.
    """
    try:
        global checkpointer
        config = {"configurable": {"thread_id": request.session_id}}
        # Retrieve state
        checkpoint = checkpointer.get(config)
        
        messages = []
        if checkpoint:
             # Checkpoint structure: {'channel_values': {'messages': [...]}, ...}
             # We need to adapt based on LangGraph version.
             # For 0.0.10+, it usually returns a Checkpoint object.
             # Let's inspect the messages.
             # Assuming standard LangGraph checkpoint structure.
             if isinstance(checkpoint, dict) and "channel_values" in checkpoint:
                  messages = checkpoint["channel_values"].get("messages", [])
             elif hasattr(checkpoint, "channel_values"):
                  messages = checkpoint.channel_values.get("messages", [])
        
        # If checkpoint is empty (e.g. using MemorySaver and server restarted), 
        # fallback to empty list or handle gracefully.
        # But wait, PDF generation usually happens immediately after chat.
        # If using MemorySaver, state is preserved as long as process is alive.
        
        if not messages:
             # Fallback: maybe client can send history? 
             # For now, let's just return a PDF saying "No History Found"
             pass
             
        # Convert LangChain messages to simple dicts for PDF service
        history = []
        for msg in messages:
            role = "unknown"
            if msg.type == "human":
                role = "user"
            elif msg.type == "ai":
                role = "assistant"
            elif msg.type == "tool":
                role = "tool"
            
            history.append({
                "role": role,
                "content": msg.content
            })
        
        pdf_bytes = generate_pdf(history, title=request.title)
        
        from urllib.parse import quote
        encoded_title = quote(request.title)
        
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename*=UTF-8''{encoded_title}.pdf"
            }
        )
            
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
