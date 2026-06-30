import { createContext, useContext, useState, useEffect } from 'react'
import * as api from '../api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedUser = localStorage.getItem('rag_user')
    const token = localStorage.getItem('rag_token')

    async function loadUser() {
      if (storedUser && token) {
        try {
          const fresh = await api.getMe()
          setUser(fresh)
          localStorage.setItem('rag_user', JSON.stringify(fresh))
        } catch (err) {
          localStorage.removeItem('rag_user')
          localStorage.removeItem('rag_token')
        }
      }
      setLoading(false)
    }

    loadUser()
  }, [])

  const login = async (identifier, password) => {
    try {
      const res = await api.login(identifier, password)
      setUser(res.user)
      localStorage.setItem('rag_user', JSON.stringify(res.user))
      localStorage.setItem('rag_token', res.token)
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message || 'Invalid credentials' }
    }
  }

  const signup = async (email, password) => {
    try {
      const res = await api.signup(email, password)
      setUser(res.user)
      localStorage.setItem('rag_user', JSON.stringify(res.user))
      localStorage.setItem('rag_token', res.token)
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message || 'Signup failed' }
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('rag_user')
    localStorage.removeItem('rag_token')
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, signup }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
