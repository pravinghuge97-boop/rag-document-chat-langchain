from fastapi import APIRouter, HTTPException, Depends
from schemas.api_schemas import ChatQuery, ChatResponse
from services.embedding_service import EmbeddingService
from services.vector_service import get_vector_store
from services.retriever_service import RagRetriever
from services.llm_service import generate_answer
from routers.auth import get_current_user
from utils.file_utils import read_json, COLLECTIONS_FILE

router = APIRouter()

embedding_service = EmbeddingService()

@router.post("", response_model=ChatResponse)
async def chat(query: ChatQuery, current_user=Depends(get_current_user)):
    try:
        cols = read_json(COLLECTIONS_FILE)
        collection = next((c for c in cols if c['id'] == query.collectionId), None)
        if not collection:
            raise HTTPException(status_code=404, detail='Collection not found')
        if current_user.get('role') != 'admin' and collection.get('userId') != current_user['id']:
            raise HTTPException(status_code=403, detail='Access denied')

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
