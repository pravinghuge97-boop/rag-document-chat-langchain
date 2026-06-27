import asyncio
import typing

_job_subscriptions = {}
_main_loop = None

def set_main_loop(loop):
    global _main_loop
    _main_loop = loop

class JobManager:
    @staticmethod
    def start_pipeline(job_id: str, data: dict, background_tasks):
        from services.pipeline_service import run_pipeline_task
        if job_id not in _job_subscriptions:
            _job_subscriptions[job_id] = []
        background_tasks.add_task(run_pipeline_task, job_id, data)

    @staticmethod
    def publish_progress(job_id: str, event_type: str, data: typing.Any):
        global _main_loop
        if job_id in _job_subscriptions:
            message = {"event": event_type, "data": data}
            for q in _job_subscriptions[job_id]:
                if _main_loop:
                    _main_loop.call_soon_threadsafe(q.put_nowait, message)

    @staticmethod
    def subscribe(job_id: str) -> asyncio.Queue:
        if job_id not in _job_subscriptions:
            _job_subscriptions[job_id] = []
        q = asyncio.Queue()
        _job_subscriptions[job_id].append(q)
        return q

    @staticmethod
    def unsubscribe(job_id: str, q: asyncio.Queue):
        if job_id in _job_subscriptions and q in _job_subscriptions[job_id]:
            _job_subscriptions[job_id].remove(q)
            if len(_job_subscriptions[job_id]) == 0:
                del _job_subscriptions[job_id]
