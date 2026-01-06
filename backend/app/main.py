import os
from fastapi import FastAPI, HTTPException
from fastapi.responses import Response
from langchain_core.messages import HumanMessage
from langgraph.checkpoint.memory import MemorySaver

from pydantic import BaseModel
from backend.app.schema import ChatRequest

class PDFRequest(BaseModel):
    session_id: str
    title: str
    messages: list[dict] = [] # Allow frontend to pass messages directly
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
        
        # Non-Streaming Logic
        result = await graph.ainvoke(inputs, config=config)
        messages = result["messages"]
        last_message = messages[-1]
        
        return {"content": last_message.content}
            
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
        # Simplified PDF generation logic: Direct use of provided messages
        # Removed complex Checkpoint fallback logic as frontend now reliably provides full context
        
        history = []
        if request.messages:
             # print(f"DEBUG: Using {len(request.messages)} messages provided by frontend.")
             for msg in request.messages:
                role = msg.get("role", "unknown")
                # Map frontend roles to standard roles if needed, though they usually match
                history.append({
                    "role": role,
                    "content": msg.get("content", "")
                })
        else:
             # Minimal fallback if needed, or just return empty PDF
             pass
        
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
