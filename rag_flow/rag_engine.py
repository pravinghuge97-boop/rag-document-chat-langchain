import os
import uuid
from typing import List, Dict, Any
from pathlib import Path
import chromadb
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
from langchain_community.document_loaders import PyMuPDFLoader, TextLoader, WebBaseLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter

class EmbeddingManager:
    def __init__(self, model_name="all-MiniLM-L6-v2"):
        self.model_name = model_name
        self.model = None
        self._load_model()

    def _load_model(self):
        print(f"Loading embedding model: {self.model_name}")
        self.model = SentenceTransformer(self.model_name)
        print(f"Model '{self.model_name}' loaded successfully.")

    def generate_embeddings(self, texts):
        if self.model is None:
            raise ValueError("Embedding model is not loaded.")
        return self.model.encode(
            texts, show_progress_bar=False, convert_to_numpy=True, normalize_embeddings=True
        )

    def generate_embedding(self, text):
        if self.model is None:
            raise ValueError("Embedding model is not loaded.")
        return self.model.encode(text, convert_to_numpy=True, normalize_embeddings=True)

class VectorStore:
    def __init__(self, collection_name="my_collection", persist_directory="data/vector_store"):
        self.collection_name = collection_name
        self.persist_directory = persist_directory
        self.client = None
        self.collection = None
        self._initialize_store()

    def _initialize_store(self):
        os.makedirs(self.persist_directory, exist_ok=True)
        self.client = chromadb.PersistentClient(path=self.persist_directory)
        self.collection = self.client.get_or_create_collection(
            name=self.collection_name,
            metadata={"hnsw:space": "cosine", "description": "Vector store for document embeddings"}
        )

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
            documents_texts.append(doc.page_content if hasattr(doc, 'page_content') else doc)
            embeddings_list.append(emb.tolist())
            
        self.collection.add(
            ids=ids, documents=documents_texts, metadatas=metadatas, embeddings=embeddings_list
        )
        return len(documents)

class RagRetriever:
    def __init__(self, vector_store, embedding_manager):
        self.vector_store = vector_store
        self.embedding_manager = embedding_manager
        
    def retrieve(self, query: str, top_k: int = 5, score_threshold: float = 0.0) -> List[Dict[str, Any]]:
        query_embedding = self.embedding_manager.generate_embedding(query)
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

def split_documents(documents, chunk_size=1000, chunk_overlap=200):
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\n\n", "\n", " ", ""],
        length_function=len,
    )
    return text_splitter.split_documents(documents)

def process_pdf(file_path):
    loader = PyMuPDFLoader(str(file_path))
    docs = loader.load()
    for doc in docs:
        doc.metadata["source_filename"] = Path(file_path).name
    return docs

def process_txt(file_path):
    loader = TextLoader(str(file_path))
    docs = loader.load()
    for doc in docs:
        doc.metadata["source_filename"] = Path(file_path).name
    return docs

def process_url(url):
    loader = WebBaseLoader(url)
    docs = loader.load()
    for doc in docs:
        doc.metadata["source_filename"] = url
    return docs

