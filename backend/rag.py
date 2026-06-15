import fitz  # PyMuPDF
import chromadb
import ollama
import uuid
import os
from typing import List, Generator


class RAGEngine:
    def __init__(self):
        self.client = chromadb.PersistentClient(path="./chroma_db")
        self.collection = self.client.get_or_create_collection(
            name="papers",
            metadata={"hnsw:space": "cosine"}
        )
        self.model = "phi3:mini"
        self.embed_model = "nomic-embed-text"

    def _extract_text(self, pdf_path: str) -> str:
        doc = fitz.open(pdf_path)
        text = ""
        for page in doc:
            text += page.get_text()
        return text

    def _chunk_text(self, text: str, chunk_size: int = 800, overlap: int = 100) -> List[str]:
        chunks = []
        start = 0
        while start < len(text):
            end = start + chunk_size
            chunk = text[start:end]
            if chunk.strip():
                chunks.append(chunk.strip())
            start += chunk_size - overlap
        return chunks

    def _embed(self, text: str) -> List[float]:
        response = ollama.embeddings(model=self.embed_model, prompt=text)
        return response["embedding"]

    def process_pdf(self, pdf_path: str, filename: str) -> str:
        paper_id = str(uuid.uuid4())[:8]
        text = self._extract_text(pdf_path)
        chunks = self._chunk_text(text)

        ids = []
        embeddings = []
        documents = []
        metadatas = []

        for i, chunk in enumerate(chunks):
            chunk_id = f"{paper_id}_{i}"
            embedding = self._embed(chunk)
            ids.append(chunk_id)
            embeddings.append(embedding)
            documents.append(chunk)
            metadatas.append({"paper_id": paper_id, "filename": filename, "chunk_index": i})

        self.collection.add(
            ids=ids,
            embeddings=embeddings,
            documents=documents,
            metadatas=metadatas
        )

        meta_path = f"./chroma_db/{paper_id}.meta"
        with open(meta_path, "w") as f:
            f.write(f"{filename}\n{len(chunks)}")

        return paper_id

    def list_papers(self):
        papers = []
        meta_dir = "./chroma_db"
        for file in os.listdir(meta_dir):
            if file.endswith(".meta"):
                paper_id = file.replace(".meta", "")
                with open(os.path.join(meta_dir, file), "r") as f:
                    lines = f.read().splitlines()
                    filename = lines[0] if lines else "Unknown"
                    chunks = lines[1] if len(lines) > 1 else "0"
                papers.append({
                    "paper_id": paper_id,
                    "filename": filename,
                    "chunks": int(chunks)
                })
        return papers

    # ── STREAMING ASK ──────────────────────────────────────
    def ask_stream(self, question: str, paper_id: str) -> Generator[str, None, None]:
        query_embedding = self._embed(question)

        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=5,
            where={"paper_id": paper_id}
        )

        if not results["documents"] or not results["documents"][0]:
            yield "No relevant content found in this paper."
            return

        context = "\n\n".join(results["documents"][0])

        prompt = f"""You are an academic paper assistant. Answer the question based ONLY on the provided context from the paper. If the answer is not in the context, say "This information is not found in the paper."

Context from paper:
{context}

Question: {question}

Answer:"""

        # ollama.chat with stream=True returns a generator
        stream = ollama.chat(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            stream=True
        )

        for chunk in stream:
            token = chunk["message"]["content"]
            if token:
                yield token

    # ── STREAMING SUMMARIZE ────────────────────────────────
    def summarize_stream(self, paper_id: str) -> Generator[str, None, None]:
        results = self.collection.get(
            where={"paper_id": paper_id},
            limit=10
        )

        if not results["documents"]:
            yield "Paper not found."
            return

        context = "\n\n".join(results["documents"][:8])

        prompt = f"""You are an academic paper summarizer. Based on the following excerpts from a research paper, provide a structured summary including:

1. **Main Topic**: What is this paper about?
2. **Objectives**: What does it aim to achieve?
3. **Methodology**: What methods/approaches are used?
4. **Key Findings**: What are the main results?
5. **Conclusion**: What conclusions are drawn?

Paper excerpts:
{context}

Structured Summary:"""

        stream = ollama.chat(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            stream=True
        )

        for chunk in stream:
            token = chunk["message"]["content"]
            if token:
                yield token

    # ── NON-STREAMING (backup) ─────────────────────────────
    def ask(self, question: str, paper_id: str) -> str:
        return "".join(self.ask_stream(question, paper_id))

    def summarize(self, paper_id: str) -> str:
        return "".join(self.summarize_stream(paper_id))

    def delete_paper(self, paper_id: str):
        results = self.collection.get(where={"paper_id": paper_id})
        if results["ids"]:
            self.collection.delete(ids=results["ids"])
        meta_path = f"./chroma_db/{paper_id}.meta"
        if os.path.exists(meta_path):
            os.remove(meta_path)