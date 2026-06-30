
// import { useState, useRef, useEffect } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import { useApp } from '../context/AppContext';
// import Sidebar from '../components/Sidebar';
// import * as api from '../api';
// import './ChatPage.css';
// import { Copy } from "lucide-react";
// const SUGGESTED_QUESTIONS = [
//   '📧 Contact info?',
//   '🛠️ What services?',
//   '🤖 Tell me about RAG',
//   '💻 Technologies used',
//   '📱 Mobile development?',
//   '☁️ Cloud services?',
// ];

// function useTypewriter(text, speed = 16, active = true) {
//   const [displayed, setDisplayed] = useState('');
//   const [done, setDone] = useState(false);

//   useEffect(() => {
//     if (!active || !text) {
//       setDisplayed(text || '');
//       setDone(true);
//       return;
//     }
//     setDisplayed('');
//     setDone(false);
//     let i = 0;
//     const timer = setInterval(() => {
//       i++;
//       setDisplayed(text.slice(0, i));
//       if (i >= text.length) {
//         clearInterval(timer);
//         setDone(true);
//       }
//     }, speed);
//     return () => clearInterval(timer);
//   }, [text, speed, active]);

//   return { displayed, done };
// }

// function AiMessage({ msg, isLatest }) {
//   const { displayed, done } = useTypewriter(msg.text, 14, isLatest);
//   const [showSources, setShowSources] = useState(false);

//   const copyMessage = () => {
//     navigator.clipboard.writeText(msg.text);
//   };

//   return (
//     <div className="chat-msg chat-msg-ai">
//       <div className="chat-msg-avatar">⚛</div>
//       <div className="chat-msg-content">
//         <div className="chat-bubble chat-bubble-ai">
//           <pre className="chat-bubble-text">
//             {isLatest ? displayed : msg.text}
//             {isLatest && !done && <span className="chat-cursor">▋</span>}
//           </pre>

//           <button
//             className="chat-copy-btn"
//             onClick={copyMessage}
//             title="Copy message"
//           >
//              <Copy size={18} />
//           </button>
//         </div>

//         {/* Sources */}
//         {msg.sources?.length > 0 && (!isLatest || done) && (
//           <div className="chat-sources">
//             <button
//               className="chat-sources-toggle"
//               onClick={() => setShowSources(s => !s)}
//             >
//               📚 {msg.sources.length} source{msg.sources.length > 1 ? 's' : ''}
//               <span className={`toggle-icon ${showSources ? 'open' : ''}`}>▾</span>
//             </button>

//             {showSources && (
//               <div className="chat-sources-list">
//                 {msg.sources.map((s, i) => (
//                   <div key={i} className="chat-source-card">
//                     <div className="chat-source-header">
//                       <div className="chat-source-file">
//                         {s.file.endsWith('.pdf') ? '📕' : s.file.endsWith('.txt') ? '📄' : '🌐'} 
//                         <span>{s.file}</span>
//                       </div>
//                       <div className="chat-source-score">
//                         {(s.score * 100).toFixed(0)}%
//                       </div>
//                     </div>
//                     <pre className="chat-source-chunk">{s.chunk}</pre>
//                   </div>
//                 ))}
//               </div>
//             )}
//           </div>
//         )}

//         <div className="chat-msg-meta">{msg.time}</div>
//       </div>
//     </div>
//   );
// }

// export default function ChatPage() {
//   const { pipelineId } = useParams();
//   const navigate = useNavigate();
//   const { 
//     getPipeline, 
//     getCollection, 
//     loading,
//     sessions: globalSessions,
//     activeSessionIds,
//     createNewSession,
//     setActiveSession,
//     updateSessionMessages
//   } = useApp();

//   const pipeline = getPipeline(pipelineId);
//   const collection = pipeline ? getCollection(pipeline.collectionId) : null;

//   const sessions = globalSessions[pipelineId] || [];
//   const activeSessionId = activeSessionIds[pipelineId] || '';

//   const [input, setInput] = useState('');
//   const [thinking, setThinking] = useState(false);
//   const bottomRef = useRef(null);
//   const textareaRef = useRef(null);

//   // Find active session
//   const activeSession = sessions.find(s => s.id === activeSessionId) || null;

//   // If there is no session at all, create one
//   useEffect(() => {
//     if (pipeline && sessions.length === 0) {
//       createNewSession(pipelineId, null, pipeline.llmModel, collection?.name || 'your documents', collection?.files.length || 0);
//     } else if (pipeline && !activeSessionId && sessions.length > 0) {
//       setActiveSession(pipelineId, sessions[0].id);
//     }
//   }, [pipeline, sessions, activeSessionId, pipelineId, collection]);

//   const messages = activeSession ? activeSession.messages : [];

//   // Auto-scroll
//   useEffect(() => {
//     bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
//   }, [messages, thinking]);

//   // Auto-resize textarea
//   useEffect(() => {
//     const ta = textareaRef.current;
//     if (ta) {
//       ta.style.height = 'auto';
//       ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
//     }
//   }, [input]);

//   if (loading) {
//     return (
//       <div className="not-found" style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
//         <div className="not-found-content">
//           <div className="spinner" style={{ width: '40px', height: '40px', margin: '0 auto 1rem' }} />
//           <h2>Loading Pipeline...</h2>
//           <p>Please wait while we sync pipeline settings.</p>
//         </div>
//       </div>
//     );
//   }

//   if (!pipeline) {
//     return (
//       <div className="not-found">
//         <div className="not-found-content">
//           <div className="emoji">😕</div>
//           <h2>Pipeline not found</h2>
//           <p>This pipeline may have been deleted or is still being prepared.</p>
//           <button className="btn btn-primary" onClick={() => navigate('/pipeline')}>
//             Create New Pipeline
//           </button>
//         </div>
//       </div>
//     );
//   }

//   const sendMessage = async (text) => {
//     const q = (text || input).trim();
//     if (!q || thinking) return;

//     setInput('');
//     let currentSessionId = activeSessionId;
//     if (!currentSessionId) {
//       currentSessionId = createNewSession(pipelineId, q, pipeline.llmModel, collection?.name || 'your documents', collection?.files.length || 0);
//     }

//     const userMsg = {
//       id: Date.now().toString(),
//       role: 'user',
//       text: q,
//       time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
//     };

//     updateSessionMessages(pipelineId, currentSessionId, prev => [...prev, userMsg], q);
//     setThinking(true);

//     try {
//       const rag = await api.sendChat(pipeline.collectionId, q, pipeline.llmModel);
//       const aiMsg = {
//         id: (Date.now() + 1).toString(),
//         role: 'ai',
//         text: rag.answer,
//         sources: rag.sources || [],
//         time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
//       };
//       updateSessionMessages(pipelineId, currentSessionId, prev => [...prev, aiMsg]);
//     } catch (err) {
//       console.error(err);
//       updateSessionMessages(pipelineId, currentSessionId, prev => [...prev, {
//         id: (Date.now() + 1).toString(),
//         role: 'ai',
//         text: `Sorry, something went wrong: ${err.message}`,
//         sources: [],
//         time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
//       }]);
//     } finally {
//       setThinking(false);
//     }
//   };

//   const handleKeyDown = (e) => {
//     if (e.key === 'Enter' && !e.shiftKey) {
//       e.preventDefault();
//       sendMessage();
//     }
//   };

//   const lastAiIdx = messages.map((m, i) => m.role === 'ai' ? i : -1).filter(i => i >= 0).pop();

//   return (
//     <div className="chat-shell">
//       <div className="bg-mesh" />
//       <Sidebar />

//       <div className="chat-main">
//         {/* Chat Area */}
//         <div className="chat-area" style={{ flex: 1 }}>
//           <div className="chat-header">
//             <div className="chat-header-left">
//               <div className="chat-header-icon">💬</div>
//               <div>
//                 <div className="chat-header-title">{collection?.name || 'Document Chat'}</div>
//                 {/* <div className="chat-header-sub">
//                   Powered by {pipeline.llmModel.split('/').pop()}
//                 </div> */}
//               </div>
//             </div>
//             <button 
//               className="btn btn-ghost btn-sm"
//               onClick={() => {
//                 if (activeSessionId) {
//                   updateSessionMessages(pipelineId, activeSessionId, prev => [prev[0]]);
//                 }
//               }}
//             >
//               Clear Chat
//             </button>
//           </div>

//           {/* Messages Container */}
//           <div className="chat-messages" id="chat-messages-area">
//             {messages.map((msg, i) => (
//               msg.role === 'user' ? (
//                 <div key={msg.id} className="chat-msg chat-msg-user">
//                   <div className="chat-msg-content">
//                     <div className="chat-bubble chat-bubble-user">
//                       {msg.text}
//                     </div>
//                     <div className="chat-msg-meta">{msg.time}</div>
//                   </div>
//                   <div className="chat-msg-avatar">👤</div>
//                 </div>
//               ) : (
//                 <AiMessage key={msg.id} msg={msg} isLatest={i === lastAiIdx} />
//               )
//             ))}

//             {thinking && (
//               <div className="chat-msg chat-msg-ai">
//                 <div className="chat-msg-avatar">⚛</div>
//                 <div className="chat-msg-content">
//                   <div className="chat-bubble chat-bubble-ai chat-thinking">
//                     <div className="typing-indicator">
//                       <span></span><span></span><span></span>
//                     </div>
//                     <span>Thinking...</span>
//                   </div>
//                 </div>
//               </div>
//             )}

//             <div ref={bottomRef} />
//           </div>

//           {/* Suggested Questions */}
//           {/* <div className="chat-suggestions">
//             {SUGGESTED_QUESTIONS.map((q, i) => (
//               <button
//                 key={i}
//                 className="chat-suggestion-chip"
//                 onClick={() => sendMessage(q.replace(/^[^\s]+\s/, ''))}
//                 disabled={thinking}
//               >
//                 {q}
//               </button>
//             ))}
//           </div> */}

//           {/* Input Area */}
//           <div className="chat-input-bar">
//             <div className="chat-input-wrap">
//               <textarea
//                 ref={textareaRef}
//                 className="chat-input"
//                 placeholder="Ask anything about your documents..."
//                 value={input}
//                 onChange={(e) => setInput(e.target.value)}
//                 onKeyDown={handleKeyDown}
//                 rows={1}
//                 disabled={thinking}
//               />
//               <button
//                 className="chat-send-btn btn btn-primary"
//                 onClick={() => sendMessage()}
//                 disabled={!input.trim() || thinking}
//               >
//                 {thinking ? <span className="spinner" /> : '↑'}
//               </button>
//             </div>
//             {/* <div className="chat-input-hint">
//               Enter to send • Shift+Enter for new line
//             </div> */}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

import { useState, useRef, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Sidebar from '../components/Sidebar';
import * as api from '../api';
import './ChatPage.css';
import { Copy } from "lucide-react";

const SUGGESTED_QUESTIONS = [
  '📧 Contact info?',
  '🛠️ What services?',
  '🤖 Tell me about RAG',
  '💻 Technologies used',
  '📱 Mobile development?',
  '☁️ Cloud services?',
];

function useTypewriter(text, speed = 16, active = true) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!active || !text) {
      setDisplayed(text || '');
      setDone(true);
      return;
    }
    setDisplayed('');
    setDone(false);
    let i = 0;
    const timer = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(timer);
        setDone(true);
      }
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed, active]);

  return { displayed, done };
}

function AiMessage({ msg, isLatest }) {
  const { displayed, done } = useTypewriter(msg.text, 14, isLatest);
  const [showSources, setShowSources] = useState(false);

  const copyMessage = () => {
    navigator.clipboard.writeText(msg.text);
  };

  return (
    <div className="chat-msg chat-msg-ai">
      <div className="chat-msg-avatar">⚛</div>
      <div className="chat-msg-content">
        <div className="chat-bubble chat-bubble-ai">
          <pre className="chat-bubble-text">
            {isLatest ? displayed : msg.text}
            {isLatest && !done && <span className="chat-cursor">▋</span>}
          </pre>

          <button
            className="chat-copy-btn"
            onClick={copyMessage}
            title="Copy message"
          >
             <Copy size={18} />
          </button>
        </div>

        {/* Sources */}
        {msg.sources?.length > 0 && (!isLatest || done) && (
          <div className="chat-sources">
            <button
              className="chat-sources-toggle"
              onClick={() => setShowSources(s => !s)}
            >
              📚 {msg.sources.length} source{msg.sources.length > 1 ? 's' : ''}
              <span className={`toggle-icon ${showSources ? 'open' : ''}`}>▾</span>
            </button>

            {showSources && (
              <div className="chat-sources-list">
                {msg.sources.map((s, i) => (
                  <div key={i} className="chat-source-card">
                    <div className="chat-source-header">
                      <div className="chat-source-file">
                        {s.file.endsWith('.pdf') ? '📕' : s.file.endsWith('.txt') ? '📄' : '🌐'} 
                        <span>{s.file}</span>
                      </div>
                      <div className="chat-source-score">
                        {(s.score * 100).toFixed(0)}%
                      </div>
                    </div>
                    <pre className="chat-source-chunk">{s.chunk}</pre>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="chat-msg-meta">{msg.time}</div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  const { pipelineId } = useParams();
  const navigate = useNavigate();
  const { 
    getPipeline, 
    getCollection, 
    loading,
    sessions: globalSessions,
    activeSessionIds,
    createNewSession,
    setActiveSession,
    updateSessionMessages
  } = useApp();

  const pipeline = getPipeline(pipelineId);
  const collection = pipeline ? getCollection(pipeline.collectionId) : null;

  const sessions = globalSessions[pipelineId] || [];
  const activeSessionId = activeSessionIds[pipelineId] || '';

  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  const activeSession = sessions.find(s => s.id === activeSessionId) || null;
  const messages = activeSession ? activeSession.messages : [];

  // Fixed lastAiIdx using useMemo
  const lastAiIdx = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'ai') {
        return i;
      }
    }
    return -1;
  }, [messages]);

  // Export Chat as PDF
  const exportChatToPDF = () => {
    if (!messages.length) {
      alert("No messages to export!");
      return;
    }

    const chatTitle = collection?.name || pipeline?.name || "RAG Chat";
    
    let htmlContent = `
      <html>
        <head>
          <title>${chatTitle}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; line-height: 1.6; }
            h1 { color: #3b82f6; text-align: center; }
            .message { margin: 20px 0; padding: 15px; border-radius: 8px; }
            .user { background: #e0f2fe; margin-left: 20%; }
            .ai { background: #f1f5f9; margin-right: 20%; }
            .meta { font-size: 0.85em; color: #64748b; margin-top: 5px; }
          </style>
        </head>
        <body>
          <h1>${chatTitle}</h1>
          <p style="text-align:center; color:#64748b;">Exported on ${new Date().toLocaleString()}</p>
    `;

    messages.forEach(msg => {
      const roleClass = msg.role === 'user' ? 'user' : 'ai';
      const roleLabel = msg.role === 'user' ? 'You' : 'AI Assistant';
      
      htmlContent += `
        <div class="message ${roleClass}">
          <strong>${roleLabel}:</strong><br>
          ${msg.text.replace(/\n/g, '<br>')}
          <div class="meta">${msg.time}</div>
        </div>
      `;
    });

    htmlContent += `</body></html>`;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(htmlContent);
    printWindow.document.close();

    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 500);
  };

  // Create initial session if none exists
  useEffect(() => {
    if (pipeline && sessions.length === 0) {
      createNewSession(pipelineId, null, pipeline.llmModel, collection?.name || 'your documents', collection?.files.length || 0);
    } else if (pipeline && !activeSessionId && sessions.length > 0) {
      setActiveSession(pipelineId, sessions[0].id);
    }
  }, [pipeline, sessions, activeSessionId, pipelineId, collection]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
    }
  }, [input]);

  const sendMessage = async (text) => {
    const q = (text || input).trim();
    if (!q || thinking) return;

    setInput('');
    let currentSessionId = activeSessionId;
    if (!currentSessionId) {
      currentSessionId = createNewSession(pipelineId, q, pipeline.llmModel, collection?.name || 'your documents', collection?.files.length || 0);
    }

    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      text: q,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    updateSessionMessages(pipelineId, currentSessionId, prev => [...prev, userMsg], q);
    setThinking(true);

    try {
      const rag = await api.sendChat(pipeline.collectionId, q, pipeline.llmModel);
      const aiMsg = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        text: rag.answer,
        sources: rag.sources || [],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      updateSessionMessages(pipelineId, currentSessionId, prev => [...prev, aiMsg]);
    } catch (err) {
      console.error(err);
      updateSessionMessages(pipelineId, currentSessionId, prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        text: `Sorry, something went wrong: ${err.message}`,
        sources: [],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
    } finally {
      setThinking(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (loading) {
    return (
      <div className="not-found" style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="not-found-content">
          <div className="spinner" style={{ width: '40px', height: '40px', margin: '0 auto 1rem' }} />
          <h2>Loading Pipeline...</h2>
          <p>Please wait while we sync pipeline settings.</p>
        </div>
      </div>
    );
  }

  if (!pipeline) {
    return (
      <div className="not-found">
        <div className="not-found-content">
          <div className="emoji">😕</div>
          <h2>Pipeline not found</h2>
          <p>This pipeline may have been deleted or is still being prepared.</p>
          <button className="btn btn-primary" onClick={() => navigate('/pipeline')}>
            Create New Pipeline
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-shell">
      <div className="bg-mesh" />
      <Sidebar />

      <div className="chat-main">
        <div className="chat-area" style={{ flex: 1 }}>
          <div className="chat-header">
            <div className="chat-header-left">
              <div className="chat-header-icon">💬</div>
              <div>
                <div className="chat-header-title">{collection?.name || 'Document Chat'}</div>
              </div>
            </div>

            <div className="chat-header-actions">
              <button 
                className="btn btn-ghost btn-sm"
                onClick={exportChatToPDF}
                title="Export chat as PDF"
              >
                📄 Export PDF
              </button>

              <button 
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  if (activeSessionId) {
                    updateSessionMessages(pipelineId, activeSessionId, prev => [prev[0]]);
                  }
                }}
              >
                Clear Chat
              </button>
            </div>
          </div>

          {/* Messages Container */}
          <div className="chat-messages" id="chat-messages-area">
            {messages.map((msg, i) => (
              msg.role === 'user' ? (
                <div key={msg.id} className="chat-msg chat-msg-user">
                  <div className="chat-msg-content">
                    <div className="chat-bubble chat-bubble-user">
                      {msg.text}
                    </div>
                    <div className="chat-msg-meta">{msg.time}</div>
                  </div>
                  <div className="chat-msg-avatar">👤</div>
                </div>
              ) : (
                <AiMessage key={msg.id} msg={msg} isLatest={i === lastAiIdx} />
              )
            ))}

            {thinking && (
              <div className="chat-msg chat-msg-ai">
                <div className="chat-msg-avatar">⚛</div>
                <div className="chat-msg-content">
                  <div className="chat-bubble chat-bubble-ai chat-thinking">
                    <div className="typing-indicator">
                      <span></span><span></span><span></span>
                    </div>
                    <span>Thinking...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input Area */}
          <div className="chat-input-bar">
            <div className="chat-input-wrap">
              <textarea
                ref={textareaRef}
                className="chat-input"
                placeholder="Ask anything about your documents..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                disabled={thinking}
              />
              <button
                className="chat-send-btn btn btn-primary"
                onClick={() => sendMessage()}
                disabled={!input.trim() || thinking}
              >
                {thinking ? <span className="spinner" /> : '↑'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}