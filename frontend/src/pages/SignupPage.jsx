import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './LoginPage.css'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const { signup, user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) {
      navigate('/dashboard')
    }
  }, [user, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      setError('Please fill in all fields.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      const result = await signup(email.trim(), password)
      setLoading(false)
      if (result.success) {
        navigate('/dashboard')
      } else {
        setError(result.error)
      }
    } catch (err) {
      setLoading(false)
      setError(err.message || 'Signup failed')
    }
  }

  return (
    <div className="login-page">
      <div className="bg-mesh" />
      <div className="login-orb login-orb-1" />
      <div className="login-orb login-orb-2" />
      <div className="login-orb login-orb-3" />

      <div className="login-container animate-fade-in">
        <div className="login-brand">
          <div className="login-brand-icon animate-float">⚛</div>
          <h1 className="login-brand-name gradient-text">RAG Platform</h1>
          <p className="login-brand-sub">Create your account and start building secure RAG workflows</p>
        </div>

        <div className="login-card card-glass">
          <div className="login-card-header">
            <h2>Sign up</h2>
            <p>Create a new account to manage your collections and pipelines.</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form" noValidate>
            <div className="login-field">
              <label htmlFor="signup-email" className="login-label">Email</label>
              <div className="login-input-wrap">
                <span className="login-input-icon">📧</span>
                <input
                  id="signup-email"
                  type="email"
                  className="input login-input"
                  placeholder="Enter your email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                  autoFocus
                />
              </div>
            </div>

            <div className="login-field">
              <label htmlFor="signup-password" className="login-label">Password</label>
              <div className="login-input-wrap">
                <span className="login-input-icon">🔑</span>
                <input
                  id="signup-password"
                  type={showPassword ? 'text' : 'password'}
                  className="input login-input"
                  placeholder="Choose a password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="login-eye-btn"
                  onClick={() => setShowPassword(s => !s)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <div className="login-field">
              <label htmlFor="signup-confirm-password" className="login-label">Confirm Password</label>
              <div className="login-input-wrap">
                <span className="login-input-icon">🔒</span>
                <input
                  id="signup-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="input login-input"
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="login-eye-btn"
                  onClick={() => setShowConfirmPassword(s => !s)}
                  tabIndex={-1}
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirmPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {error && (
              <div className="login-error animate-fade-in" role="alert">
                <span>⚠️</span> {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-lg w-full login-submit"
              disabled={loading}
            >
              {loading ? <><span className="spinner" />Creating account...</> : '🚀 Create account'}
            </button>

            <div className="login-footer-text">
              <span>Already have an account?</span>
              <button type="button" className="text-link" className="btn-primary" style={{ padding: '10px',marginLeft: '94px',borderRadius: '25px', color: '#fff', cursor: 'pointer' }} onClick={() => navigate('/login')}>Sign in</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
