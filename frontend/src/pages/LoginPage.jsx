import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './LoginPage.css'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [showPass, setShowPass] = useState(false)

  const { login, user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => { if (user) navigate('/dashboard') }, [user, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password.')
      return
    }
    setLoading(true)
    await new Promise(r => setTimeout(r, 800)) // simulate latency
    const result = await login(username, password)
    setLoading(false)
    if (result.success) navigate('/dashboard')
    else setError(result.error)
  }

  return (
    <div className="login-page">
      <div className="bg-mesh" />

      {/* Floating orbs */}
      <div className="login-orb login-orb-1" />
      <div className="login-orb login-orb-2" />
      <div className="login-orb login-orb-3" />

      <div className="login-container animate-fade-in">
        {/* Brand */}
        <div className="login-brand">
          <div className="login-brand-icon animate-float">⚛</div>
          <h1 className="login-brand-name gradient-text">RAG Platform</h1>
          <p className="login-brand-sub">Powered by LangChain + ChromaDB + Groq</p>
        </div>

        {/* Card */}
        <div className="login-card card-glass">
          <div className="login-card-header">
            <h2>Welcome back</h2>
            <p>Sign in to access your RAG pipelines</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form" noValidate>
            {/* Username */}
            <div className="login-field">
              <label htmlFor="login-username" className="login-label">Username</label>
              <div className="login-input-wrap">
                <span className="login-input-icon">👤</span>
                <input
                  id="login-username"
                  type="text"
                  className="input login-input"
                  placeholder="Enter username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  autoComplete="username"
                  autoFocus
                />
              </div>
            </div>

            {/* Password */}
            <div className="login-field">
              <label htmlFor="login-password" className="login-label">Password</label>
              <div className="login-input-wrap">
                <span className="login-input-icon">🔑</span>
                <input
                  id="login-password"
                  type={showPass ? 'text' : 'password'}
                  className="input login-input"
                  placeholder="Enter password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="login-eye-btn"
                  onClick={() => setShowPass(s => !s)}
                  tabIndex={-1}
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                >
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="login-error animate-fade-in" role="alert">
                <span>⚠️</span> {error}
              </div>
            )}

            {/* Submit */}
            <button
              id="login-submit-btn"
              type="submit"
              className="btn btn-primary btn-lg w-full login-submit"
              disabled={loading}
            >
              {loading ? (
                <><span className="spinner" />Authenticating...</>
              ) : (
                <>🔐 Sign In</>
              )}
            </button>

            {/* Hint */}
            {/* <div className="login-hint">
              <span>Demo credentials:</span>
              <code>admin</code> / <code>admin123</code>
            </div> */}

            <div className="login-footer-text">
              <span>New to RAG Platform?</span>
              <button type="button" className="text-link" onClick={() => navigate('/signup')}>Create an account</button>
            </div>
          </form>
        </div>

        {/* Features row */}
        {/* <div className="login-features">
          {['🧠 LangChain RAG', '📊 ChromaDB', '⚡ Groq LLM', '🔍 Semantic Search'].map(f => (
            <div key={f} className="login-feature-chip">{f}</div>
          ))}
        </div> */}
      </div>
    </div>
  )
}
