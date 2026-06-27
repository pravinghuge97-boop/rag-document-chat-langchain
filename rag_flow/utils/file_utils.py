import json
import os

DATA_DIR = "data"
UPLOADS_DIR = "uploads"
COLLECTIONS_FILE = os.path.join(DATA_DIR, "collections.json")
PIPELINES_FILE = os.path.join(DATA_DIR, "pipelines.json")

def init_dirs():
    os.makedirs(DATA_DIR, exist_ok=True)
    os.makedirs(UPLOADS_DIR, exist_ok=True)
    
    if not os.path.exists(COLLECTIONS_FILE):
        with open(COLLECTIONS_FILE, "w") as f:
            json.dump([], f)
            
    if not os.path.exists(PIPELINES_FILE):
        with open(PIPELINES_FILE, "w") as f:
            json.dump([], f)

def read_json(path):
    with open(path, "r") as f:
        return json.load(f)

def write_json(path, data):
    with open(path, "w") as f:
        json.dump(data, f, indent=2)
