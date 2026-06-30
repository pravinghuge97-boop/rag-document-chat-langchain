from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class CollectionCreate(BaseModel):
    name: str
    description: Optional[str] = ""

class CollectionUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class UrlUpload(BaseModel):
    url: str

class LoginRequest(BaseModel):
    identifier: str
    password: str

class SignupRequest(BaseModel):
    email: str
    password: str

class UserOut(BaseModel):
    id: str
    username: str
    email: str
    role: str
    createdAt: str

class AuthResponse(BaseModel):
    user: UserOut
    token: str

class PipelineRun(BaseModel):
    name: str
    collectionId: str
    collectionName: str
    sourceType: str
    chunkSize: int = 1000
    chunkOverlap: int = 200
    embeddingModel: str = "all-MiniLM-L6-v2"
    vectorDb: str = "ChromaDB"
    llmModel: str = "llama-3.3-70b-versatile"

class ChatQuery(BaseModel):
    collectionId: str
    query: str
    topK: int = 5
    threshold: float = 0.0
    llmModel: str = "llama-3.3-70b-versatile"

class ChatResponse(BaseModel):
    answer: str
    sources: List[Dict[str, Any]]
