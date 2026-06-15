import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Loader2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import './ChatPanel.css'

const SUGGESTIONS = [
  "What is the main contribution of this paper?",
  "What methodology was used?",
  "What are the key findings?",
  "What are the limitations of this study?",
  "How does this compare to related work?"
]

export default function ChatPanel({ paper, apiBase }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef()
  const inputRef = useRef()

  useEffect(() => {
    setMessages([{ role: 'assistant', content: `I've loaded **${paper.filename}**. What would you like to know about this paper?` }])
    inputRef.current?.focus()
  }, [paper.paper_id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async (q) => {
    const question = q || input.trim()
    if (!question || loading) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: question }])
    setLoading(true)
    try {
      const res = await fetch(`${apiBase}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, paper_id: paper.paper_id })
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.answer }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Failed to get response. Please try again.' }])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  return (
    <div className="chat-panel">
      <div className="chat-messages">
        {messages.map((msg, i) => (
          <div key={i} className={`msg msg-${msg.role}`}>
            <div className="msg-avatar">
              {msg.role === 'assistant' ? <Bot size={15} /> : <User size={15} />}
            </div>
            <div className="msg-bubble">
              <ReactMarkdown>{msg.content}</ReactMarkdown>
            </div>
          </div>
        ))}

        {loading && (
          <div className="msg msg-assistant">
            <div className="msg-avatar"><Bot size={15} /></div>
            <div className="msg-bubble typing">
              <span /><span /><span />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {messages.length <= 1 && !loading && (
        <div className="suggestions">
          {SUGGESTIONS.map((s, i) => (
            <button key={i} className="suggestion" onClick={() => send(s)}>{s}</button>
          ))}
        </div>
      )}

      <div className="chat-input-bar">
        <input
          ref={inputRef}
          className="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="Ask anything about this paper..."
          disabled={loading}
        />
        <button className="send-btn" onClick={() => send()} disabled={loading || !input.trim()}>
          {loading ? <Loader2 size={16} className="spin-icon" /> : <Send size={16} />}
        </button>
      </div>
    </div>
  )
}
