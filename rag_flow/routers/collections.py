import os
from datetime import datetime
from typing import List
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from schemas.api_schemas import CollectionCreate, CollectionUpdate, UrlUpload
from routers.auth import get_current_user
from utils.file_utils import read_json, write_json, COLLECTIONS_FILE, UPLOADS_DIR

router = APIRouter()

@router.get("")
async def list_collections(current_user=Depends(get_current_user)):
    cols = read_json(COLLECTIONS_FILE)
    if current_user.get('role') != 'admin':
        cols = [c for c in cols if c.get('userId') == current_user['id']]
    return cols

@router.post("")
async def create_collection(data: CollectionCreate, current_user=Depends(get_current_user)):
    col_id = f"col-{int(datetime.now().timestamp())}"
    new_col = {
        "id": col_id,
        "name": data.name,
        "description": data.description,
        "type": "mixed",
        "createdAt": datetime.now().strftime("%Y-%m-%d"),
        "files": [],
        "folders": [],
        "userId": current_user['id']
    }
    cols = read_json(COLLECTIONS_FILE)
    cols.insert(0, new_col)
    write_json(COLLECTIONS_FILE, cols)
    return new_col

@router.get("/{col_id}")
async def get_collection(col_id: str, current_user=Depends(get_current_user)):
    cols = read_json(COLLECTIONS_FILE)
    col = next((c for c in cols if c["id"] == col_id), None)
    if not col:
        raise HTTPException(status_code=404, detail="Collection not found")
    if current_user.get('role') != 'admin' and col.get('userId') != current_user['id']:
        raise HTTPException(status_code=403, detail="Access denied")
    return col

@router.put("/{col_id}")
async def update_collection(col_id: str, data: CollectionUpdate, current_user=Depends(get_current_user)):
    cols = read_json(COLLECTIONS_FILE)
    col_idx = next((i for i, c in enumerate(cols) if c["id"] == col_id), -1)
    if col_idx == -1:
        raise HTTPException(status_code=404, detail="Collection not found")
    col = cols[col_idx]
    if current_user.get('role') != 'admin' and col.get('userId') != current_user['id']:
        raise HTTPException(status_code=403, detail="Access denied")

    if data.name is not None:
        cols[col_idx]["name"] = data.name
    if data.description is not None:
        cols[col_idx]["description"] = data.description

    write_json(COLLECTIONS_FILE, cols)
    return cols[col_idx]

@router.delete("/{col_id}")
async def delete_collection(col_id: str, current_user=Depends(get_current_user)):
    cols = read_json(COLLECTIONS_FILE)
    col = next((c for c in cols if c["id"] == col_id), None)
    if not col:
        raise HTTPException(status_code=404, detail="Collection not found")
    if current_user.get('role') != 'admin' and col.get('userId') != current_user['id']:
        raise HTTPException(status_code=403, detail="Access denied")
    cols = [c for c in cols if c["id"] != col_id]
    write_json(COLLECTIONS_FILE, cols)
    
    # Delete from ChromaDB
    try:
        import chromadb
        client = chromadb.PersistentClient(path=os.path.join("data", "vector_store"))
        client.delete_collection(name=col_id)
    except Exception as e:
        print(f"Error deleting collection {col_id} from ChromaDB: {e}")
        
    return {"success": True}

@router.delete("/{col_id}/files/{file_id}")
async def delete_file(col_id: str, file_id: str, current_user=Depends(get_current_user)):
    cols = read_json(COLLECTIONS_FILE)
    col_idx = next((i for i, c in enumerate(cols) if c["id"] == col_id), -1)
    if col_idx == -1:
        raise HTTPException(status_code=404, detail="Collection not found")
    col = cols[col_idx]
    if current_user.get('role') != 'admin' and col.get('userId') != current_user['id']:
        raise HTTPException(status_code=403, detail="Access denied")
    
    file_obj = next((f for f in cols[col_idx]["files"] if f["id"] == file_id), None)
    if not file_obj:
        raise HTTPException(status_code=404, detail="File not found")
        
    cols[col_idx]["files"] = [f for f in cols[col_idx]["files"] if f["id"] != file_id]
    
    if file_obj["type"] != "url" and os.path.exists(file_obj["path"]):
        try:
            os.remove(file_obj["path"])
        except Exception as e:
            print(f"Error removing physical file: {e}")
            
    for fld in cols[col_idx].get("folders", []):
        if file_id in fld.get("fileIds", []):
            fld["fileIds"] = [fid for fid in fld["fileIds"] if fid != file_id]
            
    write_json(COLLECTIONS_FILE, cols)
    
    try:
        import chromadb
        client = chromadb.PersistentClient(path=os.path.join("data", "vector_store"))
        collection = client.get_collection(name=col_id)
        collection.delete(where={"source_filename": file_obj["name"]})
    except Exception as e:
        print(f"Error deleting file from ChromaDB: {e}")
        
    return {"success": True}

# @router.post("/{col_id}/upload")
# async def upload_files(col_id: str, files: List[UploadFile] = File(...)):
#     cols = read_json(COLLECTIONS_FILE)
#     col_idx = next((i for i, c in enumerate(cols) if c["id"] == col_id), -1)
#     if col_idx == -1:
#         raise HTTPException(status_code=404, detail="Collection not found")

#     col_dir = os.path.join(UPLOADS_DIR, col_id)
#     os.makedirs(col_dir, exist_ok=True)
    
#     uploaded = []
#     for file in files:
#         path = os.path.join(col_dir, file.filename)
#         with open(path, "wb") as f:
#             f.write(await file.read())
        
#         # Simple size estimate
#         size_kb = os.path.getsize(path) / 1024
        
#         file_obj = {
#             "id": f"f-{int(datetime.now().timestamp())}-{file.filename}",
#             "name": file.filename,
#             "type": "pdf" if file.filename.endswith(".pdf") else "txt",
#             "size": f"{size_kb:.1f} KB",
#             "path": path,
#             "chunks": max(1, int(size_kb)) # rough estimate for ui
#         }
#         cols[col_idx]["files"].append(file_obj)
#         uploaded.append(file_obj)
        
#     write_json(COLLECTIONS_FILE, cols)
#     return {"success": True, "files": uploaded}

@router.post("/{col_id}/upload")
async def upload_files(col_id: str, files: List[UploadFile] = File(...), current_user=Depends(get_current_user)):
    cols = read_json(COLLECTIONS_FILE)
    col_idx = next((i for i, c in enumerate(cols) if c["id"] == col_id), -1)
    if col_idx == -1:
        raise HTTPException(status_code=404, detail="Collection not found")
    if current_user.get('role') != 'admin' and cols[col_idx].get('userId') != current_user['id']:
        raise HTTPException(status_code=403, detail="Access denied")

    col_dir = os.path.join(UPLOADS_DIR, col_id)
    os.makedirs(col_dir, exist_ok=True)

    uploaded = []

    for file in files:
        path = os.path.join(col_dir, file.filename)

        with open(path, "wb") as f:
            f.write(await file.read())

        size_kb = os.path.getsize(path) / 1024

        ext = os.path.splitext(file.filename)[1].lower()

        if ext == ".pdf":
            file_type = "pdf"

        elif ext == ".txt":
            file_type = "txt"

        elif ext in [".xlsx", ".xls"]:
            file_type = "excel"

        elif ext == ".csv":
            file_type = "csv"
        
        elif ext == ".docx":
            file_type = "docx"
        
        elif ext == ".doc":
            file_type = "doc"
            
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type: {ext}"
            )

        file_obj = {
            "id": f"f-{int(datetime.now().timestamp())}-{file.filename}",
            "name": file.filename,
            "type": file_type,
            "size": f"{size_kb:.1f} KB",
            "path": path,
            "chunks": max(1, int(size_kb))
        }

        cols[col_idx]["files"].append(file_obj)
        uploaded.append(file_obj)

    write_json(COLLECTIONS_FILE, cols)

    return {
        "success": True,
        "files": uploaded
    }
    
@router.post("/{col_id}/upload-url")
async def upload_url(col_id: str, data: UrlUpload, current_user=Depends(get_current_user)):
    cols = read_json(COLLECTIONS_FILE)
    col_idx = next((i for i, c in enumerate(cols) if c["id"] == col_id), -1)
    if col_idx == -1:
        raise HTTPException(status_code=404, detail="Collection not found")
    if current_user.get('role') != 'admin' and cols[col_idx].get('userId') != current_user['id']:
        raise HTTPException(status_code=403, detail="Access denied")

    file_obj = {
        "id": f"f-{int(datetime.now().timestamp())}-url",
        "name": data.url,
        "type": "url",
        "size": "~Web",
        "path": data.url,
        "chunks": 4
    }
    cols[col_idx]["files"].append(file_obj)
    write_json(COLLECTIONS_FILE, cols)
    return {"success": True, "file": file_obj}
