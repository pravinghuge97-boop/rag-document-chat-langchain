import { useState, useEffect } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useApp } from '../context/AppContext'
import ConfirmModal from './ConfirmModal'
import './Sidebar.css'

const NAV_ITEMS = [
  { to: '/dashboard',   icon: '⚡', label: 'Dashboard' },
  { to: '/collections', icon: '📁', label: 'Collections' },
  { to: '/pipeline',    icon: '🔧', label: 'Pipeline' },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const { 
    pipelines, 
    sessions, 
    activeSessionIds, 
    createNewSession, 
    deleteSession, 
    deletePipeline,
    getCollection
  } = useApp()

  const location = useLocation()
  const donePipelines = pipelines.filter(p => p.status === 'done')

  const match = location.pathname.match(/\/chat\/([^/]+)/)
  const activePipelineId = match ? match[1] : null

  // Only one pipeline open at a time (Accordion style)
  const [openPipelineId, setOpenPipelineId] = useState(() => {
    const saved = localStorage.getItem('openPipelineId')
    return saved || null
  })

  useEffect(() => {
    if (openPipelineId) {
      localStorage.setItem('openPipelineId', openPipelineId)
    } else {
      localStorage.removeItem('openPipelineId')
    }
  }, [openPipelineId])

  const togglePipeline = (pipelineId) => {
    setOpenPipelineId(prev => prev === pipelineId ? null : pipelineId)
  }

  const isOpen = (pipelineId) => openPipelineId === pipelineId

  const handleLogout = () => { logout(); navigate('/login') }

  const [confirmModal, setConfirmModal] = useState({ open: false, type: 'session', pipelineId: null, sessionId: null, itemName: '' })

  const openDeleteChat = (e, pipelineId, sessionId, sessionName) => {
    e.stopPropagation()
    setConfirmModal({ open: true, type: 'session', pipelineId, sessionId, itemName: sessionName })
  }

  const openDeletePipeline = (e, pipelineId, pipelineName) => {
    e.stopPropagation()
    setConfirmModal({ open: true, type: 'pipeline', pipelineId, sessionId: null, itemName: pipelineName })
  }

  const handleConfirmDelete = () => {
    if (confirmModal.type === 'session') {
      deleteSession(confirmModal.pipelineId, confirmModal.sessionId)
    } else {
      deletePipeline(confirmModal.pipelineId)
      if (activePipelineId === confirmModal.pipelineId) {
        navigate('/pipeline')
      }
    }
    setConfirmModal({ open: false, type: 'session', pipelineId: null, sessionId: null, itemName: '' })
  }

  const handleCancelDelete = () => {
    setConfirmModal({ open: false, type: 'session', pipelineId: null, sessionId: null, itemName: '' })
  }

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <span>⚛</span>
        </div>
        <div>
          <div className="sidebar-logo-name">RAG Platform</div>
          <div className="sidebar-logo-sub">Unistack Solutions</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        <div className="sidebar-nav-label">Main Menu</div>
        {NAV_ITEMS.map(item => (
          <NavLink key={item.to} to={item.to} className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
            <span className="sidebar-link-icon">{item.icon}</span>
            <span>{item.label}</span>
            {item.to === '/pipeline' && donePipelines.length > 0 && (
              <span className="sidebar-badge">{donePipelines.length}</span>
            )}
          </NavLink>
        ))}
        {user?.role === 'admin' && (
          <NavLink to="/admin/users" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
            <span className="sidebar-link-icon">👥</span>
            <span>Users</span>
          </NavLink>
        )}

        {/* Active Chats */}
        {donePipelines.length > 0 && (
          <>
            <div className="sidebar-nav-label" style={{ marginTop: '1.5rem' }}>Active Chats</div>
            
            {donePipelines.map(p => {
              const isActivePipeline = activePipelineId === p.id
              const pipeSessions = sessions[p.id] || []
              const activeSessId = activeSessionIds[p.id] || ''
              const pipelineOpen = isOpen(p.id)

              return (
                <div key={p.id} style={{ display: "flex", flexDirection: "column" }}>
                  <NavLink
                    to={`/chat/${p.id}`}
                    className={({ isActive }) =>
                      `sidebar-link sidebar-link-chat${isActive ? " active" : ""}`
                    }
                    onClick={(e) => {
                      // Toggle collapse when clicking the row (but still navigate)
                      togglePipeline(p.id)
                    }}
                  >
                    <span className="sidebar-link-icon">💬</span>

                    <span
                      className="sidebar-link-chat-name"
                      style={{
                        flex: 1,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {p.name}
                    </span>


                    {isActivePipeline && (
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          const col = getCollection(p.collectionId)
                          createNewSession(
                            p.id,
                            null,
                            p.llmModel,
                            col?.name || "your documents",
                            col?.files.length || 0
                          )
                        }}
                        style={{
                          width: "22px",
                          height: "22px",
                          borderRadius: "50%",
                          border: "none",
                          background: "#6d91cb",
                          color: "#fff",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          // marginRight: "8px",
                          fontWeight: "bold",
                          flexShrink: 0,
                        }}
                        title="New Chat"
                      >
                        +
                      </button>
                    )}
                    {/* <button
                      onClick={(e) => openDeletePipeline(e, p.id, p.name)}
                      style={{
                        width: "24px",
                        height: "24px",
                        borderRadius: "50%",
                        border: "none",
                        background: "#ef4444",
                        color: "#fff",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginLeft: "6px",
                        fontWeight: "bold",
                        flexShrink: 0,
                      }}
                      title="Delete Pipeline"
                    >
                      🗑
                    </button> */}
                                        {/* Up / Down Arrow Indicator */}
                    <span style={{ 
                      // color: "#94a3b8", 
                      // fontSize: "1.1rem", 
                      // marginRight: "8px",
                       borderRadius: "50%",
                          border: "none",
                          background: "#6d91cb",
                          color: "#fff",
                          padding: "2px 4px",
                      transition: "transform 0.2s"
                    }}>
                      {pipelineOpen ? '↑' : '↓'}
                    </span>


                    {/* <span className="sidebar-link-chat-dot" /> */}
                  </NavLink>

                  {/* Sessions - shown only when this pipeline is open */}
                  {pipelineOpen && (
                    <div
                      className="sidebar-chat-sessions"
                      style={{
                        paddingLeft: "1.5rem",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.25rem",
                        marginTop: "0.25rem",
                        marginBottom: "0.5rem",
                      }}
                    >
                      {pipeSessions.map((s) => (
                        <div
                          key={s.id}
                          className={`sidebar-session-link ${s.id === activeSessId ? "active" : ""}`}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "0.45rem 0.5rem",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "0.8rem",
                            background: s.id === activeSessId ? "rgba(255,255,255,0.1)" : "transparent",
                            color: s.id === activeSessId ? "#fff" : "rgba(255,255,255,0.7)",
                          }}
                          onClick={() => setActiveSession(p.id, s.id)}
                        >
                          <span style={{ 
                            overflow: "hidden", 
                            textOverflow: "ellipsis", 
                            whiteSpace: "nowrap", 
                            maxWidth: "150px" 
                          }}>
                            💬 {s.name}
                          </span>

                          <button
                            style={{
                              // background: "transparent",
                              background: "#ef4444",
                              border: "none",
                              color: "#f9f5f5",
                              cursor: "pointer",
                              fontSize: "0.7rem",
                              borderRadius: "50px",
                              padding: "2px 6px",
                            }}
                            onClick={(e) => openDeleteChat(e, p.id, s.id, s.name)}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </>
        )}
      </nav>

      {/* Bottom user */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">
            {user?.username?.[0]?.toUpperCase() || 'A'}
          </div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.username || 'admin'}</div>
            <div className="sidebar-user-role">{user?.role || 'Admin'}</div>
          </div>
          <button className="sidebar-logout" onClick={handleLogout} title="Logout">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </div>

      <ConfirmModal
        open={confirmModal.open}
        title={confirmModal.type === 'pipeline' ? 'Delete Pipeline' : 'Delete Chat'}
        message={confirmModal.type === 'pipeline'
          ? `"${confirmModal.itemName}" pipeline and its chats will be deleted from the app.`
          : `"${confirmModal.itemName}" chat session will be permanently deleted.`
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </aside>
  )
}