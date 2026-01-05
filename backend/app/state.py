from typing import TypedDict, Annotated, List, Optional
from langchain_core.messages import BaseMessage
import operator

class AgentState(TypedDict):
    """
    LangGraph Agent State
    
    Attributes:
        messages: The history of messages in the conversation.
        search_results: Cached search results for PDF generation.
    """
    messages: Annotated[List[BaseMessage], operator.add]
    search_results: Annotated[List[dict], operator.add]
