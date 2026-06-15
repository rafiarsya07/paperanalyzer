# 🧠 PaperMind — AI-Powered Academic Paper Analyzer

Analyze research papers using local AI (RAG). Upload PDF → Ask questions → Get structured summaries. 100% private, runs on your machine.

## Prerequisites

- Docker & Docker Compose
- Ollama installed and running

## Setup (One-time)

### 1. Pull required Ollama models
```bash
ollama pull mistral
ollama pull nomic-embed-text
```

### 2. Start the project
```bash
docker compose up -d --build
```

### 3. Open browser
```
http://localhost:3000
```

## Usage

1. Click **+** in sidebar or drag & drop PDF into the upload zone
2. Wait for processing (30–60 seconds depending on PDF size)
3. Select paper from sidebar
4. Use **Ask Paper** tab to ask questions
5. Use **Summary** tab to generate structured summary

## Dataset for Testing

Download free academic PDFs from:
- **arXiv**: https://arxiv.org (free research papers)
- **Semantic Scholar**: https://www.semanticscholar.org
- **PubMed**: https://pubmed.ncbi.nlm.nih.gov (medical papers)
- **Google Scholar**: https://scholar.google.com

Recommended test papers:
- Any ML/AI paper from arXiv (cs.AI, cs.LG sections)
- Your own university coursework PDFs

## Troubleshooting

**Backend can't connect to Ollama:**
```bash
# Make sure Ollama is running
ollama serve
```

**Slow responses:**
- Normal for first query (model loading)
- Mistral 7B needs ~8GB RAM

## Tech Stack
- Frontend: React 18 + Vite
- Backend: FastAPI + Python
- AI: Ollama (Mistral 7B) + nomic-embed-text
- Vector DB: ChromaDB
- RAG: LangChain
- PDF: PyMuPDF
- Infrastructure: Docker Compose + Nginx
# paperanalyzer
