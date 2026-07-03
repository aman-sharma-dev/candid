import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from backend.db import get_db
from backend.models import Job as DBJob
from backend.models import Candidate as DBCandidate
from backend.schemas import RankingResponse, CandidateAnalysis, ClusterResult
from backend.services.embedding import generate_embeddings, calculate_similarity, cluster_candidates
from backend.services.intelligence import generate_intelligence_report

logger = logging.getLogger("AnalyticsRouter")

router = APIRouter(prefix="/api/jobs", tags=["Analytics"])

@router.get("/{job_id}/rankings", response_model=RankingResponse)
async def get_job_rankings(job_id: str, db: Session = Depends(get_db)):
    db_job = db.query(DBJob).filter(DBJob.id == job_id).first()
    if not db_job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    candidates = db.query(DBCandidate).all()
    if not candidates:
        return RankingResponse(job_id=job_id, rankings=[], clusters=[])

    # 1. Compile texts for embeddings
    job_text = f"Job Title: {db_job.title}\nDescription: {db_job.description}\nRequirements: {', '.join(db_job.requirements)}"
    
    candidate_texts = []
    candidate_ids = []
    
    for cand in candidates:
        github_summary = ""
        if cand.github_data and not cand.github_data.get("error"):
            gh = cand.github_data
            github_summary = f"GitHub Bio: {gh.get('bio', '')}\nLanguages: {', '.join(gh.get('languages', {}).keys())}"
            
        cand_text = (
            f"Candidate: {cand.name}\n"
            f"Skills: {', '.join(cand.skills)}\n"
            f"Experience: {', '.join(cand.experience)}\n"
            f"{github_summary}\n"
            f"Resume details: {cand.parsed_text[:1000]}"
        )
        candidate_texts.append(cand_text)
        candidate_ids.append(cand.id)

    # 2. Run GPU Inference: Generate embeddings
    logger.info(f"Computing embeddings for 1 Job and {len(candidates)} Candidates...")
    embeddings = generate_embeddings([job_text] + candidate_texts)
    
    job_embedding = embeddings[0]
    candidate_embeddings = embeddings[1:]

    # 3. Run GPU Inference: Cosine Similarity Scoring
    similarities = calculate_similarity(job_embedding, candidate_embeddings)
    similarities_list = similarities.cpu().numpy().tolist()

    # 4. Generate local intelligence report for each candidate
    rankings = []
    for idx, cand_id in enumerate(candidate_ids):
        cand = db.query(DBCandidate).filter(DBCandidate.id == cand_id).first()
        score = similarities_list[idx]
        
        report = generate_intelligence_report(
            candidate_id=cand_id,
            candidate_name=cand.name,
            job_id=job_id,
            job_title=db_job.title,
            job_requirements=db_job.requirements,
            candidate_skills=cand.skills,
            similarity_score=score,
            github_data=cand.github_data
        )
        rankings.append(report)

    # Sort rankings by similarity score (descending)
    rankings.sort(key=lambda x: x.similarity_score, reverse=True)

    # 5. Run GPU Inference: Clustering candidates (PyTorch K-Means)
    clusters_data = cluster_candidates(candidate_ids, candidate_texts, k=3)
    
    clusters = [
        ClusterResult(
            cluster_id=c["cluster_id"],
            name=c["name"],
            candidate_ids=c["candidate_ids"],
            keywords=c["keywords"]
        )
        for c in clusters_data
    ]

    return RankingResponse(
        job_id=job_id,
        rankings=rankings,
        clusters=clusters
    )
