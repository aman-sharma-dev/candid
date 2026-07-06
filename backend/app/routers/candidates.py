import uuid
import logging
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.db import get_db
from app.core.config import settings
from app.models.models import Candidate as DBCandidate
from app.models.models import Job as DBJob
from app.schemas.schemas import CandidateResponse
from app.services.parser import extract_text_from_pdf, parse_resume_text
from app.services.github import extract_github_profile

logger = logging.getLogger("CandidatesRouter")

router = APIRouter(prefix="/api", tags=["Candidates"])


@router.post("/candidates", response_model=CandidateResponse)
async def create_candidate(
    file: Optional[UploadFile] = File(None),
    text_resume: Optional[str] = Form(None),
    github_username: Optional[str] = Form(None),
    name: Optional[str] = Form(None),
    email: Optional[str] = Form(None),
    phone: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    parsed_text = ""
    skills = []
    experience = []

    # 1. Parse Resume File or Text
    if file:
        file_bytes = await file.read()
        if file.filename.lower().endswith(".pdf"):
            parsed_text = extract_text_from_pdf(file_bytes)
        else:
            parsed_text = file_bytes.decode("utf-8", errors="ignore")

        parsed_info, skills = parse_resume_text(parsed_text, filename=file.filename)
    elif text_resume:
        parsed_text = text_resume
        parsed_info, skills = parse_resume_text(parsed_text)
    else:
        raise HTTPException(status_code=400, detail="Either file or text_resume must be provided")

    # Merge overrides
    candidate_name = name if name else parsed_info.get("name", "Unknown Candidate")
    candidate_email = email if email else parsed_info.get("email")
    candidate_phone = phone if phone else parsed_info.get("phone")
    experience = parsed_info.get("experience", [])

    # 2. Extract GitHub Profile
    github_data = None
    if github_username:
        logger.info(f"Extracting GitHub profile for candidate: {github_username}")
        github_data = await extract_github_profile(github_username)

    candidate_id = f"cand-{uuid.uuid4().hex[:8]}"
    db_candidate = DBCandidate(
        id=candidate_id,
        name=candidate_name,
        email=candidate_email,
        phone=candidate_phone,
        skills=skills,
        experience=experience,
        github_username=github_username,
        parsed_text=parsed_text,
        github_data=github_data
    )
    db.add(db_candidate)
    db.commit()
    db.refresh(db_candidate)

    logger.info(f"Ingested Candidate: {candidate_name} ({candidate_id})")
    return db_candidate


@router.get("/candidates", response_model=List[CandidateResponse])
def list_candidates(db: Session = Depends(get_db)):
    return db.query(DBCandidate).all()


@router.get("/candidates/{candidate_id}", response_model=CandidateResponse)
def get_candidate(candidate_id: str, db: Session = Depends(get_db)):
    db_cand = db.query(DBCandidate).filter(DBCandidate.id == candidate_id).first()
    if not db_cand:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return db_cand


# Protected Demo Seed Endpoint
@router.post("/demo/seed")
async def seed_demo_candidates(db: Session = Depends(get_db)):
    # Protection flag check
    if not settings.DEMO_MODE:
        raise HTTPException(status_code=403, detail="Demo Mode seeding is disabled in production settings.")

    logger.info("Seeding candidate talent pool with realistic demo profiles...")

    # 1. Seed sample jobs if they do not exist
    if not db.query(DBJob).filter(DBJob.id == "job-ai-eng-1").first():
        db_job_1 = DBJob(
            id="job-ai-eng-1",
            title="Senior Machine Learning Engineer (ROCm/CUDA)",
            description="We are seeking a senior systems-focused ML engineer to deploy large scale embeddings models. Experience with PyTorch ROCm/CUDA and FastAPI containers is mandatory.",
            requirements=["Python", "PyTorch", "ROCm", "CUDA", "Docker", "FastAPI", "Embeddings"]
        )
        db.add(db_job_1)

    if not db.query(DBJob).filter(DBJob.id == "job-fe-nextjs-2").first():
        db_job_2 = DBJob(
            id="job-fe-nextjs-2",
            title="Lead Frontend Architect (React & Next.js)",
            description="Looking for a seasoned frontend developer with advanced Next.js App Router expertise, Tailwind CSS styling systems, and client-side performance optimization skills.",
            requirements=["TypeScript", "React", "Next.js", "Tailwind", "CSS", "HTML", "System Design"]
        )
        db.add(db_job_2)

    # 2. Drop existing demo candidates to avoid duplicates
    demo_ids = ["demo-ml-alice", "demo-fe-bob", "demo-devops-charlie"]
    db.query(DBCandidate).filter(DBCandidate.id.in_(demo_ids)).delete(synchronize_session=False)

    # Candidate 1: AI/ML Engineer
    db_candidates_1 = DBCandidate(
        id="demo-ml-alice",
        name="Alice Vance",
        email="alice.vance@example.com",
        phone="+1 (555) 901-2345",
        skills=["Python", "PyTorch", "Docker", "CUDA", "ROCm", "Embeddings", "FastAPI"],
        experience=[
            "Senior ML Engineer at AI Systems (2022 - Present) - Built distributed model inference containers using PyTorch ROCm and FastAPI.",
            "ML Engineer at NeuralCorp (2020 - 2022) - Trained and deployed sentence embeddings transformers and vector databases."
        ],
        github_username="alicev",
        parsed_text="""Alice Vance
Email: alice.vance@example.com
Phone: +1 (555) 901-2345
GitHub: alicev

SUMMARY:
Highly skilled Machine Learning Engineer with deep expertise in PyTorch model architectures, GPU hardware optimization (ROCm and CUDA), and high-throughput microservices.

EXPERIENCE:
Senior ML Engineer | AI Systems (2022 - Present)
- Designed and built low-latency embedding microservices using PyTorch and FastAPI.
- Ported Nvidia CUDA inference codebases to AMD ROCm environments for deployment on AMD Instinct GPUs.
- Dockerized model serving containers and optimized huggingface caches for rapid startup.

ML Engineer | NeuralCorp (2020 - 2022)
- Researched semantic search improvements using sentence transformer embeddings.
- Maintained production vector search indices containing over 10M documents.""",
        github_data={
            "username": "alicev",
            "name": "Alice Vance",
            "bio": "ML Systems researcher. Working on PyTorch ROCm tuning and distributed vector search engines.",
            "public_repos": 18,
            "followers": 42,
            "repositories": [
                {
                    "name": "pytorch-rocm-tuner",
                    "description": "Helper utilities for profiling and tuning PyTorch models on ROCm Instinct cards.",
                    "stars": 24,
                    "language": "Python",
                    "url": "https://github.com/alicev/pytorch-rocm-tuner"
                },
                {
                    "name": "vector-embedding-server",
                    "description": "High throughput embedding extraction server using FastAPI.",
                    "stars": 19,
                    "language": "Python",
                    "url": "https://github.com/alicev/vector-embedding-server"
                }
            ],
            "languages": {
                "Python": 72.4,
                "C++": 20.1,
                "Dockerfile": 7.5
            },
            "error": None
        }
    )
    db.add(db_candidates_1)

    # Candidate 2: Frontend Architect
    db_candidates_2 = DBCandidate(
        id="demo-fe-bob",
        name="Bob Chen",
        email="bob.chen@example.com",
        phone="+1 (555) 678-9012",
        skills=["TypeScript", "React", "Next.js", "Tailwind", "CSS", "HTML", "System Design"],
        experience=[
            "Lead Frontend Architect at PixelPerfect (2021 - Present) - Directed conversion of legacy dashboards to Next.js App Router.",
            "UI Developer at WebFlow (2019 - 2021) - Engineered premium responsive design systems using Tailwind CSS and React."
        ],
        github_username="bobc",
        parsed_text="""Bob Chen
Email: bob.chen@example.com
Phone: +1 (555) 678-9012
GitHub: bobc

SUMMARY:
Lead Frontend Developer specializing in React, Next.js, and high-fidelity custom design systems. Passionate about performant layouts and clean component architectures.

EXPERIENCE:
Lead Frontend Architect | PixelPerfect (2021 - Present)
- Architected candidate dashboards in Next.js App Router, using Tailwind CSS and CSS Modules.
- Developed modular React component libraries featuring accessible, animated elements.
- Improved PageSpeed core web vitals by 40% using dynamic asset optimization.

UI Developer | WebFlow (2019 - 2021)
- Hand-crafted vanilla CSS and Tailwind utilities for high-performance responsive web pages.
- Collaborated with UI design teams to translate complex Figma mockups into React layouts.""",
        github_data={
            "username": "bobc",
            "name": "Bob Chen",
            "bio": "Next.js core fan. Building glassmorphic design systems and performant React applications.",
            "public_repos": 31,
            "followers": 15,
            "repositories": [
                {
                    "name": "nextjs-glassmorphism-dashboard",
                    "description": "Fully featured dashboard mockups with gorgeous Tailwind glass properties.",
                    "stars": 45,
                    "language": "TypeScript",
                    "url": "https://github.com/bobc/nextjs-glassmorphism-dashboard"
                },
                {
                    "name": "tailwind-components-lib",
                    "description": "Collection of copy-pasteable responsive Tailwind v4 components.",
                    "stars": 12,
                    "language": "CSS",
                    "url": "https://github.com/bobc/tailwind-components-lib"
                }
            ],
            "languages": {
                "TypeScript": 68.2,
                "JavaScript": 21.0,
                "CSS": 10.8
            },
            "error": None
        }
    )
    db.add(db_candidates_2)

    # Candidate 3: DevOps Engineer
    db_candidates_3 = DBCandidate(
        id="demo-devops-charlie",
        name="Charlie Drake",
        email="charlie.drake@example.com",
        phone="+1 (555) 345-6789",
        skills=["Docker", "Kubernetes", "Git", "AWS", "Go", "Python"],
        experience=[
            "DevOps Engineer at CloudOps (2022 - Present) - Configured multi-cluster Kubernetes auto-scaling groups on AWS.",
            "Systems Administrator at HostCorp (2018 - 2022) - Maintained linux servers, bash scripting, and docker builds."
        ],
        github_username="charlied",
        parsed_text="""Charlie Drake
Email: charlie.drake@example.com
Phone: +1 (555) 345-6789
GitHub: charlied

SUMMARY:
DevOps Specialist focused on automated infrastructure, container orchestration with Kubernetes, and robust CI/CD pipelines.

EXPERIENCE:
DevOps Engineer | CloudOps (2022 - Present)
- Designed and maintained multi-region Kubernetes clusters on AWS EKS.
- Wrote Go-based controllers to automate container scaling during traffic spikes.
- Established secure, reproducible container build workflows using GitHub Actions.

Systems Administrator | HostCorp (2018 - 2022)
- Managed 100+ Linux bare metal and VM instances.
- Standardized configuration management scripts using Ansible and Python.""",
        github_data={
            "username": "charlied",
            "name": "Charlie Drake",
            "bio": "SRE/DevOps. Writing K8s operators in Go and optimizing container runtimes.",
            "public_repos": 15,
            "followers": 8,
            "repositories": [
                {
                    "name": "kubernetes-auto-scaler",
                    "description": "Custom Kubernetes horizontal pod autoscaler controller written in Go.",
                    "stars": 34,
                    "language": "Go",
                    "url": "https://github.com/charlied/kubernetes-auto-scaler"
                },
                {
                    "name": "docker-gpu-hpc",
                    "description": "Base Dockerfiles configured with CUDA and ROCm drivers for high performance workloads.",
                    "stars": 15,
                    "language": "Dockerfile",
                    "url": "https://github.com/charlied/docker-gpu-hpc"
                }
            ],
            "languages": {
                "Go": 55.4,
                "Shell": 38.0,
                "Python": 6.6
            },
            "error": None
        }
    )
    db.add(db_candidates_3)

    db.commit()
    return {"message": "Success", "candidates_seeded": 3}
