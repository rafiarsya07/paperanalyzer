from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import os
import shutil
import json
from rag import RAGEngine

app = FastAPI(title="PaperMind API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

rag = RAGEngine()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


class QuestionRequest(BaseModel):
    question: str
    paper_id: str


class PaperRequest(BaseModel):
    paper_id: str


# ── HELPERS ─────────────────────────────────────────────
def token_stream(generator):
    """
    Wraps a token generator into SSE (Server-Sent Events) format.
    Frontend reads this with EventSource or fetch + ReadableStream.
    Each line: data: {"token": "..."}\n\n
    Final line: data: [DONE]\n\n
    """
    try:
        for token in generator:
            payload = json.dumps({"token": token})
            yield f"data: {payload}\n\n"
    except Exception as e:
        yield f"data: {json.dumps({'error': str(e)})}\n\n"
    finally:
        yield "data: [DONE]\n\n"


# ── ROUTES ──────────────────────────────────────────────
@app.get("/")
def root():
    return {"status": "PaperMind API running"}


@app.get("/papers")
def list_papers():
    papers = rag.list_papers()
    return {"papers": papers}


@app.post("/upload")
async def upload_paper(file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    try:
        paper_id = rag.process_pdf(file_path, file.filename)
        return {"message": "Paper processed successfully", "paper_id": paper_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── STREAMING /ask ───────────────────────────────────────
@app.post("/ask/stream")
async def ask_stream(request: QuestionRequest):
    return StreamingResponse(
        token_stream(rag.ask_stream(request.question, request.paper_id)),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",   # penting! biar nginx ga buffer
        }
    )


# ── STREAMING /summarize ─────────────────────────────────
@app.post("/summarize/stream")
async def summarize_stream(request: PaperRequest):
    return StreamingResponse(
        token_stream(rag.summarize_stream(request.paper_id)),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        }
    )


# ── NON-STREAMING (backup, tetap ada) ───────────────────
@app.post("/ask")
async def ask_question(request: QuestionRequest):
    try:
        answer = rag.ask(request.question, request.paper_id)
        return {"answer": answer, "paper_id": request.paper_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/summarize")
async def summarize_paper(request: PaperRequest):
    try:
        summary = rag.summarize(request.paper_id)
        return {"summary": summary, "paper_id": request.paper_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/paper")
async def delete_paper(request: PaperRequest):
    try:
        rag.delete_paper(request.paper_id)
        return {"message": "Paper deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))