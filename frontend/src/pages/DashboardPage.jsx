import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import AppLayout from '../components/AppLayout'
import * as api from '../api'
import './DashboardPage.css'

const STATS = [
  { icon: '📁', label: 'Collections',    color: '#6C63FF', key: 'collections' },
  { icon: '📄', label: 'Total Files',    color: '#00D4FF', key: 'files'       },
  { icon: '🔧', label: 'Pipelines Run',  color: '#10B981', key: 'pipelines'   },
  { icon: '🧠', label: 'Total Chunks',   color: '#F59E0B', key: 'chunks'      },
]

const PIPELINE_STEPS = [
  { id: 1, icon: '📂', title: 'Load Documents',    desc: 'TXT, PDF, URL sources' },
  { id: 2, icon: '✂️',  title: 'Chunk Text',        desc: 'RecursiveCharacterTextSplitter' },
  { id: 3, icon: '🧮', title: 'Create Embeddings', desc: 'all-MiniLM-L6-v2 (384 dims)' },
  { id: 4, icon: '🗄️',  title: 'Vector Store',      desc: 'ChromaDB PersistentClient' },
  { id: 5, icon: '🔍', title: 'Similarity Search', desc: 'Cosine similarity + threshold' },
  { id: 6, icon: '💬', title: 'LLM Response',      desc: 'Groq llama-3.3-70b-versatile' },
]

export default function DashboardPage() {
  const { collections, pipelines } = useApp()
  const navigate = useNavigate()
  const [statsValues, setStatsValues] = useState({
    collections: 0, files: 0, pipelines: 0, chunks: 0
  })

  useEffect(() => {
    api.fetchDashboardStats().then(setStatsValues).catch(console.error)
  }, [])


  return (
    <AppLayout title="Dashboard">
      <div className="dash-page animate-fade-in">

         <section className="dash-section">
          <div className="dash-workflow-overview">
            <h3 className="dash-workflow-title">🔗 RAG Pipeline Overview</h3>
            <div className="dash-workflow-steps">
              {PIPELINE_STEPS.map((step, idx) => (
                <div key={step.id} className="dash-workflow-step">
                  <div className="dash-workflow-step-num">{step.id}</div>
                  <div className="dash-workflow-step-icon">{step.icon}</div>
                  <div className="dash-workflow-step-label">{step.title}</div>
                  {/* <div className="dash-workflow-step-desc">{step.desc}</div> */}
                  {idx < PIPELINE_STEPS.length - 1 && (
                    <div className="dash-workflow-connector" />
                  )}
                </div>
              ))}
            {/* <button className="btn btn-primary btn-lg" id="dash-create-pipeline-btn" onClick={() => navigate('/pipeline')}>
              + Create Pipeline
            </button> */}
            </div>
          </div>
        </section>


        {/* Stats grid */}
        <div className="dash-stats">
          {STATS.map((s, i) => (
            <div key={s.key} className="dash-stat card animate-fade-in" style={{ animationDelay: `${i * 0.07}s` }}>
              <div className="dash-stat-icon" style={{ color: s.color }}>
                {s.icon}
              </div>
              <div className="dash-stat-value" style={{ color: s.color }}>{statsValues[s.key]}</div>
              <div className="dash-stat-label">{s.label}</div>
              <div className="dash-stat-bar">
                <div className="dash-stat-bar-fill" style={{ background: s.color, width: `${Math.min(statsValues[s.key] * 10, 100)}%` }} />
              </div>
            </div>
          ))}
        </div>

        {/* RAG Pipeline diagram */}
       
        {/* Collections quick access */}
        <div className="dash-bottom">
          <section className="dash-section dash-section-half">
            <div className="dash-section-header">
              <h3>📁 Recent Collections</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/collections')}>View all</button>
            </div>
            <div className="dash-collections-list">
              {collections.slice(0, 2).map(c => (
                <div key={c.id} className="dash-col-item" onClick={() => navigate(`/collections/${c.id}`)}>
                  <div className="dash-col-item-icon">
                    {c.type === 'pdf' ? '📋' : c.type === 'url' ? '🌐' : '📁'}
                  </div>
                  <div className="dash-col-item-info">
                    <div className="dash-col-item-name">{c.name}</div>
                    <div className="dash-col-item-meta">{c.files.length} files · {c.createdAt}</div>
                  </div>
                  <span className={`badge badge-${c.type === 'pdf' ? 'yellow' : c.type === 'url' ? 'cyan' : 'purple'}`}>
                    {c.type}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="dash-section dash-section-half">
            <div className="dash-section-header">
              <h3>🔧 Recent Pipelines</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/pipeline')}>New pipeline</button>
            </div>
            {pipelines.length === 0 ? (
              <div className="dash-empty">
                <div className="dash-empty-icon">🔧</div>
                <p>No pipelines yet. Create your first RAG pipeline!</p>
                <button className="btn btn-primary btn-sm" onClick={() => navigate('/pipeline')}>Get started</button>
              </div>
            ) : (
              <div className="dash-pipelines-list">
                {pipelines.slice(0, 2).map(p => (
                  <div key={p.id} className="dash-pipe-item">
                    <div className="status-dot" style={{ flexShrink:0,
                      background: p.status==='done'?'var(--clr-success)':p.status==='running'?'var(--clr-warning)':'var(--clr-text-3)'
                    }} />
                    <div className="dash-pipe-item-info">
                      <div className="dash-pipe-item-name">{p.name}</div>
                      <div className="dash-pipe-item-meta">{p.collectionName} · {p.embeddingModel}</div>
                    </div>
                    {p.status === 'done' && (
                      <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/chat/${p.id}`)}>💬 Chat</button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

      </div>
    </AppLayout>
  )
}
