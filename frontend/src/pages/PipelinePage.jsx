import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import AppLayout from '../components/AppLayout'
import ConfirmModal from '../components/ConfirmModal'
import * as api from '../api'
import { API_BASE, authHeaders } from '../api'
import './PipelinePage.css'

const EMBEDDING_MODELS = ['all-MiniLM-L6-v2', 'all-mpnet-base-v2', 'paraphrase-MiniLM-L3-v2']
const LLM_MODELS       = ['llama-3.3-70b-versatile', 'llama3-8b-8192', 'mixtral-8x7b-32768', 'gemma-7b-it']
const VECTOR_DBS       = ['ChromaDB', 'FAISS', 'Qdrant', 'Pinecone']

const PIPELINE_STEPS_DEF = [
  {
    id: 1, icon: '📂', title: 'Load Documents',
    desc: 'Select source collection with TXT, PDF, or URL files',
    // detail: 'Using LangChain: TextLoader, PyMuPDFLoader, WebBaseLoader, DirectoryLoader',
    duration: 1500,
  },
  {
    id: 2, icon: '✂️', title: 'Chunk Text',
    desc: 'Split documents into overlapping chunks',
    // detail: 'RecursiveCharacterTextSplitter with custom chunk_size and chunk_overlap',
    duration: 1200,
  },
  {
    id: 3, icon: '🧮', title: 'Create Embeddings',
    desc: 'Generate vector embeddings using SentenceTransformer',
    // detail: 'all-MiniLM-L6-v2 model → 384-dimensional dense vectors, normalized',
    duration: 2000,
  },
  {
    id: 4, icon: '🗄️', title: 'Store in Vector DB',
    desc: 'Persist embeddings in ChromaDB collection',
    // detail: 'PersistentClient → get_or_create_collection → add documents with UUIDs',
    duration: 1000,
  },
  {
    id: 5, icon: '🔍', title: 'Similarity Search',
    desc: 'Query with cosine similarity threshold filtering',
    // detail: 'RagRetriever: query_embeddings → n_results → filter by score_threshold=0.0',
    duration: 800,
  },
  {
    id: 6, icon: '💬', title: 'Generate LLM Response',
    desc: 'Send retrieved context to Groq LLM',
    // detail: 'ChatGroq: llama-3.3-70b-versatile → context prompt → AI response',
    duration: 1800,
  },
]

// Step status
const STATUS = { idle: 'idle', running: 'running', done: 'done', error: 'error' }

export default function PipelinePage() {
  const [searchParams] = useSearchParams()
  const preselectedColId = searchParams.get('collection')
  const navigate = useNavigate()
  const { collections, pipelines, createPipeline, updatePipelineStatus, getPipeline, refreshPipelines, deletePipeline, updatePipeline } = useApp()

  // Config
  const [pipelineName,    setPipelineName]    = useState('My RAG Pipeline')
  const [selectedColId,   setSelectedColId]   = useState(preselectedColId || (collections[0]?.id || ''))
  const [sourceType,      setSourceType]      = useState('folder')
  const [chunkSize,       setChunkSize]       = useState(1000)
  const [chunkOverlap,    setChunkOverlap]    = useState(200)
  const [embeddingModel,  setEmbeddingModel]  = useState(EMBEDDING_MODELS[0])
  const [vectorDb,        setVectorDb]        = useState(VECTOR_DBS[0])
  const [llmModel,        setLlmModel]        = useState(LLM_MODELS[0])
  const [topK,            setTopK]            = useState(5)
  const [threshold,       setThreshold]       = useState(0.3)

  // Run state
  const [pipeline,     setPipeline]     = useState(null)
  const [stepStatuses, setStepStatuses] = useState({})
  const [currentStep,  setCurrentStep]  = useState(0)
  const [running,      setRunning]      = useState(false)
  const [completed,    setCompleted]    = useState(false)
  const [errorState,   setErrorState]   = useState(false)
  const [logs,         setLogs]         = useState([])

  const selectedCol = collections.find(c => c.id === selectedColId)

  const addLog = (msg) => setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), msg }])

  const [deleteModal, setDeleteModal] = useState({ open: false, pipeline: null })
  const [editModal, setEditModal] = useState({ open: false, pipeline: null, name: '' })

  const openEditPipelineModal = (pipe) => {
    setEditModal({ open: true, pipeline: pipe, name: pipe.name || '' })
  }

  const closeEditPipelineModal = () => {
    setEditModal({ open: false, pipeline: null, name: '' })
  }

  const confirmEditPipeline = async () => {
    if (!editModal.pipeline) return
    const trimmedName = editModal.name.trim()
    if (!trimmedName || trimmedName === editModal.pipeline.name) {
      closeEditPipelineModal()
      return
    }

    try {
      await updatePipeline(editModal.pipeline.id, { name: trimmedName })
      closeEditPipelineModal()
    } catch (err) {
      console.error(err)
      alert('Failed to update pipeline name.')
    }
  }

  const openDeletePipelineModal = (pipe) => {
    setDeleteModal({ open: true, pipeline: pipe })
  }

  const closeDeletePipelineModal = () => {
    setDeleteModal({ open: false, pipeline: null })
  }

  const confirmDeletePipeline = async () => {
    if (!deleteModal.pipeline) return

    try {
      await deletePipeline(deleteModal.pipeline.id)
      closeDeletePipelineModal()
    } catch (err) {
      console.error(err)
      alert('Failed to delete pipeline.')
    }
  }

  const runPipeline = async () => {
    if (!selectedColId) return
    setRunning(true)
    setCompleted(false)
    setErrorState(false)
    setStepStatuses({})
    setCurrentStep(0)
    setLogs([])

    const config = {
      name: pipelineName,
      collectionId: selectedColId,
      collectionName: selectedCol?.name,
      sourceType,
      chunkSize, chunkOverlap,
      embeddingModel, vectorDb, llmModel,
    }

    const p = createPipeline(config)
    setPipeline(p)

    // Make the initial POST request using fetch
    try {
      const res = await fetch(`${API_BASE}/pipeline/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(config)
      })
      if (!res.ok) throw new Error('Failed to start pipeline')
      
      const { jobId } = await res.json()
      
      // Connect to SSE stream
      const token = localStorage.getItem('rag_token')
      const eventSource = new EventSource(`${API_BASE}/pipeline/stream/${jobId}?token=${encodeURIComponent(token || '')}`)
      
      eventSource.addEventListener('step', (e) => {
        const d = JSON.parse(e.data)
        setCurrentStep(d.step)
        setStepStatuses(prev => ({ ...prev, [d.step]: d.status }))
        addLog(d.log)
      })
      
      eventSource.addEventListener('log', (e) => {
        // e.data is already string from JSON.dumps, we parse it if it is JSON or keep as string
        let logMsg = e.data
        try { logMsg = JSON.parse(e.data) } catch (err) {}
        addLog(logMsg)
      })
      
      eventSource.addEventListener('complete', async (e) => {
        const d = JSON.parse(e.data)
        updatePipelineStatus(p.id, 'done', {
          totalDocs: selectedCol?.files.length || 0,
          totalChunks: d.chunks || 0,
        })
        await refreshPipelines()
        addLog('🎉 Pipeline completed successfully! Ready for chat.')
        setRunning(false)
        setCompleted(true)
        setPipeline(prev => ({ ...prev, status: 'done', id: d.pipelineId }))
        eventSource.close()
      })
      
      eventSource.addEventListener('error', (e) => {
        let errMsg = e.data
        try { errMsg = JSON.parse(e.data) } catch (err) {}
        addLog(`❌ Error: ${errMsg}`)
        setRunning(false)
        setErrorState(true)
        eventSource.close()
      })
      
    } catch (err) {
      console.error(err)
      addLog(`❌ Error starting pipeline: ${err.message}`)
      setRunning(false)
      setErrorState(true)
    }
  }

  const getStepStatus = (id) => stepStatuses[id] || STATUS.idle
  const progressPct = completed ? 100 : Math.round((Object.values(stepStatuses).filter(s => s === STATUS.done).length / 6) * 100)

  return (
    <AppLayout title="Pipeline Builder">
      <div className="pipe-page animate-fade-in">

        {!running && !completed && !errorState && (
          /* ── CONFIG PANEL ── */
          <div className="pipe-config">
            <div className="pipe-config-main">
              <h2 className="pipe-section-title">⚙️ Configure Pipeline</h2>

              {/* Name */}
              <div className="pipe-field">
                <label className="pipe-label">Pipeline Name</label>
                <input id="pipeline-name-input" className="input" value={pipelineName}
                  onChange={e => setPipelineName(e.target.value)} placeholder="My RAG Pipeline" />
              </div>

              {/* Collection */}
              <div className="pipe-field">
                <label className="pipe-label">📁 Source Collection</label>
                <div className="pipe-col-grid">
                  {collections.map(c => (
                    <div
                      key={c.id}
                      id={`select-collection-${c.id}`}
                      className={`pipe-col-card${selectedColId === c.id ? ' selected' : ''}`}
                      onClick={() => setSelectedColId(c.id)}
                    >
                      <div className="pipe-col-card-top">
                        <span className="pipe-col-card-icon">
                          {c.type === 'pdf' ? '📋' : c.type === 'url' ? '🌐' : '📁'}
                        </span>
                        {selectedColId === c.id && <span className="pipe-col-card-check">✓</span>}
                      </div>
                      <div className="pipe-col-card-name">{c.name}</div>
                      <div className="pipe-col-card-meta">{c.files.length} files</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Source type */}
              {/* <div className="pipe-field">
                <label className="pipe-label">Source Type</label>
                <div className="pipe-toggle-group">
                  {['folder','file','url'].map(t => (
                    <button
                      key={t}
                      id={`source-type-${t}`}
                      className={`pipe-toggle${sourceType === t ? ' active' : ''}`}
                      onClick={() => setSourceType(t)}
                    >
                      {t === 'folder' ? '📂 Folder' : t === 'file' ? '📄 File' : '🌐 URL'}
                    </button>
                  ))}
                </div>
              </div> */}

              {/* Chunking */}
              <div className="pipe-row">
                <div className="pipe-field">
                  <label className="pipe-label">Chunk Size <span className="pipe-val">{chunkSize}</span></label>
                  <input type="range" min="200" max="2000" step="100" value={chunkSize}
                    onChange={e => setChunkSize(+e.target.value)} className="pipe-slider" />
                </div>
                <div className="pipe-field">
                  <label className="pipe-label">Chunk Overlap <span className="pipe-val">{chunkOverlap}</span></label>
                  <input type="range" min="0" max="500" step="50" value={chunkOverlap}
                    onChange={e => setChunkOverlap(+e.target.value)} className="pipe-slider" />
                </div>
              </div>

              {/* Models */}
              <div className="pipe-row">
                <div className="pipe-field">
                  <label className="pipe-label">🧮 Embedding Model</label>
                  <select id="embedding-model-select" className="input" value={embeddingModel}
                    onChange={e => setEmbeddingModel(e.target.value)}>
                    {EMBEDDING_MODELS.map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
                <div className="pipe-field">
                  <label className="pipe-label">🗄️ Vector Database</label>
                  <select id="vector-db-select" className="input" value={vectorDb}
                    onChange={e => setVectorDb(e.target.value)}>
                    {VECTOR_DBS.map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
              </div>

              <div className="pipe-row">
                <div className="pipe-field">
                  <label className="pipe-label">💬 LLM Model</label>
                  <select id="llm-model-select" className="input" value={llmModel}
                    onChange={e => setLlmModel(e.target.value)}>
                    {LLM_MODELS.map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
                <div className="pipe-field">
                  <label className="pipe-label">Top-K <span className="pipe-val">{topK}</span></label>
                  <input type="range" min="1" max="10" step="1" value={topK}
                    onChange={e => setTopK(+e.target.value)} className="pipe-slider" />
                </div>
              </div>

              <button
                id="start-pipeline-btn"
                className="btn btn-primary btn-lg pipe-start-btn"
                onClick={runPipeline}
                // disabled={!selectedColId || !selectedCol || selectedCol.files.length === 0}
              >
                🚀 Start Pipeline
              </button>
            </div>

            {/* Steps preview */}
            <div className="pipe-steps-preview">
              <h3 className="pipe-section-title">📋 Pipeline Steps</h3>
              {PIPELINE_STEPS_DEF.map((s, i) => (
                <div key={s.id} className="pipe-step-preview-item">
                  <div className="pipe-step-preview-num">{s.id}</div>
                  <div>
                    <div className="pipe-step-preview-title">{s.icon} {s.title}</div>
                    <div className="pipe-step-preview-desc">{s.desc}</div>
                  </div>
                  {i < PIPELINE_STEPS_DEF.length - 1 && <div className="pipe-step-preview-line" />}
                </div>
              ))}
            </div>
          </div>
        )}

        {!running && !completed && !errorState && pipelines.length > 0 && (
          <div className="pipe-existing-list">
            <h3 className="pipe-section-title">📚 Pipelines</h3>
            <div className="pipe-list-grid">
              {pipelines.map((pipe, i) => (
                <div key={pipe.id} className="pipe-list-card" style={{ animationDelay: `${i * 0.06}s` }}>
                  <div className="pipe-list-card-row">
                    <div>
                      <div className="pipe-list-card-title">{pipe.name}</div>
                      <div className="pipe-list-card-subtitle">{pipe.collectionName || 'No collection selected'}</div>
                    </div>
                    <div className="pipe-list-card-actions">
                      <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/chat/${pipe.id}`)}>Open</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEditPipelineModal(pipe)}>Edit</button>
                      <button className="btn btn-ghost btn-sm" style={{ color: '#ef4444' }} onClick={() => openDeletePipelineModal(pipe)}>Delete</button>
                    </div>
                  </div>
                  <div className="pipe-list-card-meta">
                    <span>Status: {pipe.status}</span>
                    <span>Embedding: {pipe.embeddingModel}</span>
                    <span>LLM: {pipe.llmModel}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {(running || completed || errorState) && (
          /* ── RUN PANEL ── */
          <div className="pipe-run">
            {/* Header */}
            <div className="pipe-run-header">
              <div>
                <h2>{pipelineName}</h2>
                <p>{selectedCol?.name} · {embeddingModel} · {llmModel}</p>
              </div>
              {completed && (
                <button
                  id="open-chat-btn"
                  className="btn btn-primary btn-lg animate-pulse-glow"
                  onClick={() => navigate(`/chat/${pipeline?.id}`)}
                >
                  💬 Open Chat →
                </button>
              )}
            </div>

            {/* Progress bar */}
            <div className="pipe-progress-bar-wrap">
              <div className="pipe-progress-label">
                <span>{running ? `Step ${currentStep} of 6` : '✅ Completed!'}</span>
                <span>{progressPct}%</span>
              </div>
              <div className="pipe-progress-track">
                <div className="pipe-progress-fill" style={{ width: `${progressPct}%` }} />
              </div>
            </div>

            {/* Steps */}
            <div className="pipe-run-steps">
              {PIPELINE_STEPS_DEF.map(s => {
                const status = getStepStatus(s.id)
                return (
                  <div key={s.id} className={`pipe-run-step pipe-run-step-${status}`}>
                    <div className="pipe-run-step-status">
                      {status === STATUS.idle    && <span className="pipe-step-dot pipe-step-dot-idle">○</span>}
                      {status === STATUS.running  && <span className="pipe-step-dot pipe-step-dot-run animate-spin">◎</span>}
                      {status === STATUS.done     && <span className="pipe-step-dot pipe-step-dot-done">✓</span>}
                    </div>
                    <div className="pipe-run-step-icon">{s.icon}</div>
                    <div className="pipe-run-step-body">
                      <div className="pipe-run-step-title">{s.title}</div>
                      <div className="pipe-run-step-detail">{s.detail}</div>
                    </div>
                    <div className="pipe-run-step-tag">
                      {status === STATUS.idle    && <span className="badge badge-purple">Pending</span>}
                      {status === STATUS.running  && <span className="badge badge-yellow">Running…</span>}
                      {status === STATUS.done     && <span className="badge badge-green">Done</span>}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Logs */}
            <div className="pipe-logs">
              <div className="pipe-logs-header">📟 Console Output</div>
              <div className="pipe-logs-body" id="pipe-logs-body">
                {logs.map((l, i) => (
                  <div key={i} className="pipe-log-line animate-fade-in">
                    <span className="pipe-log-time">[{l.time}]</span>
                    <span>{l.msg}</span>
                  </div>
                ))}
                {running && <div className="pipe-log-cursor" />}
              </div>
            </div>

            {/* Completed summary */}
            {completed && (
              <div className="pipe-complete-banner animate-fade-in">
                <div className="pipe-complete-icon">🎉</div>
                <div className="pipe-complete-text">
                  <strong>Pipeline Ready!</strong>
                  <span>{selectedCol?.files.length} docs loaded · {selectedCol?.files.reduce((s,f)=>s+(f.chunks||1),0)} chunks · {embeddingModel} embeddings · {vectorDb} stored</span>
                </div>
                <button
                  id="open-chat-complete-btn"
                  className="btn btn-primary"
                  onClick={() => navigate(`/chat/${pipeline?.id}`)}
                >
                  💬 Start Chatting
                </button>
              </div>
            )}
          </div>
        )}
        </div>

        <ConfirmModal
          open={deleteModal.open}
          title="Delete Pipeline"
          message={deleteModal.pipeline ? `Delete pipeline "${deleteModal.pipeline.name}"? This removes it from the app but keeps your underlying document data.` : ''}
          confirmLabel="Delete"
          cancelLabel="Cancel"
          variant="danger"
          onConfirm={confirmDeletePipeline}
          onCancel={closeDeletePipelineModal}
        />

        {editModal.open && (
          <div className="modal-overlay" onClick={closeEditPipelineModal}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Edit Pipeline Name</h3>
                <button className="btn btn-ghost btn-icon" onClick={closeEditPipelineModal}>✕</button>
              </div>
              <div className="modal-body">
                <div className="modal-field">
                  <label className="modal-label">Pipeline Name</label>
                  <input
                    className="input"
                    value={editModal.name}
                    onChange={e => setEditModal(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter pipeline name"
                    autoFocus
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-ghost" onClick={closeEditPipelineModal}>Cancel</button>
                <button className="btn btn-primary" onClick={confirmEditPipeline}>Save</button>
              </div>
            </div>
          </div>
        )}
      </AppLayout>
  )
}

