import { useState, useEffect, useRef } from 'react'
import { Brain, FileText, Upload, Trash2, Menu, X, MessageSquare, FileSearch, ChevronRight } from 'lucide-react'
import ChatPanel from './components/ChatPanel.jsx'
import UploadPanel from './components/UploadPanel.jsx'
import SummaryPanel from './components/SummaryPanel.jsx'
import './App.css'

const API = '/api'

export default function App() {
  const [papers, setPapers] = useState([])
  const [selectedPaper, setSelectedPaper] = useState(null)
  const [activeTab, setActiveTab] = useState('chat')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef()

  const fetchPapers = async () => {
    try {
      const res = await fetch(`${API}/papers`)
      const data = await res.json()
      setPapers(data.papers || [])
    } catch (e) { console.error(e) }
  }

  useEffect(() => { fetchPapers() }, [])

  const handleUpload = async (file) => {
    if (!file?.name.endsWith('.pdf')) return
    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await fetch(`${API}/upload`, { method: 'POST', body: formData })
      const data = await res.json()
      await fetchPapers()
      return data
    } finally { setUploading(false) }
  }

  const handleDelete = async (e, paperId) => {
    e.stopPropagation()
    await fetch(`${API}/paper`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paper_id: paperId })
    })
    if (selectedPaper?.paper_id === paperId) setSelectedPaper(null)
    await fetchPapers()
  }

  const handleSelectPaper = (paper) => {
    setSelectedPaper(paper)
    setActiveTab('chat')
    setSidebarOpen(false)
  }

  return (
    <div className="app-layout">
      {/* Sidebar Overlay */}
      <div className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} />

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-icon"><Brain size={18} /></div>
          <div>
            <div className="brand-name">PaperMind</div>
            <div className="brand-sub">AI Paper Analyzer</div>
          </div>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-label">Library</div>
          <label className="upload-btn" style={{ cursor: uploading ? 'not-allowed' : 'pointer' }}>
            <Upload size={14} />
            {uploading ? 'Processing...' : 'Upload PDF'}
            <input ref={fileInputRef} type="file" accept=".pdf" hidden onChange={(e) => handleUpload(e.target.files[0])} disabled={uploading} />
          </label>
        </div>

        <div className="paper-list">
          {papers.length === 0 && (
            <div className="empty-papers">
              <FileText size={24} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.3 }} />
              No papers yet
            </div>
          )}
          {papers.map((paper) => (
            <div
              key={paper.paper_id}
              className={`paper-item ${selectedPaper?.paper_id === paper.paper_id ? 'active' : ''}`}
              onClick={() => handleSelectPaper(paper)}
            >
              <div className="paper-icon"><FileText size={14} /></div>
              <div className="paper-info">
                <div className="paper-name">{paper.filename.replace('.pdf', '')}</div>
                <div className="paper-chunks">{paper.chunks} chunks</div>
              </div>
              <button className="paper-delete" onClick={(e) => handleDelete(e, paper.paper_id)}>
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      </aside>

      {/* Main */}
      <main className="main-content">
        <div className="topbar">
          <div className="topbar-left">
            <button className="menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
            {selectedPaper ? (
              <>
                <span className="paper-title">{selectedPaper.filename.replace('.pdf', '')}</span>
                <span className="paper-badge">{selectedPaper.chunks} chunks</span>
              </>
            ) : (
              <span className="paper-title" style={{ color: 'var(--text2)' }}>Select a paper to begin</span>
            )}
          </div>

          {selectedPaper && (
            <div className="tab-group">
              <button className={`tab-btn ${activeTab === 'chat' ? 'active' : ''}`} onClick={() => setActiveTab('chat')}>
                <MessageSquare size={13} /> Ask
              </button>
              <button className={`tab-btn ${activeTab === 'summary' ? 'active' : ''}`} onClick={() => setActiveTab('summary')}>
                <FileSearch size={13} /> Summary
              </button>
            </div>
          )}
        </div>

        <div className="content-area">
          {!selectedPaper ? (
            <UploadPanel onUpload={handleUpload} uploading={uploading} />
          ) : activeTab === 'chat' ? (
            <ChatPanel paper={selectedPaper} apiBase={API} />
          ) : (
            <SummaryPanel paper={selectedPaper} apiBase={API} />
          )}
        </div>
      </main>
    </div>
  )
}
