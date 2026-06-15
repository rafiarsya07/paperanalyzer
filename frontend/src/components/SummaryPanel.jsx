import { useState, useEffect } from 'react'
import { Sparkles, RefreshCw, FileText, Loader2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import './SummaryPanel.css'

export default function SummaryPanel({ paper, apiBase }) {
  const [summary, setSummary] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => { setSummary(''); setDone(false) }, [paper.paper_id])

  const generate = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${apiBase}/summarize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paper_id: paper.paper_id })
      })
      const data = await res.json()
      setSummary(data.summary)
      setDone(true)
    } catch {
      setSummary('Failed to generate summary. Please try again.')
      setDone(true)
    } finally { setLoading(false) }
  }

  return (
    <div className="summary-panel">
      <div className="summary-topbar">
        <div className="summary-paper-info">
          <FileText size={14} />
          <span>{paper.filename}</span>
        </div>
        <button className="btn btn-primary" onClick={generate} disabled={loading}>
          {loading
            ? <><Loader2 size={13} className="spin-icon" /> Generating...</>
            : done
              ? <><RefreshCw size={13} /> Regenerate</>
              : <><Sparkles size={13} /> Generate Summary</>
          }
        </button>
      </div>

      <div className="summary-body">
        {!done && !loading && (
          <div className="summary-empty">
            <div className="summary-empty-icon"><Sparkles size={24} /></div>
            <h3>Generate a Summary</h3>
            <p>Get a structured overview including the paper's objectives, methodology, key findings, and conclusions.</p>
            <button className="btn btn-primary" onClick={generate} style={{ marginTop: 16 }}>
              <Sparkles size={14} /> Generate Summary
            </button>
          </div>
        )}

        {loading && (
          <div className="summary-loading">
            <div className="loading-ring" />
            <p>Analyzing paper with AI...</p>
            <span>This may take 30–60 seconds</span>
          </div>
        )}

        {done && !loading && (
          <div className="summary-result">
            <ReactMarkdown>{summary}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  )
}
