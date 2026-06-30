import { createContext, useContext, useState, useEffect } from 'react'
import * as api from '../api'
import { useAuth } from './AuthContext'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const { user } = useAuth()
  const [collections, setCollections] = useState([])
  const [pipelines, setPipelines] = useState([])
  const [activePipeline, setActivePipeline] = useState(null)
  const [loading, setLoading] = useState(true)

  // Sessions state: { [pipelineId]: [session1, session2, ...] }
  const [sessions, setSessions] = useState(() => {
    const allSessions = {}
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key.startsWith('rag_sessions_')) {
          const pipeId = key.replace('rag_sessions_', '')
          allSessions[pipeId] = JSON.parse(localStorage.getItem(key)) || []
        }
      }
    } catch (e) {
      console.error(e)
    }
    return allSessions
  })

  // Active session ids state: { [pipelineId]: activeSessionId }
  const [activeSessionIds, setActiveSessionIds] = useState(() => {
    const allActives = {}
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key.startsWith('rag_active_session_')) {
          const pipeId = key.replace('rag_active_session_', '')
          allActives[pipeId] = localStorage.getItem(key) || ''
        }
      }
    } catch (e) {
      console.error(e)
    }
    return allActives
  })

  // Helper to create a new session
  const createNewSession = (pipelineId, initialText = null, llmModel = 'llama-3.3-70b', collectionName = 'your documents', fileCount = 0) => {
    const newId = `session-${Date.now()}`
    const pipeSessions = sessions[pipelineId] || []
    const newSess = {
      id: newId,
      name: initialText ? (initialText.slice(0, 22) + (initialText.length > 22 ? '...' : '')) : `Chat ${pipeSessions.length + 1}`,
      messages: [
        {
          id: 'welcome',
          role: 'ai',
          text: `Hello! 👋 I'm your Assistant How can i help today?\nI can answer questions using **${collectionName}** (${fileCount} files).`,
          sources: [],
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
      ]
    };

    const updatedSessions = [newSess, ...pipeSessions]
    setSessions(prev => {
      const next = { ...prev, [pipelineId]: updatedSessions }
      localStorage.setItem(`rag_sessions_${pipelineId}`, JSON.stringify(updatedSessions))
      return next
    })

    setActiveSessionIds(prev => {
      const next = { ...prev, [pipelineId]: newId }
      localStorage.setItem(`rag_active_session_${pipelineId}`, newId)
      return next
    })

    return newId
  }

  // Helper to delete a session
  const deleteSession = (pipelineId, sessionId) => {
    const pipeSessions = sessions[pipelineId] || []
    const updatedSessions = pipeSessions.filter(s => s.id !== sessionId)
    
    setSessions(prev => {
      const next = { ...prev, [pipelineId]: updatedSessions }
      localStorage.setItem(`rag_sessions_${pipelineId}`, JSON.stringify(updatedSessions))
      return next
    })

    if (activeSessionIds[pipelineId] === sessionId) {
      const nextActiveId = updatedSessions.length > 0 ? updatedSessions[0].id : ''
      setActiveSessionIds(prev => {
        const next = { ...prev, [pipelineId]: nextActiveId }
        if (nextActiveId) {
          localStorage.setItem(`rag_active_session_${pipelineId}`, nextActiveId)
        } else {
          localStorage.removeItem(`rag_active_session_${pipelineId}`)
        }
        return next
      })
    }
  }

  // Helper to update session messages (e.g. adding messages)
  const updateSessionMessages = (pipelineId, sessionId, messagesUpdater, renameQuery = null) => {
    const pipeSessions = sessions[pipelineId] || []
    const updatedSessions = pipeSessions.map(s => {
      if (s.id === sessionId) {
        const nextMessages = typeof messagesUpdater === 'function' ? messagesUpdater(s.messages) : messagesUpdater
        
        let nextName = s.name
        if (renameQuery) {
          const isDefaultName = s.name.startsWith('Chat ') && s.messages.length === 1
          if (isDefaultName) {
            nextName = renameQuery.slice(0, 22) + (renameQuery.length > 22 ? '...' : '')
          }
        }

        return {
          ...s,
          name: nextName,
          messages: nextMessages
        }
      }
      return s
    })

    setSessions(prev => {
      const next = { ...prev, [pipelineId]: updatedSessions }
      localStorage.setItem(`rag_sessions_${pipelineId}`, JSON.stringify(updatedSessions))
      return next
    })
  }

  // Helper to set active session
  const setActiveSession = (pipelineId, sessionId) => {
    setActiveSessionIds(prev => {
      const next = { ...prev, [pipelineId]: sessionId }
      localStorage.setItem(`rag_active_session_${pipelineId}`, sessionId)
      return next
    })
  }

  useEffect(() => {
    if (!user) {
      setCollections([])
      setPipelines([])
      setLoading(false)
      return
    }

    let active = true
    async function loadInitialData() {
      setLoading(true)
      try {
        const cols = await api.fetchCollections()
        const pipes = await api.getPipelines()
        if (!active) return
        setCollections(cols)
        setPipelines(pipes)
      } catch (err) {
        console.error('Failed to load initial data', err)
      } finally {
        if (active) setLoading(false)
      }
    }

    loadInitialData()
    return () => { active = false }
  }, [user])

  const refreshCollections = async () => {
    const cols = await api.fetchCollections()
    setCollections(cols)
  }

  const addCollection = async (name, description) => {
    const newCol = await api.createCollection(name, description)
    await refreshCollections()
    return newCol
  }

  const updateCollection = async (collectionId, data) => {
    const updatedCol = await api.updateCollection(collectionId, data)
    setCollections(prev => prev.map(c => c.id === collectionId ? updatedCol : c))
    return updatedCol
  }

  const addFileToCollection = async (collectionId, fileObj) => {
  }

  const addFolderToCollection = async (collectionId, folderName, files) => {
  }

  const deleteCollection = async (collectionId) => {
    await api.deleteCollection(collectionId)
    await refreshCollections()
  }

  const getCollection = (id) => collections.find(c => c.id === id)
  const getPipeline   = (id) => pipelines.find(p => p.id === id)

  const createPipelineConfig = (config) => {
    const p = {
      id: `pipe-temp`,
      name: config.name || 'Untitled Pipeline',
      collectionId: config.collectionId,
      collectionName: config.collectionName,
      sourceType: config.sourceType,
      chunkSize: config.chunkSize || 1000,
      chunkOverlap: config.chunkOverlap || 200,
      embeddingModel: config.embeddingModel || 'all-MiniLM-L6-v2',
      vectorDb: config.vectorDb || 'ChromaDB',
      llmModel: config.llmModel || 'llama-3.3-70b-versatile',
      status: 'idle',
      steps: [],
    }
    setActivePipeline(p)
    return p
  }

  const updatePipelineStatus = (pipelineId, status, extra = {}) => {
    setActivePipeline(prev => prev ? { ...prev, status, ...extra } : prev)
  }

  const refreshPipelines = async () => {
    const pipes = await api.getPipelines()
    setPipelines(pipes)
  }

  const deletePipeline = async (pipelineId) => {
    await api.deletePipeline(pipelineId)
    setPipelines(prev => prev.filter(p => p.id !== pipelineId))
    setSessions(prev => {
      const next = { ...prev }
      delete next[pipelineId]
      return next
    })
    setActiveSessionIds(prev => {
      const next = { ...prev }
      delete next[pipelineId]
      return next
    })
    if (activePipeline?.id === pipelineId) {
      setActivePipeline(null)
    }
    localStorage.removeItem(`rag_sessions_${pipelineId}`)
    localStorage.removeItem(`rag_active_session_${pipelineId}`)
  }

  const updatePipeline = async (pipelineId, data) => {
    const res = await api.updatePipeline(pipelineId, data)
    if (!res.pipeline) throw new Error('Pipeline update failed')
    setPipelines(prev => prev.map(p => p.id === pipelineId ? res.pipeline : p))
    if (activePipeline?.id === pipelineId) {
      setActivePipeline(prev => prev ? { ...prev, ...res.pipeline } : prev)
    }
    return res.pipeline
  }

  return (
    <AppContext.Provider value={{
      collections, pipelines, activePipeline, loading,
      addCollection, addFileToCollection, addFolderToCollection, deleteCollection, updateCollection,
      createPipeline: createPipelineConfig, updatePipelineStatus, updatePipeline,
      refreshCollections, refreshPipelines, deletePipeline,
      getCollection, getPipeline, setActivePipeline,
      sessions, activeSessionIds, createNewSession, deleteSession, updateSessionMessages, setActiveSession: setActiveSession
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)

