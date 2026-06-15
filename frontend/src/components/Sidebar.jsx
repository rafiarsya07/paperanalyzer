import { useState } from 'react'
import './Sidebar.css'

export default function Sidebar({ papers, selectedPaper, onSelect, onDelete }) {
  const [uploading, setUploading] = useState(false)

  const handleFileInput = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      await res.json()
      window.location.reload()
    } catch (err) {
      alert('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-title">📚 My Papers</span>
        <label className="upload-btn-small" title="Upload PDF">
          {uploading ? '⏳' : '＋'}
          <input type="file" accept=".pdf" onChange={handleFileInput} hidden />
        </label>
      </div>

      <div className="paper-list">
        {papers.length === 0 && (
          <div className="empty-state">
            <p>No papers yet</p>
            <span>Upload a PDF to get started</span>
          </div>
        )}
        {papers.map((paper) => (
          <div
            key={paper.paper_id}
            className={`paper-item ${selectedPaper?.paper_id === paper.paper_id ? 'active' : ''}`}
            onClick={() => onSelect(paper)}
          >
            <div className="paper-icon">📄</div>
            <div className="paper-info">
              <p className="paper-name">{paper.filename.replace('.pdf', '')}</p>
              <span className="paper-meta">{paper.chunks} chunks</span>
            </div>
            <button
              className="delete-btn"
              onClick={(e) => { e.stopPropagation(); onDelete(paper.paper_id) }}
              title="Delete"
            >🗑️</button>
          </div>
        ))}
      </div>
    </aside>
  )
}
