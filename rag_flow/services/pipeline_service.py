import json
from datetime import datetime
import asyncio

from services.job_manager import JobManager
from services.loader_service import process_pdf, process_txt, process_url,process_excel,process_csv,process_docx,process_doc
from services.splitter_service import split_documents
from services.embedding_service import EmbeddingService
from services.vector_service import get_vector_store
from utils.file_utils import read_json, write_json, COLLECTIONS_FILE, PIPELINES_FILE

def run_pipeline_task(job_id: str, pipeline_data: dict):
    
    def emit_step(step, status, log):
        JobManager.publish_progress(job_id, "step", {"step": step, "status": status, "log": log})
        
    def emit_log(log):
        JobManager.publish_progress(job_id, "log", log)

    try:
        # Step 1: Load
        emit_step(1, "running", "Starting pipeline...")
        cols = read_json(COLLECTIONS_FILE)
        col = next((c for c in cols if c["id"] == pipeline_data["collectionId"]), None)
        if not col:
            JobManager.publish_progress(job_id, "error", "Collection not found")
            return
        
        emit_log(f"Loading {len(col['files'])} files...")
        documents = []
        for f in col["files"]:
            if f["type"] == "pdf":
                docs = process_pdf(f["path"])
                documents.extend(docs)
            elif f["type"] == "txt":
                docs = process_txt(f["path"])
                documents.extend(docs)
            elif f["type"] == "url":
                docs = process_url(f["path"])
                documents.extend(docs)
            elif f["type"] == "excel":
                docs = process_excel(f["path"])
                documents.extend(docs)
            elif f["type"] == "csv":
                docs = process_csv(f["path"])
                documents.extend(docs)
            elif f["type"] == "doc":
                docs = process_doc(f["path"])
                documents.extend(docs)
            elif f["type"] == "docx":
                docs = process_docx(f["path"])
                documents.extend(docs)
                
        emit_step(1, "done", f"Loaded {len(documents)} document pages/sections")

        # Step 2: Chunk
        emit_step(2, "running", "Splitting documents...")
        chunks = split_documents(documents, pipeline_data["chunkSize"], pipeline_data["chunkOverlap"])
        emit_step(2, "done", f"Created {len(chunks)} chunks")

        # Step 3: Embed
        emit_step(3, "running", "Generating embeddings...")
        texts = [c.page_content if hasattr(c, 'page_content') else str(c) for c in chunks]
        
        # Initialize Embedding Service here so it is per worker process
        embedding_service = EmbeddingService(model_name=pipeline_data["embeddingModel"])
        embeddings = embedding_service.generate_embeddings(texts)
        emit_step(3, "done", f"Generated embeddings shape {embeddings.shape}")

        # Step 4: Store
        emit_step(4, "running", f"Storing in {pipeline_data['vectorDb']}...")
        vs = get_vector_store(pipeline_data["collectionId"])
        vs.clear_collection()
        vs.add_documents(chunks, embeddings)
        emit_step(4, "done", "Stored embeddings in Vector DB")

        # Step 5 & 6 (Prep)
        emit_step(5, "done", "Similarity search ready")
        emit_step(6, "done", "LLM pipeline ready")
        
        # Save pipeline record
        pipelines = read_json(PIPELINES_FILE)
        pipe_id = f"pipe-{int(datetime.now().timestamp())}"
        pipelines.insert(0, {
            "id": pipe_id,
            "name": pipeline_data["name"],
            "collectionId": pipeline_data["collectionId"],
            "collectionName": pipeline_data["collectionName"],
            "status": "done",
            "embeddingModel": pipeline_data["embeddingModel"],
            "llmModel": pipeline_data["llmModel"],
            "createdAt": datetime.now().isoformat()
        })
        write_json(PIPELINES_FILE, pipelines)

        JobManager.publish_progress(job_id, "complete", {"pipelineId": pipe_id, "chunks": len(chunks)})

    except Exception as e:
        JobManager.publish_progress(job_id, "error", str(e))
