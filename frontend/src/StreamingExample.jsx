// Contoh cara pakai useStream di component Ask kamu
// Paste logic ini ke dalam component yang handle Ask & Summary

import { useState } from 'react'
import { useStream } from './hooks/useStream'
import ReactMarkdown from 'react-markdown'

export function AskPanel({ paperId }) {
  const [question, setQuestion]   = useState('')
  const [answer, setAnswer]       = useState('')
  const [error, setError]         = useState('')
  const { streamText, isStreaming, reset } = useStream()

  async function handleAsk() {
    if (!question.trim() || !paperId || isStreaming) return
    setAnswer('')
    setError('')

    try {
      await streamText(
        '/api/ask/stream',
        { question, paper_id: paperId },
        (text) => setAnswer(text)   // dipanggil tiap token baru
      )
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={question}
          onChange={e => setQuestion(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAsk()}
          placeholder="Ask anything about the paper..."
          disabled={isStreaming}
          style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 14 }}
        />
        {isStreaming ? (
          <button onClick={reset}
            style={{ padding: '10px 18px', borderRadius: 8, background: '#f87171', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
            Stop
          </button>
        ) : (
          <button onClick={handleAsk}
            style={{ padding: '10px 18px', borderRadius: 8, background: '#111827', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
            Ask
          </button>
        )}
      </div>

      {error && (
        <div style={{ padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#dc2626', fontSize: 13 }}>
          {error}
        </div>
      )}

      {answer && (
        <div style={{ padding: '16px 20px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 14, lineHeight: 1.8 }}>
          <ReactMarkdown>{answer}</ReactMarkdown>
          {/* Blinking cursor while streaming */}
          {isStreaming && (
            <span style={{
              display: 'inline-block', width: 2, height: '1em',
              background: '#111827', marginLeft: 2, verticalAlign: 'text-bottom',
              animation: 'blink 1s step-end infinite'
            }} />
          )}
        </div>
      )}

      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
      `}</style>
    </div>
  )
}


export function SummaryPanel({ paperId }) {
  const [summary, setSummary]     = useState('')
  const [error, setError]         = useState('')
  const { streamText, isStreaming, reset } = useStream()

  async function handleSummarize() {
    if (!paperId || isStreaming) return
    setSummary('')
    setError('')

    try {
      await streamText(
        '/api/summarize/stream',
        { paper_id: paperId },
        (text) => setSummary(text)
      )
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        {isStreaming ? (
          <button onClick={reset}
            style={{ padding: '10px 18px', borderRadius: 8, background: '#f87171', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
            Stop Generating
          </button>
        ) : (
          <button onClick={handleSummarize}
            style={{ padding: '10px 18px', borderRadius: 8, background: '#3b2d8a', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
            {summary ? 'Regenerate Summary' : 'Generate Summary'}
          </button>
        )}
      </div>

      {error && (
        <div style={{ padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#dc2626', fontSize: 13 }}>
          {error}
        </div>
      )}

      {summary && (
        <div style={{ padding: '16px 20px', background: '#0f172a', borderRadius: 12, fontSize: 13, lineHeight: 1.8, color: '#cbd5e1', fontFamily: 'inherit' }}>
          <ReactMarkdown
            components={{
              strong: ({children}) => <strong style={{color:'#a78bfa'}}>{children}</strong>,
              p: ({children}) => <p style={{margin:'0 0 12px'}}>{children}</p>,
            }}
          >{summary}</ReactMarkdown>
          {isStreaming && (
            <span style={{
              display: 'inline-block', width: 2, height: '1em',
              background: '#a78bfa', marginLeft: 2, verticalAlign: 'text-bottom',
              animation: 'blink 1s step-end infinite'
            }} />
          )}
        </div>
      )}

      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
      `}</style>
    </div>
  )
}