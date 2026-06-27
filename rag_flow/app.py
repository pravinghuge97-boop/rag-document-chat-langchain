import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from utils.file_utils import init_dirs, read_json, COLLECTIONS_FILE, PIPELINES_FILE
from routers import collections, pipeline, chat

# Load environment variables
load_dotenv()

app = FastAPI(title="Enterprise RAG Platform API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For dev only
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize directories
init_dirs()

# Include routers
app.include_router(collections.router, prefix="/api/collections", tags=["Collections"])
app.include_router(pipeline.router, prefix="/api/pipeline", tags=["Pipeline"])
app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])

@app.on_event("startup")
async def startup_event():
    import asyncio
    from services.job_manager import set_main_loop
    set_main_loop(asyncio.get_running_loop())

@app.get("/api/dashboard/stats")
async def get_dashboard_stats():
    cols = read_json(COLLECTIONS_FILE)
    pipelines = read_json(PIPELINES_FILE)
    
    total_files = sum(len(c["files"]) for c in cols)
    total_chunks = 0 
    for c in cols:
         total_chunks += sum(f.get("chunks", 0) for f in c["files"])
         
    return {
        "collections": len(cols),
        "files": total_files,
        "pipelines": len([p for p in pipelines if p["status"] == "done"]),
        "chunks": total_chunks
    }
