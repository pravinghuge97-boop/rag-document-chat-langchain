import uuid
import json
import asyncio
from fastapi import APIRouter, BackgroundTasks, HTTPException, Depends, Query
from sse_starlette.sse import EventSourceResponse
from schemas.api_schemas import PipelineRun
from services.job_manager import JobManager
from routers.auth import get_current_user
from utils.file_utils import read_json, write_json, PIPELINES_FILE, COLLECTIONS_FILE

router = APIRouter()

@router.post("/run")
async def start_pipeline(data: PipelineRun, background_tasks: BackgroundTasks, current_user=Depends(get_current_user)):
    cols = read_json(COLLECTIONS_FILE)
    collection = next((c for c in cols if c["id"] == data.collectionId), None)
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")
    if current_user.get('role') != 'admin' and collection.get('userId') != current_user['id']:
        raise HTTPException(status_code=403, detail='Access denied')

    job_id = str(uuid.uuid4())
    payload = data.model_dump()
    payload["userId"] = current_user["id"]
    JobManager.start_pipeline(job_id, payload, background_tasks)
    return {"success": True, "jobId": job_id}

@router.get("/stream/{job_id}")
async def stream_pipeline(job_id: str, token: str | None = Query(None)):
    from services.auth_service import get_user_by_token
    if not token or not get_user_by_token(token):
        raise HTTPException(status_code=401, detail='Invalid or missing stream token')

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
async def get_pipelines(current_user=Depends(get_current_user)):
    pipelines = read_json(PIPELINES_FILE)
    if current_user.get('role') != 'admin':
        pipelines = [p for p in pipelines if p.get('userId') == current_user['id']]
    return pipelines

@router.delete("/{pipeline_id}")
async def delete_pipeline(pipeline_id: str, current_user=Depends(get_current_user)):
    pipelines = read_json(PIPELINES_FILE)
    pipeline = next((p for p in pipelines if p.get("id") == pipeline_id), None)
    if not pipeline:
        raise HTTPException(status_code=404, detail="Pipeline not found")
    if current_user.get('role') != 'admin' and pipeline.get('userId') != current_user['id']:
        raise HTTPException(status_code=403, detail="Access denied")
    filtered = [p for p in pipelines if p.get("id") != pipeline_id]
    write_json(PIPELINES_FILE, filtered)
    return {"success": True, "message": "Pipeline deleted"}

@router.put("/{pipeline_id}")
async def update_pipeline(pipeline_id: str, data: dict, current_user=Depends(get_current_user)):
    pipelines = read_json(PIPELINES_FILE)
    updated = None
    for p in pipelines:
        if p.get("id") == pipeline_id:
            if current_user.get('role') != 'admin' and p.get('userId') != current_user['id']:
                raise HTTPException(status_code=403, detail='Access denied')
            allowed = {k: v for k, v in data.items() if k in ["name", "collectionName", "status", "embeddingModel", "llmModel"]}
            if not allowed:
                break
            p.update(allowed)
            updated = p
            break
    if not updated:
        raise HTTPException(status_code=404, detail="Pipeline not found")
    write_json(PIPELINES_FILE, pipelines)
    return {"success": True, "pipeline": updated}
