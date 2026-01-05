import os
from typing import Literal, Optional

from langchain_openai import ChatOpenAI
from langchain_community.tools.tavily_search import TavilySearchResults
from langchain_core.messages import SystemMessage, ToolMessage, AIMessage, HumanMessage
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode
from langgraph.checkpoint.memory import MemorySaver

from backend.app.state import AgentState

# Load environment variables (ensure they are set in .env or passed at runtime)
# For demo purposes, we will initialize these dynamically in the API endpoint if needed,
# but here we assume standard env vars are present or will be injected.

def get_graph_engine(openai_api_key: str, tavily_api_key: str, base_url: Optional[str] = None, model: Optional[str] = None, checkpointer=None):
    """
    Constructs the LangGraph agent.
    
    Args:
        openai_api_key: The API key for OpenAI.
        tavily_api_key: The API key for Tavily.
        base_url: Optional base URL for compatible APIs (e.g. DeepSeek).
        model: Optional model name.
        checkpointer: An async checkpointer instance (e.g. AsyncSqliteSaver).
    
    Returns:
        A compiled LangGraph runnable.
    """
    
    # 1. Initialize Tools
    # Note: We need to set the env var for Tavily wrapper to work automatically,
    # or pass it explicitly if the wrapper supports it. 
    # TavilySearchResults reads TAVILY_API_KEY from env.
    os.environ["TAVILY_API_KEY"] = tavily_api_key
    
    search_tool = TavilySearchResults(
        max_results=5,
        search_depth="advanced",
        include_answer=True,
        include_raw_content=True
    )
    tools = [search_tool]
    
    # 2. Initialize LLM
    # Determine model name
    model_name = model or "gpt-3.5-turbo"
    
    # Fallback inference if model not provided but base_url suggests specific provider
    if not model:
        if base_url:
            if "deepseek" in base_url:
                model_name = "deepseek-chat"
            elif "moonshot" in base_url:
                model_name = "moonshot-v1-8k"
            elif "dashscope" in base_url or "aliyuncs" in base_url:
                model_name = "qwen-plus"
            
    llm = ChatOpenAI(
        model=model_name, 
        temperature=0, 
        api_key=openai_api_key,
        base_url=base_url,
        streaming=True
    )
    llm_with_tools = llm.bind_tools(tools)

    # 3. Define Graph Nodes
    async def chatbot(state: AgentState):
        return {"messages": [await llm_with_tools.ainvoke(state["messages"])]}

    async def search_node(state: AgentState):
        """
        Executes the search tool and updates the search_results state.
        This is a wrapper around the standard ToolNode to capture results for PDF.
        """
        # We use the standard ToolNode for execution, but we might want to 
        # intercept the results to populate 'search_results'.
        # For simplicity in this 2-week MVP, we will extract search results 
        # from the ToolMessage history when generating PDF, rather than 
        # maintaining a separate complex sync logic here.
        # So we just delegate to the prebuilt ToolNode.
        pass

    tool_node = ToolNode(tools)

    # 4. Define Router Logic
    def router(state: AgentState) -> Literal["tools", "__end__"]:
        messages = state["messages"]
        last_message = messages[-1]
        
        if last_message.tool_calls:
            return "tools"
        return "__end__"

    # 5. Build Graph
    workflow = StateGraph(AgentState)
    
    workflow.add_node("chatbot", chatbot)
    workflow.add_node("tools", tool_node)
    
    workflow.set_entry_point("chatbot")
    
    workflow.add_conditional_edges(
        "chatbot",
        router,
    )
    
    workflow.add_edge("tools", "chatbot")
    
    # 6. Compile
    return workflow.compile(checkpointer=checkpointer)

