# CandidAI | Core Vector Inference Backend

This directory hosts the FastAPI backend service responsible for PDF parsing, GitHub enrichment, PyTorch SentenceTransformers, and candidate vector clustering on AMD/Nvidia GPUs.

---

## Project Structure

The backend codebase is organized into clean, modular components:

```
backend/
├── app/
│   ├── main.py                  # FastAPI app entry point
│   ├── core/                    # Core configuration and initialization
│   │   ├── config.py            # Environment settings (DATABASE_URL, etc.)
│   │   ├── db.py                # SQLAlchemy engine and session management
│   │   ├── gpu_init.py          # PyTorch device detection
│   │   ├── logging.py           # Logging setup
│   │   └── startup.py           # Startup tasks (DB init, GPU warmup)
│   ├── models/                  # SQLAlchemy ORM models
│   │   └── models.py
│   ├── schemas/                 # Pydantic request/response schemas
│   │   └── schemas.py
│   ├── routers/                 # API endpoints
│   │   ├── jobs.py
│   │   ├── candidates.py
│   │   ├── analytics.py
│   │   └── __init__.py
│   ├── services/                # Business logic layer
│   │   ├── embedding.py         # SentenceTransformers, similarity, clustering
│   │   ├── parser.py            # PDF/text resume parsing
│   │   ├── github.py            # GitHub profile enrichment
│   │   ├── intelligence.py      # Candidate analysis report generation
│   │   └── __init__.py
│   ├── utils/                   # Utility functions
│   └── __init__.py
├── tests/                       # Tests
│   └── test_backend.py
├── .env                         # Environment variables
├── Dockerfile.local             # NVIDIA CUDA Docker config
├── Dockerfile.production        # AMD ROCm Docker config
├── pyproject.toml               # uv project config
└── uv.lock                      # uv dependency lock file
```

---

## API Structure

The backend routers are organized into logical modules under `/routers` and `/services`:

* **`GET /api/status`**: System hardware diagnostics reporting active compute backend (`cuda` vs. `cpu`) and device specifications.
* **`POST /api/jobs`**: Commits new Job Descriptions to Neon PostgreSQL.
* **`GET /api/jobs`**: Queries job lists from Neon.
* **`POST /api/candidates`**: Ingests resume files or text, triggers CPU parsing/GitHub extraction, and writes candidate models to the database.
* **`POST /api/demo/seed`**: Protected demonstration endpoint that seeds sample AI, Frontend, and DevOps candidates and roles.
* **`GET /api/jobs/{job_id}/rankings`**: Core vector computation endpoint. Loads the embedding model, extracts candidate and job vectors, executes cosine similarity rankings, and clusters profiles.

---

## GPU Execution Flow

1. **Warm Start**: During `app/main.py` startup, an asynchronous task spawns to pre-load `BAAI/bge-large-en-v1.5` weights and execute a dummy warmup batch through PyTorch. This ensures subsequent live requests return matching metrics under **40ms**.
2. **Device Selection ([app/core/gpu_init.py](file:///d:/Projects/candid/backend/app/core/gpu_init.py))**: PyTorch queries the hardware layer using `torch.cuda.is_available()`. This unified API detects both NVIDIA CUDA cores and AMD ROCm Instinct GPU targets.
3. **Embeddings & Vector Ranking**: Re-maps text into a 1024-dimensional semantic space. Scores are computed via matrix multiplication (`torch.mm`) directly on the GPU.
4. **PyTorch K-Means clustering**: Profiles are grouped on the GPU using a lightweight PyTorch K-Means implementation to compute similarity cohorts.

---

## Database Configuration

CandidAI relies on **Neon PostgreSQL** serverless database storage.
- The connection parameters are read from the `DATABASE_URL` environment variable.
- The application automatically handles table generation and migrations during startup:
  ```python
  Base.metadata.create_all(bind=engine)
  ```
- No separate database setup commands are necessary. Tables are mapped using SQLAlchemy ORM inside [app/models/models.py](file:///d:/Projects/candid/backend/app/models/models.py).
- Environment variables are loaded from `backend/.env` regardless of where the app is started from.

---

## UV Package Workflow

This project utilizes [uv](https://github.com/astral-sh/uv) as the Python virtualenv and package manager, ensuring reproducible, deterministic virtual environments.

### Install UV locally
```bash
pip install uv  # Or use standard system package managers
```

### Sync Dependencies
Create the virtual environment and compile exact locked dependencies using:
```bash
uv sync --frozen
```

### Add a Package
```bash
uv add package-name
```

### Update lock file
If dependencies are edited inside `pyproject.toml`, update `uv.lock` by running:
```bash
uv lock
```

---

## Running the Backend

### Local Development (UV)
```bash
cd backend
uv sync  # Install dependencies
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Running Tests
```bash
cd backend
uv run python -m tests.test_backend
```

---

## Docker Implementations

### Dockerfile.local (CUDA)
Uses `pytorch/pytorch:2.3.0-cuda12.1-cudnn8-devel` as the base image. It synchronizes dependencies using `uv sync` and runs uvicorn.

### Dockerfile.production (ROCm)
Uses `rocm/pytorch:rocm6.1_ubuntu22.04_py3.10_pytorch_2.3.0` optimized for AMD Cloud VMs. It mounts a HuggingFace directory at `/root/.cache/huggingface` to preserve model weights across container restarts.
