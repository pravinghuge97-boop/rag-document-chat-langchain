import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useApp } from '../context/AppContext'
import ConfirmModal from './ConfirmModal'
import './Sidebar.css'

const BoltIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
)

const FolderIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
)

const WrenchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
  </svg>
)

const UsersIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)

const ChatIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
)

const NAV_ITEMS = [
  { to: '/dashboard',   icon: <BoltIcon />, label: 'Dashboard' },
  { to: '/collections', icon: <FolderIcon />, label: 'Collections' },
  { to: '/pipeline',    icon: <WrenchIcon />, label: 'Pipeline' },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const { pipelines, sessions, activeSessionIds, updateSessionMessages } = useApp()
  const [deleteModal, setDeleteModal] = useState({ open: false, pipeline: null })
  const [selectPipelineModal, setSelectPipelineModal] = useState(false)

  const navigate = useNavigate()
  const donePipelines = pipelines.filter(p => p.status === 'done')

  const handleLogout = () => { logout(); navigate('/login') }

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
            <span className="sidebar-link-icon"><UsersIcon /></span>
            <span>Users</span>
          </NavLink>
        )}

        {/* Active Chats Header with + Button */}
        <div className="sidebar-nav-label-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'between', marginTop: '1.5rem', paddingRight: '0.5rem' }}>
          <div className="sidebar-nav-label">Active Chats</div>
          {/* <button 
             className="sidebar-add-chat-btn" 
             title="Start Chat with Pipeline"
             style={{
               marginLeft: 'auto',
               background: 'none',
               border: 'none',
               color: '#cbd5e1',
               cursor: 'pointer',
               display: 'flex',
               alignItems: 'center',
               justifyContent: 'center',
               fontSize: '1.1rem',
               opacity: 0.8,
               transition: 'opacity 0.2s',
             }}
             onClick={() => {
               if (pipelines.length === 0) {
                 alert("No pipeline available. Please create a pipeline first.");
               } else {
                 setSelectPipelineModal(true);
               }
             }}
          >
            ➕
          </button> */}
        </div>
        
        {donePipelines.length > 0 ? (
          donePipelines.map(p => (
            <NavLink
              key={p.id}
              to={`/chat/${p.id}`}
              className={({ isActive }) =>
                `sidebar-link sidebar-link-chat${isActive ? " active" : ""}`
              }
            >
              <span className="sidebar-link-icon"><ChatIcon /></span>
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
              {/* <button
                className="sidebar-chat-delete-btn"
                title="Clear Chat Messages"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDeleteModal({ open: true, pipeline: p });
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  <path d="M10 11v6M14 11v6" />
                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                </svg>
              </button> */}
            </NavLink>
          ))
        ) : (
          <div style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem', color: '#475569', fontStyle: 'italic' }}>
            No active pipelines.
          </div>
        )}
      </nav>

      <ConfirmModal
        open={deleteModal.open}
        title="Delete Chat Messages?"
        message={`Are you sure you want to clear/delete all chat messages for "${deleteModal.pipeline?.name}"? The pipeline config itself will NOT be deleted.`}
        confirmLabel="Clear"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={async () => {
          if (deleteModal.pipeline) {
            try {
              // Get the sessions for this pipeline
              const pipeSessions = sessions[deleteModal.pipeline.id] || [];
              if (pipeSessions.length > 0) {
                // Clear the messages in the active session
                const activeSessId = activeSessionIds[deleteModal.pipeline.id] || pipeSessions[0].id;
                updateSessionMessages(deleteModal.pipeline.id, activeSessId, prev => [prev[0]]);
              }
            } catch (err) {
              console.error(err);
            }
          }
          setDeleteModal({ open: false, pipeline: null });
        }}
        onCancel={() => setDeleteModal({ open: false, pipeline: null })}
      />

      {/* Select Pipeline Modal */}
      {/* {selectPipelineModal && (
        <div className="cm-overlay" onClick={() => setSelectPipelineModal(false)} role="dialog" aria-modal="true" style={{ zIndex: 1000 }}>
          <div className="cm-card cm-card--info" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px', width: '90%' }}>
            <div className="cm-icon cm-icon--info">
              <span>💬</span>
            </div>
            <div className="cm-body" style={{ width: '100%' }}>
              <h3 className="cm-title">Select RAG Pipeline</h3>
              <p className="cm-message" style={{ marginBottom: '1rem' }}>Choose a pipeline to start or open a chat session:</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto', width: '100%' }}>
                {pipelines.map(p => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setSelectPipelineModal(false);
                      navigate(`/chat/${p.id}`);
                    }}
                    style={{
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      color: '#e2e8f0',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(99, 102, 241, 0.15)';
                      e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{p.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Status: {p.status}</div>
                    </div>
                    <span>➔</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="cm-actions" style={{ marginTop: '1.5rem', justifyContent: 'flex-end', width: '100%' }}>
              <button className="cm-btn cm-btn--cancel" onClick={() => setSelectPipelineModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )} */}

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
    </aside>
  )
}