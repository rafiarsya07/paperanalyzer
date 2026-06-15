import { useState, useRef } from 'react'
import { Upload, Brain, MessageSquare, FileSearch, Lock, ChevronRight } from 'lucide-react'
import './UploadPanel.css'

export default function UploadPanel({ onUpload, uploading }) {
  const [dragging, setDragging] = useState(false)
  const [status, setStatus] = useState(null)
  const inputRef = useRef()

  const handleFile = async (file) => {
    if (!file?.name.endsWith('.pdf')) {
      setStatus({ type: 'error', msg: 'Only PDF files are supported.' })
      return
    }
    setStatus({ type: 'loading', msg: `Processing "${file.name}"...` })
    try {
      await onUpload(file)
      setStatus({ type: 'success', msg: 'Paper uploaded and indexed successfully!' })
      setTimeout(() => window.location.reload(), 1200)
    } catch {
      setStatus({ type: 'error', msg: 'Upload failed. Check if backend is running.' })
    }
  }

  return (
    <div className="upload-panel">
      <div className="upload-hero">
        <div className="hero-icon">
          <Brain size={32} />
        </div>
        <h1>Analyze Research Papers with AI</h1>
        <p>Upload any academic PDF and ask questions, get summaries, and extract insights — all running privately on your machine.</p>

        <div
          className={`drop-zone ${dragging ? 'drag-over' : ''} ${uploading ? 'loading' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]) }}
          onClick={() => !uploading && inputRef.current.click()}
        >
          <div className="drop-icon-wrap">
            <Upload size={22} />
          </div>
          <p className="drop-title">{dragging ? 'Drop to upload' : 'Drop your PDF here'}</p>
          <p className="drop-sub">or click to browse files</p>
          <input ref={inputRef} type="file" accept=".pdf" hidden onChange={(e) => handleFile(e.target.files[0])} />
        </div>

        {status && (
          <div className={`status-bar ${status.type}`}>
            {status.type === 'loading' && <span className="spin" />}
            {status.msg}
          </div>
        )}

        <div className="features">
          <div className="feature">
            <div className="feature-icon"><MessageSquare size={16} /></div>
            <div>
              <strong>Natural Q&A</strong>
              <p>Ask anything about your paper in plain language</p>
            </div>
          </div>
          <div className="feature">
            <div className="feature-icon"><FileSearch size={16} /></div>
            <div>
              <strong>Smart Summary</strong>
              <p>Auto-structured overview with key findings</p>
            </div>
          </div>
          <div className="feature">
            <div className="feature-icon"><Lock size={16} /></div>
            <div>
              <strong>100% Private</strong>
              <p>Everything runs locally, nothing leaves your device</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
