import { useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import AppLayout from '../components/AppLayout'
import ConfirmModal from '../components/ConfirmModal'
import * as api from '../api'
import './CollectionDetailPage.css'

const FILE_ICONS = { pdf: '📋', txt: '📝', url: '🌐', default: '📄' }
const FILE_BADGES = { pdf: 'badge-yellow', txt: 'badge-green', url: 'badge-cyan' }

export default function CollectionDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getCollection, refreshCollections } = useApp()
  const collection = getCollection(id)

  const [showAddMenu,   setShowAddMenu]   = useState(false)
  const [showUrlModal,  setShowUrlModal]  = useState(false)
  const [newUrl,        setNewUrl]        = useState('')
  const [view,          setView]          = useState('grid') // 'grid' | 'list'
  const [selectedFolder,setSelectedFolder]= useState(null)
  const [uploading,     setUploading]     = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null) // { fileId, fileName }
  const fileInputRef   = useRef()
  const folderInputRef = useRef()

  if (!collection) return (
    <AppLayout title="Collection Not Found">
      <div style={{ textAlign:'center', padding:'4rem' }}>
        <p>Collection not found.</p>
        <button className="btn btn-ghost" onClick={() => navigate('/collections')}>← Back</button>
      </div>
    </AppLayout>
  )

  // Filter files shown based on selected folder
  const displayedFiles = selectedFolder
    ? collection.files.filter(f => {
        const fld = collection.folders.find(fl => fl.id === selectedFolder)
        return fld?.fileIds.includes(f.id)
      })
    : collection.files

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return
    setUploading(true)
    try {
      await api.uploadFiles(collection.id, files)
      await refreshCollections()
    } catch(err) {
      console.error(err)
    } finally {
      setUploading(false)
      setShowAddMenu(false)
      if (fileInputRef.current) fileInputRef.current.value = null
    }
  }

  const handleFolderUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return
    setUploading(true)
    try {
      // In a real app we might pass folder structure too, but keeping it simple for now
      await api.uploadFiles(collection.id, files)
      await refreshCollections()
    } catch(err) {
      console.error(err)
    } finally {
      setUploading(false)
      setShowAddMenu(false)
      if (folderInputRef.current) folderInputRef.current.value = null
    }
  }

  const handleAddUrl = async () => {
    if (!newUrl.trim()) return
    setUploading(true)
    try {
      await api.uploadUrl(collection.id, newUrl.trim())
      await refreshCollections()
      setNewUrl('')
      setShowUrlModal(false)
    } catch (err) {
      console.error(err)
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteFile = (fileId, fileName) => {
    setConfirmDelete({ fileId, fileName })
  }

  const handleConfirmDeleteFile = async () => {
    if (!confirmDelete) return
    const { fileId } = confirmDelete
    setConfirmDelete(null)
    try {
      await api.deleteFile(collection.id, fileId)
      await refreshCollections()
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <AppLayout
      title={collection.name}
      actions={
        <div style={{ display:'flex', gap:'0.75rem', alignItems:'center' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/collections')}>← Collections</button>
          <button
            className="btn btn-primary"
            id="start-pipeline-from-collection"
            onClick={() => navigate(`/pipeline?collection=${collection.id}`)}
          >
            🔧 Create Pipeline
          </button>
        </div>
      }
    >
      <div className="coldet-page animate-fade-in">

        {/* Info bar */}
        <div className="coldet-info card">
          <div className="coldet-info-icon">
            {collection.type === 'pdf' ? '📋' : collection.type === 'url' ? '🌐' : '📁'}
          </div>
          <div className="coldet-info-text">
            <div className="coldet-info-desc">{collection.description || 'No description'}</div>
            <div className="coldet-info-meta">
              {collection.files.length} files · {collection.folders.length} folders ·
              {collection.files.reduce((s,f) => s + (f.chunks||0), 0)} chunks · Created {collection.createdAt}
            </div>
          </div>
        </div>

        <div className="coldet-body">
          {/* Left: Folder tree */}
          <aside className="coldet-tree">
            <div className="coldet-tree-header">
              <span>📂 Folders</span>
            </div>
            <div
              className={`coldet-tree-item${!selectedFolder ? ' active' : ''}`}
              onClick={() => setSelectedFolder(null)}
            >
              <span>📁</span> All Files
              <span className="coldet-tree-count">{collection.files.length}</span>
            </div>
            {collection.folders.map(fld => (
              <div
                key={fld.id}
                className={`coldet-tree-item${selectedFolder === fld.id ? ' active' : ''}`}
                onClick={() => setSelectedFolder(fld.id)}
              >
                <span>📂</span> {fld.name}
                <span className="coldet-tree-count">{fld.fileIds.length}</span>
              </div>
            ))}
          </aside>

          {/* Right: Files */}
          <div className="coldet-files">
            <div className="coldet-files-toolbar">
              <span className="coldet-files-title">
                {selectedFolder
                  ? collection.folders.find(f => f.id === selectedFolder)?.name
                  : 'All Files'} ({displayedFiles.length})
              </span>
              <div style={{ display:'flex', gap:'0.5rem', alignItems:'center' }}>
                {/* View toggle */}
                <div className="coldet-view-toggle">
                  <button className={`btn btn-sm ${view==='grid' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setView('grid')}>⊞</button>
                  <button className={`btn btn-sm ${view==='list' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setView('list')}>☰</button>
                </div>

                {/* Add menu */}
                <div className="coldet-add-wrap">
                  <button
                    id="add-files-btn"
                    className="btn btn-primary btn-sm"
                    onClick={() => setShowAddMenu(m => !m)}
                  >
                    + Add ▾
                  </button>
                  {showAddMenu && (
                    <div className="coldet-add-menu animate-scale-in">
                      <button
                        id="add-folder-option"
                        className="coldet-add-option"
                        onClick={() => { folderInputRef.current?.click(); setShowAddMenu(false) }}
                      >
                        <span>📂</span> Upload Folder
                      </button>
                      <button
                        id="add-file-option"
                        className="coldet-add-option"
                        onClick={() => { fileInputRef.current?.click(); setShowAddMenu(false) }}
                      >
                        <span>📄</span> Upload File(s)
                      </button>
                      <button
                        id="add-url-option"
                        className="coldet-add-option"
                        onClick={() => { setShowUrlModal(true); setShowAddMenu(false) }}
                      >
                        <span>🌐</span> Add URL
                      </button>
                    </div>
                  )}
                  {/* Hidden inputs */}
                  <input ref={fileInputRef}   type="file"   multiple style={{ display:'none' }} onChange={handleFileUpload}
                    accept=".txt,.pdf,.md,.doc,.docx" />
                  <input ref={folderInputRef} type="file"   style={{ display:'none' }} onChange={handleFolderUpload}
                    webkitdirectory="true" directory="true" multiple />
                </div>
              </div>
            </div>

            {/* Files display */}
            {displayedFiles.length === 0 ? (
              <div className="coldet-empty">
                <div>📂</div>
                <p>No files here yet. Click <strong>+ Add</strong> to upload files or folders.</p>
              </div>
            ) : view === 'grid' ? (
              <div className="coldet-files-grid">
                {displayedFiles.map((f, i) => (
                  <div key={f.id} className="coldet-file-card animate-fade-in" style={{ animationDelay: `${i * 0.05}s`, position: 'relative' }}>
                    <button
                      className="coldet-file-delete-btn"
                      style={{ position: 'absolute', top: '8px', right: '8px', background: 'transparent', border: 'none', color: '#ff4d4f', cursor: 'pointer', fontSize: '1rem', padding: '4px', zIndex: 1 }}
                      onClick={(e) => { e.stopPropagation(); handleDeleteFile(f.id, f.name); }}
                      title="Delete file"
                    >
                      🗑️
                    </button>
                    <div className="coldet-file-icon">{FILE_ICONS[f.type] || FILE_ICONS.default}</div>
                    <div className="coldet-file-name" title={f.name}>{f.name}</div>
                    <div className="coldet-file-meta">{f.size}</div>
                    <span className={`badge ${FILE_BADGES[f.type] || 'badge-purple'}`}>{f.type}</span>
                    <div className="coldet-file-chunks">{f.chunks} chunk{f.chunks !== 1 ? 's' : ''}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="coldet-files-list">
                {displayedFiles.map((f, i) => (
                  <div key={f.id} className="coldet-file-row animate-fade-in" style={{ animationDelay: `${i * 0.04}s`, display: 'flex', alignItems: 'center' }}>
                    <span className="coldet-file-row-icon">{FILE_ICONS[f.type] || FILE_ICONS.default}</span>
                    <span className="coldet-file-row-name" style={{ flex: 1 }}>{f.name}</span>
                    <span className={`badge ${FILE_BADGES[f.type] || 'badge-purple'}`} style={{ marginRight: '1rem' }}>{f.type}</span>
                    <span className="coldet-file-row-size" style={{ marginRight: '1rem' }}>{f.size}</span>
                    <span className="coldet-file-row-chunks" style={{ marginRight: '1rem' }}>{f.chunks} chunks</span>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ color: '#ff4d4f', border: 'none', background: 'transparent', cursor: 'pointer', padding: '4px' }}
                      onClick={(e) => { e.stopPropagation(); handleDeleteFile(f.id, f.name); }}
                      title="Delete file"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* URL Modal */}
      {showUrlModal && (
        <div className="modal-overlay" onClick={() => setShowUrlModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🌐 Add URL Source</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowUrlModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="modal-field">
                <label className="modal-label">URL</label>
                <input
                  id="add-url-input"
                  className="input"
                  placeholder="https://www.example.com/page"
                  value={newUrl}
                  onChange={e => setNewUrl(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddUrl()}
                  autoFocus
                />
                <small style={{ color:'var(--clr-text-3)', fontSize:'0.72rem' }}>
                  Uses WebBaseLoader (like the notebook example with unistacksolutions.com)
                </small>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowUrlModal(false)}>Cancel</button>
              <button id="add-url-confirm-btn" className="btn btn-primary" onClick={handleAddUrl} disabled={!newUrl.trim()}>
                🌐 Add URL
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!confirmDelete}
        title="Delete File"
        message={confirmDelete ? `Are you sure you want to delete "${confirmDelete.fileName}"? This action cannot be undone.` : ''}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleConfirmDeleteFile}
        onCancel={() => setConfirmDelete(null)}
      />
    </AppLayout>
  )
}
