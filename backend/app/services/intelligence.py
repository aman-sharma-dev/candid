from typing import List, Dict, Any
from app.schemas.schemas import CandidateAnalysis


def generate_intelligence_report(
    candidate_id: str,
    candidate_name: str,
    job_id: str,
    job_title: str,
    job_requirements: List[str],
    candidate_skills: List[str],
    similarity_score: float,
    github_data: Dict[str, Any] = None
) -> CandidateAnalysis:
    """
    Generates a localized, highly detailed intelligence report comparing candidate profiles against job specifications.
    Operates on CPU, completely self-contained.
    """

    # 1. Identify Strengths and Gaps
    # Case-insensitive mapping
    candidate_skills_lower = {s.lower() for s in candidate_skills}

    # Add GitHub languages to candidate skills if available
    if github_data and "languages" in github_data:
        for lang in github_data["languages"]:
            candidate_skills_lower.add(lang.lower())

    strengths = []
    gaps = []

    for req in job_requirements:
        if req.lower() in candidate_skills_lower:
            strengths.append(req)
        else:
            gaps.append(req)

    # If no explicit strengths or gaps are identified, add generic ones
    if not strengths:
        # Fallback: take candidate's top listed skills
        strengths = candidate_skills[:3] if candidate_skills else ["General Technical Aptitude"]
    if not gaps:
        gaps = ["Advanced Specialization in Role-Specific Tools"]

    # 2. Formulate Candidate Summary
    score_pct = int(similarity_score * 100)

    # Analyze experience level from GitHub or resume if possible
    github_repo_count = github_data.get("public_repos", 0) if github_data else 0
    github_followers = github_data.get("followers", 0) if github_data else 0

    experience_summary = ""
    if github_data and github_repo_count > 0:
        experience_summary = f" The candidate exhibits an active public footprint with {github_repo_count} repositories, demonstrating a commitment to open-source and collaborative coding."
        if github_followers > 5:
            experience_summary += f" They also maintain a small community following of {github_followers} followers."

    if similarity_score >= 0.75:
        summary = (
            f"{candidate_name} is an exceptional match for the {job_title} position (Match Score: {score_pct}%). "
            f"They possess deep technical alignment, particularly with core requirements such as {', '.join(strengths[:4])}. "
            f"Their profile reflects standard architectural understanding and capability.{experience_summary}"
        )
    elif similarity_score >= 0.55:
        summary = (
            f"{candidate_name} is a strong candidate for the {job_title} role (Match Score: {score_pct}%). "
            f"They demonstrate solid foundations, showing capability in {', '.join(strengths[:3])}. "
            f"While there are some technical gaps in {', '.join(gaps[:3])}, their profile indicates they can adapt and scale quickly.{experience_summary}"
        )
    elif similarity_score >= 0.35:
        summary = (
            f"{candidate_name} shows moderate alignment with the {job_title} position (Match Score: {score_pct}%). "
            f"They have foundational experience in {', '.join(strengths[:2]) if strengths else 'general programming'}, "
            f"but lack several key technical requirements including {', '.join(gaps[:3])}. "
            f"Consider for secondary roles or tracks that offer additional training.{experience_summary}"
        )
    else:
        summary = (
            f"{candidate_name} exhibits low alignment for the {job_title} position (Match Score: {score_pct}%). "
            f"The candidate's core skills and background do not strongly overlap with the technical requirements. "
            f"Major gaps include {', '.join(gaps[:4])}."
        )

    # 3. Generate Customized Interview Questions
    interview_questions = []

    # Generate question for strengths (depth verification)
    for strength in strengths[:2]:
        interview_questions.append(
            f"Can you detail a production-level challenge you faced when working with {strength}, and how you optimized its implementation?"
        )

    # Generate question for gaps (adaptability verification)
    for gap in gaps[:2]:
        interview_questions.append(
            f"The {job_title} role relies heavily on {gap}. How would you leverage your existing experience to quickly learn and adopt this technology?"
        )

    # Generate Github specific question if candidate has github activity
    if github_data and github_data.get("repositories"):
        top_repo = github_data["repositories"][0]["name"]
        interview_questions.append(
            f"We noticed your GitHub repository '{top_repo}'. What was the primary motivation behind this project, and what technical trade-offs did you make during its development?"
        )
    else:
        interview_questions.append(
            "How do you typically structure your development workflow and keep up to date with modern software engineering practices?"
        )

    # 4. Return complete analysis schema
    return CandidateAnalysis(
        candidate_id=candidate_id,
        candidate_name=candidate_name,
        job_id=job_id,
        similarity_score=similarity_score,
        summary=summary,
        strengths=strengths,
        gaps=gaps,
        interview_questions=interview_questions
    )
