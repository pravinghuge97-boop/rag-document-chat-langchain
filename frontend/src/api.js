export const API_BASE = '/api'

export async function fetchCollections() {
  const res = await fetch(`${API_BASE}/collections`, {
    headers: { ...authHeaders() }
  })
  if (!res.ok) throw new Error('Failed to fetch collections')
  return res.json()
}

export async function createCollection(name, description) {
  const res = await fetch(`${API_BASE}/collections`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ name, description })
  })
  if (!res.ok) throw new Error('Failed to create collection')
  return res.json()
}

export async function getCollection(id) {
  const res = await fetch(`${API_BASE}/collections/${id}`, {
    headers: { ...authHeaders() }
  })
  if (!res.ok) throw new Error('Failed to get collection')
  return res.json()
}

export async function deleteCollection(id) {
  const res = await fetch(`${API_BASE}/collections/${id}`, {
    method: 'DELETE',
    headers: { ...authHeaders() }
  })
  if (!res.ok) throw new Error('Failed to delete collection')
  return res.json()
}

export async function updateCollection(id, data) {
  const res = await fetch(`${API_BASE}/collections/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data)
  })
  if (!res.ok) throw new Error('Failed to update collection')
  return res.json()
}

export async function uploadFiles(collectionId, files) {
  const formData = new FormData()
  Array.from(files).forEach(f => formData.append('files', f))
  
  const res = await fetch(`${API_BASE}/collections/${collectionId}/upload`, {
    method: 'POST',
    headers: { ...authHeaders() },
    body: formData
  })
  if (!res.ok) throw new Error('Failed to upload files')
  return res.json()
}

export async function uploadUrl(collectionId, url) {
  const res = await fetch(`${API_BASE}/collections/${collectionId}/upload-url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ url })
  })
  if (!res.ok) throw new Error('Failed to upload url')
  return res.json()
}

export function authHeaders() {
  const token = localStorage.getItem('rag_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function getPipelines() {
  const res = await fetch(`${API_BASE}/pipeline`, {
    headers: { ...authHeaders() }
  })
  if (!res.ok) throw new Error('Failed to fetch pipelines')
  return res.json()
}

export async function deletePipeline(id) {
  const res = await fetch(`${API_BASE}/pipeline/${id}`, {
    method: 'DELETE',
    headers: { ...authHeaders() }
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to delete pipeline' }))
    throw new Error(err.detail || 'Failed to delete pipeline')
  }
  return res.json()
}

export async function updatePipeline(id, data) {
  const res = await fetch(`${API_BASE}/pipeline/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data)
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to update pipeline' }))
    throw new Error(err.detail || 'Failed to update pipeline')
  }
  return res.json()
}

// Note: runPipeline uses EventSource in the component for SSE streaming, 
// so we don't put a simple fetch wrapper here for the POST request unless we 
// manage the EventSource entirely here. We'll handle it in the PipelinePage component.

export async function sendChat(collectionId, query, llmModel) {
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ collectionId, query, llmModel })
  })
  if (!res.ok) {
     const error = await res.json().catch(() => ({}))
     throw new Error(error.detail || 'Failed to send chat')
  }
  return res.json()
}

export async function fetchDashboardStats() {
  const res = await fetch(`${API_BASE}/dashboard/stats`, {
    headers: { ...authHeaders() }
  })
  if (!res.ok) throw new Error('Failed to fetch stats')
  return res.json()
}

export async function login(identifier, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password })
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Login failed')
  }
  return res.json()
}

export async function signup(email, password) {
  const res = await fetch(`${API_BASE}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Signup failed')
  }
  return res.json()
}

export async function getMe() {
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: { ...authHeaders() }
  })
  if (!res.ok) {
    throw new Error('Failed to load current user')
  }
  return res.json()
}

export async function getUsers() {
  const res = await fetch(`${API_BASE}/auth/users`, {
    headers: { ...authHeaders() }
  })
  if (!res.ok) throw new Error('Failed to fetch users')
  return res.json()
}

export async function deleteUser(userId) {
  const res = await fetch(`${API_BASE}/auth/users/${userId}`, {
    method: 'DELETE',
    headers: { ...authHeaders() }
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to delete user' }))
    throw new Error(err.detail || 'Failed to delete user')
  }
  return res.json()
}

export async function deleteFile(collectionId, fileId) {
  const res = await fetch(`${API_BASE}/collections/${collectionId}/files/${fileId}`, {
    method: 'DELETE',
    headers: { ...authHeaders() }
  })
  if (!res.ok) throw new Error('Failed to delete file')
  return res.json()
}
