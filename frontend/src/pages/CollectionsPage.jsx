import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import AppLayout from '../components/AppLayout'
import ConfirmModal from '../components/ConfirmModal'
import './CollectionsPage.css'

const TYPE_ICONS  = { pdf: '📋', txt: '📝', url: '🌐', mixed: '📁' }
const TYPE_BADGES = { pdf: 'badge-yellow', txt: 'badge-green', url: 'badge-cyan', mixed: 'badge-purple' }

export default function CollectionsPage() {
  const { collections, addCollection, deleteCollection, updateCollection } = useApp()
  const navigate = useNavigate()

  const [showModal,   setShowModal]   = useState(false)
  const [newName,     setNewName]     = useState('')
  const [newDesc,     setNewDesc]     = useState('')
  const [creating,    setCreating]    = useState(false)
  const [search,      setSearch]      = useState('')
  const [deleteModal, setDeleteModal] = useState({ open: false, collection: null })
  const [editModal,   setEditModal]   = useState({ open: false, collection: null, name: '', description: '' })

  const openDeleteModal  = (e, c) => { e.stopPropagation(); setDeleteModal({ open: true, collection: c }) }
  const closeDeleteModal = ()     => setDeleteModal({ open: false, collection: null })
  const handleConfirmDelete = async () => {
    if (!deleteModal.collection) return

    try {
      await deleteCollection(deleteModal.collection.id)
      closeDeleteModal()
    } catch (err) {
      console.error(err)
      alert('Failed to delete collection.')
    }
  }

  const openEditModal = (e, c) => {
    e.stopPropagation()
    setEditModal({ open: true, collection: c, name: c.name, description: c.description || '' })
  }
  const closeEditModal = () => setEditModal({ open: false, collection: null, name: '', description: '' })
  const handleConfirmEdit = async () => {
    if (!editModal.collection) return
    const trimmedName = editModal.name.trim()
    if (!trimmedName) return

    try {
      await updateCollection(editModal.collection.id, {
        name: trimmedName,
        description: editModal.description.trim()
      })
      closeEditModal()
    } catch (err) {
      console.error(err)
      alert('Failed to update collection.')
    }
  }

  const filtered = collections.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.description.toLowerCase().includes(search.toLowerCase())
  )

  const handleCreate = async () => {
    if (!newName.trim()) return
    setCreating(true)
    try {
      const col = await addCollection(newName.trim(), newDesc.trim())
      setShowModal(false)
      setNewName(''); setNewDesc('')
      navigate(`/collections/${col.id}`)
    } catch (err) {
      console.error(err)
    } finally {
      setCreating(false)
    }
  }

  const totalFiles = (c) => c.files.length
  const totalChunks = (c) => c.files.reduce((s, f) => s + (f.chunks || 0), 0)

  return (
    <AppLayout
      title="Collections"
      actions={
        <button id="add-collection-btn" className="btn btn-primary" onClick={() => setShowModal(true)}>
          + New Collection
        </button>
      }
    >
      <div className="cols-page animate-fade-in">

        {/* Search */}
        <div className="cols-search-wrap">
          <span className="cols-search-icon">🔍</span>
          <input
            id="collections-search"
            className="input cols-search"
            placeholder="Search collections..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="cols-empty">
            <div className="cols-empty-icon">📁</div>
            <h3>No collections found</h3>
            <p>{search ? 'Try a different search term.' : 'Create your first collection to get started.'}</p>
            {!search && <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Collection</button>}
          </div>
        ) : (
          <div className="cols-grid">
            {filtered.map((c, i) => (
              <div
                key={c.id}
                id={`collection-card-${c.id}`}
                className="cols-card card animate-fade-in"
                style={{ animationDelay: `${i * 0.07}s` }}
                onClick={() => navigate(`/collections/${c.id}`)}
              >
                <div className="cols-card-header">
                  <div className="cols-card-icon">{TYPE_ICONS[c.type] || '📁'}</div>
                  <span className={`badge ${TYPE_BADGES[c.type] || 'badge-purple'}`}>{c.type}</span>
                </div>
                <div className="cols-card-name">{c.name}</div>
                <div className="cols-card-desc">{c.description || 'No description'}</div>

                {/* Folder badges */}
                {c.folders.length > 0 && (
                  <div className="cols-card-folders">
                    {c.folders.map(fld => (
                      <span key={fld.id} className="cols-card-folder-chip">📂 {fld.name}</span>
                    ))}
                  </div>
                )}

                <div className="cols-card-stats">
                  <div className="cols-card-stat">
                    <span className="cols-card-stat-val">{totalFiles(c)}</span>
                    <span className="cols-card-stat-label">Files</span>
                  </div>
                  <div className="cols-card-stat-divider" />
                  <div className="cols-card-stat">
                    <span className="cols-card-stat-val">{totalChunks(c)}</span>
                    <span className="cols-card-stat-label">Chunks</span>
                  </div>
                  <div className="cols-card-stat-divider" />
                  <div className="cols-card-stat">
                    <span className="cols-card-stat-val">{c.createdAt}</span>
                    <span className="cols-card-stat-label">Created</span>
                  </div>
                </div>

                <div className="cols-card-footer">
                  <button
                    className="btn btn-ghost btn-sm"
                    id={`open-collection-${c.id}`}
                    onClick={e => { e.stopPropagation(); navigate(`/collections/${c.id}`) }}
                  >
                    Open Collection
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={e => openEditModal(e, c)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ color: '#f87171', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                    onClick={e => openDeleteModal(e, c)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}

            {/* Add card */}
            <div className="cols-card cols-card-add" onClick={() => setShowModal(true)}>
              <div className="cols-add-plus">+</div>
              <div className="cols-add-text">New Collection</div>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📁 Create Collection</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="modal-field">
                <label className="modal-label">Collection Name *</label>
                <input
                  id="new-collection-name"
                  className="input"
                  placeholder="e.g. Product Docs, Support KB..."
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCreate()}
                  autoFocus
                />
              </div>
              <div className="modal-field">
                <label className="modal-label">Description</label>
                <input
                  id="new-collection-desc"
                  className="input"
                  placeholder="Optional description..."
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button
                id="create-collection-confirm-btn"
                className="btn btn-primary"
                onClick={handleCreate}
                disabled={!newName.trim() || creating}
              >
                {creating ? <><span className="spinner" />Creating...</> : '📁 Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={deleteModal.open}
        title="Delete Collection"
        message={deleteModal.collection ? `Delete collection "${deleteModal.collection.name}"? This will remove it from the app and its files.` : ''}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={closeDeleteModal}
      />

      {editModal.open && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>✏️ Edit Collection</h3>
              <button className="btn btn-ghost btn-icon" onClick={closeEditModal}>✕</button>
            </div>
            <div className="modal-body">
              <div className="modal-field">
                <label className="modal-label">Collection Name *</label>
                <input
                  className="input"
                  value={editModal.name}
                  onChange={e => setEditModal(prev => ({ ...prev, name: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && handleConfirmEdit()}
                  autoFocus
                />
              </div>
              <div className="modal-field">
                <label className="modal-label">Description</label>
                <input
                  className="input"
                  value={editModal.description}
                  onChange={e => setEditModal(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={closeEditModal}>Cancel</button>
              <button className="btn btn-primary" onClick={handleConfirmEdit} disabled={!editModal.name.trim()}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
