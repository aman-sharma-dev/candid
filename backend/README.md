# CandidAI Backend

The CandidAI backend is a FastAPI inference service responsible for candidate ingestion, semantic ranking, GPU-accelerated embedding generation, GitHub enrichment, and interview question generation.

It is designed to run on both **AMD ROCm** and **NVIDIA CUDA** using the same codebase.

---

# Responsibilities

- Resume ingestion & parsing
- GitHub profile enrichment
- Semantic embedding generation
- Candidate ranking
- Candidate clustering
- Interview question generation
- PostgreSQL persistence
- GPU diagnostics

---

# Project Structure

```text
backend/
│
├── app/
│   ├── main.py
│   ├── core/
│   ├── models/
│   ├── routers/
│   ├── schemas/
│   ├── services/
│   └── utils/
│
├── tests/
├── Dockerfile.local
├── Dockerfile.production
├── pyproject.toml
├── uv.lock
└── .env.example
```

---

# API

| Endpoint | Description |
|----------|-------------|
| GET /api/status | GPU diagnostics |
| POST /api/jobs | Create job |
| GET /api/jobs | List jobs |
| DELETE /api/jobs/{id} | Delete job |
| POST /api/candidates | Upload candidate |
| GET /api/candidates | List candidates |
| DELETE /api/candidates/{id} | Delete candidate |
| GET /api/jobs/{job_id}/rankings | Rank candidates |
| POST /api/demo/seed | Seed demo dataset |

---

# AI Pipeline

The ranking pipeline follows these stages:

```
Resume
      │
PDF Parsing
      │
GitHub Enrichment
      │
Semantic Embeddings
      │
Vector Similarity
      │
GPU K-Means Clustering
      │
Ranked Candidates
      │
Interview Questions
```

Candidate ranking uses **BAAI/bge-large-en-v1.5** semantic embeddings rather than a Large Language Model.

This provides:

- Deterministic rankings
- Lower latency
- Lower memory usage
- Lower inference cost
- No hallucinations

---

# GPU Support

At startup the backend:

- Detects the available compute device
- Loads the embedding model
- Performs a warmup inference
- Keeps the model resident in GPU memory

The same application runs on:

- NVIDIA CUDA
- AMD ROCm

without application code changes.

---

# Database

The backend uses **Neon PostgreSQL** with SQLAlchemy.

Database tables are automatically created during application startup.

Connection is configured through:

```env
DATABASE_URL=
```

---

# Local Development

Install dependencies

```bash
uv sync
```

Run

```bash
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

---

# Running Tests

```bash
uv run python -m tests.test_backend
```

---

# Docker

## Local NVIDIA CUDA

Build

```bash
docker build -f Dockerfile.local -t candid-backend .
```

Run

```bash
docker run --rm \
--gpus all \
-p 8000:8000 \
--env-file .env.local \
candid-backend
```

---

## AMD ROCm

Build

```bash
docker build -f Dockerfile.production -t candid-backend .
```

Run

```bash
docker run \
--device=/dev/kfd \
--device=/dev/dri \
--group-add video \
-p 8000:8000 \
--env-file .env \
candid-backend
```