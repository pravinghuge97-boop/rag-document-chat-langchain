import uuid
import json
import asyncio
from fastapi import APIRouter, BackgroundTasks
from sse_starlette.sse import EventSourceResponse
from schemas.api_schemas import PipelineRun
from services.job_manager import JobManager
from utils.file_utils import read_json, PIPELINES_FILE

router = APIRouter()

@router.post("/run")
async def start_pipeline(data: PipelineRun, background_tasks: BackgroundTasks):
    job_id = str(uuid.uuid4())
    JobManager.start_pipeline(job_id, data.model_dump(), background_tasks)
    return {"success": True, "jobId": job_id}

@router.get("/stream/{job_id}")
async def stream_pipeline(job_id: str):
    async def event_generator():
        q = JobManager.subscribe(job_id)
        try:
            while True:
                message = await q.get()
                yield {"event": message["event"], "data": json.dumps(message["data"])}
                
                if message["event"] in ["complete", "error"]:
                    break
        finally:
            JobManager.unsubscribe(job_id, q)

    return EventSourceResponse(event_generator())

@router.get("")
async def get_pipelines():
    return read_json(PIPELINES_FILE)
