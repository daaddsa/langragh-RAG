from typing import Optional
from pydantic import BaseModel

class ChatRequest(BaseModel):
    message: str
    session_id: str
    openai_api_key: str
    tavily_api_key: str
    base_url: Optional[str] = None
    model: Optional[str] = None

class PDFRequest(BaseModel):
    session_id: str
    title: str = "研报"
