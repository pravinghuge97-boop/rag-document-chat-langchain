import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import * as api from '../api'
import AppLayout from '../components/AppLayout'
import './AdminUsersPage.css'

export default function AdminUsersPage() {
  const { user } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [viewMode, setViewMode] = useState('list')

  useEffect(() => {
    async function loadUsers() {
      try {
        const response = await api.getUsers()
        setUsers(response)
      } catch (err) {
        setError(err.message || 'Unable to load users')
      } finally {
        setLoading(false)
      }
    }
    loadUsers()
  }, [])

  const removeUser = async (id) => {
    if (!window.confirm('Delete this user?')) return
    try {
      await api.deleteUser(id)
      setUsers(prev => prev.filter(u => u.id !== id))
    } catch (err) {
      alert(err.message || 'Failed to delete user')
    }
  }

  return (
    <AppLayout title="User Management">
      <div className="dash-page animate-fade-in">
        <section className="dash-section">
          <div className="dash-section-header admin-users-header">
            <div>
              <h3>👥 Admin User Directory</h3>
              <p>Manage registered users and view their role assignments.</p>
            </div>
            <div className="admin-users-header-controls">
              <button
                type="button"
                className={viewMode === 'list' ? 'btn btn-sm btn-primary' : 'btn btn-sm btn-ghost'}
                onClick={() => setViewMode('list')}
              >
                List
              </button>
              <button
                type="button"
                className={viewMode === 'grid' ? 'btn btn-sm btn-primary' : 'btn btn-sm btn-ghost'}
                onClick={() => setViewMode('grid')}
              >
                Grid
              </button>
            </div>
          </div>

          {loading ? (
            <div className="dash-empty">
              <div className="dash-empty-icon">⏳</div>
              <p>Loading users...</p>
            </div>
          ) : error ? (
            <div className="dash-empty">
              <div className="dash-empty-icon">⚠️</div>
              <p>{error}</p>
            </div>
          ) : (
            <div className="admin-users-table-wrap">
              <div className="admin-users-table-meta">
                <span>{`Showing ${users.length} of ${users.length} users`}</span>
                <span>{new Date().toLocaleDateString()}</span>
              </div>
              <table className="admin-users-table">
                <thead>
                  <tr>
                    <th>Email Address</th>
                    <th>Username</th>
                    <th>Role</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => {
                    const initials = u.username ? u.username.slice(0, 2).toUpperCase() : 'U'
                    return (
                      <tr key={u.id} className={u.role === 'admin' ? 'admin-user-row' : ''}>
                        <td>
                          <div className="admin-user-email-cell">
                            <div className="user-avatar">{initials}</div>
                            <div>
                              <div className="admin-user-email">{u.email}</div>
                              <div className="admin-user-email-sub">{u.id}</div>
                            </div>
                          </div>
                        </td>
                        <td>{u.username}</td>
                        <td>
                          <span className={`role-pill role-pill-${u.role}`}>{u.role}</span>
                        </td>
                        <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                        <td>
                          {u.role !== 'admin' ? (
                            <button className="admin-user-action-btn delete-btn" onClick={() => removeUser(u.id)}>
                              Delete
                            </button>
                          ) : (
                            <span className="admin-user-safe">Protected</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </AppLayout>
  )
}
