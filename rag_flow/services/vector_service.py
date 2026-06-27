import os
import uuid
import chromadb

class VectorService:
    def __init__(self, collection_name="my_collection", persist_directory="data/vector_store"):
        self.collection_name = collection_name
        self.persist_directory = persist_directory
        self.client = None
        self.collection = None
        self._initialize_store()

    def _initialize_store(self):
        os.makedirs(self.persist_directory, exist_ok=True)
        # Using PersistentClient
        self.client = chromadb.PersistentClient(path=self.persist_directory)
        self.collection = self.client.get_or_create_collection(
            name=self.collection_name,
            metadata={"hnsw:space": "cosine", "description": "Vector store for document embeddings"}
        )

    def clear_collection(self):
        try:
            self.client.delete_collection(self.collection_name)
        except Exception:
            pass
        self._initialize_store()

    def add_documents(self, documents, embeddings):
        if len(documents) != len(embeddings):
            raise ValueError("Documents and embeddings must have the same length.")
        
        ids = []
        metadatas = []
        documents_texts = []
        embeddings_list = []
        
        for i, (doc, emb) in enumerate(zip(documents, embeddings)):
            doc_id = str(uuid.uuid4())
            ids.append(doc_id)
            metadata = dict(doc.metadata) if hasattr(doc, 'metadata') else {}
            metadata["doc_index"] = i
            metadata["chunk_length"] = len(doc.page_content) if hasattr(doc, 'page_content') else len(doc)
            metadatas.append(metadata)
            documents_texts.append(doc.page_content if hasattr(doc, 'page_content') else str(doc))
            embeddings_list.append(emb.tolist())
            
        self.collection.add(
            ids=ids, documents=documents_texts, metadatas=metadatas, embeddings=embeddings_list
        )
        return len(documents)

def get_vector_store(collection_id: str) -> VectorService:
    return VectorService(
        collection_name=collection_id, 
        persist_directory=os.path.join("data", "vector_store")
    )
