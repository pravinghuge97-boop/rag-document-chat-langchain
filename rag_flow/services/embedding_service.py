from sentence_transformers import SentenceTransformer

class EmbeddingService:
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

# We can keep a singleton instance per process if needed, or instantiate dynamically.
