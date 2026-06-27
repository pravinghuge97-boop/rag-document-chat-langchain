from fastapi import APIRouter, HTTPException
from schemas.api_schemas import ChatQuery, ChatResponse
from services.embedding_service import EmbeddingService
from services.vector_service import get_vector_store
from services.retriever_service import RagRetriever
from services.llm_service import generate_answer

router = APIRouter()

embedding_service = EmbeddingService()

@router.post("", response_model=ChatResponse)
async def chat(query: ChatQuery):
    try:
        vs = get_vector_store(query.collectionId)
        retriever = RagRetriever(vs, embedding_service)
        
        # Retrieve context
        retrieved_docs = retriever.retrieve(query.query, query.topK, query.threshold)
        
        # Generate Answer
        response_data = generate_answer(query.query, retrieved_docs, query.llmModel)
        
        return ChatResponse(
            answer=response_data["answer"],
            sources=response_data["sources"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
