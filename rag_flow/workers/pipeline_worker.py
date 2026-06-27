import os
import sys
from rq import Worker, Queue, Connection
from dotenv import load_dotenv

# Add the parent directory to the python path so it can find services, utils, etc.
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from services.job_manager import redis_conn

load_dotenv()

if __name__ == '__main__':
    print("Starting RQ Worker for RAG Pipeline...")
    with Connection(redis_conn):
        worker = Worker(['pipeline_tasks'])
        worker.work()
