from typing import List, Dict, Any

class RagRetriever:
    def __init__(self, vector_store, embedding_service):
        self.vector_store = vector_store
        self.embedding_service = embedding_service
        
    def retrieve(self, query: str, top_k: int = 5, score_threshold: float = 0.0) -> List[Dict[str, Any]]:
        query_embedding = self.embedding_service.generate_embedding(query)
        try:
            results = self.vector_store.collection.query(
                query_embeddings=[query_embedding.tolist()], n_results=top_k
            )
            retrieved_docs = []
            if results["documents"] and results["documents"][0]:
                documents = results["documents"][0]
                metadatas = results["metadatas"][0]
                distances = results["distances"][0]
                ids = results["ids"][0]
                
                for i, (doc_id, document, metadata, distance) in enumerate(zip(ids, documents, metadatas, distances)):
                    similarity_score = 1 - distance
                    if similarity_score >= score_threshold:
                        retrieved_docs.append({
                            "id": doc_id, 
                            "document": document,
                            "metadata": metadata, 
                            "similarity_score": similarity_score
                        })
            return retrieved_docs
        except Exception as e:
            print(f"Error during retrieval: {e}")
            return []
