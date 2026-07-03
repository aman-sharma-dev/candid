from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any


class JobBase(BaseModel):
    title: str = Field(..., example="Senior Fullstack Engineer")
    description: str = Field(..., example="We are looking for a developer experienced in Next.js, FastAPI, and PyTorch...")
    requirements: List[str] = Field(default_factory=list, example=["React", "Next.js", "Python", "FastAPI", "Docker"])


class JobCreate(JobBase):
    pass


class JobResponse(JobBase):
    id: str

    model_config = {"from_attributes": True}


class GitHubRepoInfo(BaseModel):
    name: str
    description: Optional[str] = None
    stars: int
    language: Optional[str] = None
    url: str

    model_config = {"from_attributes": True}


class GitHubProfileData(BaseModel):
    username: str
    name: Optional[str] = None
    bio: Optional[str] = None
    public_repos: int
    followers: int
    repositories: List[GitHubRepoInfo] = Field(default_factory=list)
    languages: Dict[str, float] = Field(default_factory=dict)  # language name -> percentage or count
    error: Optional[str] = None

    model_config = {"from_attributes": True}


class CandidateBase(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    skills: List[str] = Field(default_factory=list)
    experience: List[str] = Field(default_factory=list)
    github_username: Optional[str] = None


class CandidateResponse(CandidateBase):
    id: str
    parsed_text: str
    github_data: Optional[GitHubProfileData] = None

    model_config = {"from_attributes": True}


class CandidateAnalysis(BaseModel):
    candidate_id: str
    candidate_name: str
    job_id: str
    similarity_score: float
    summary: str
    strengths: List[str] = Field(default_factory=list)
    gaps: List[str] = Field(default_factory=list)
    interview_questions: List[str] = Field(default_factory=list)


class ClusterResult(BaseModel):
    cluster_id: int
    name: str  # e.g. "React/Frontend Experts"
    candidate_ids: List[str]
    keywords: List[str]


class RankingResponse(BaseModel):
    job_id: str
    rankings: List[CandidateAnalysis]
    clusters: List[ClusterResult]
