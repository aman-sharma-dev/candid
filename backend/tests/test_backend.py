import os
import sys
import unittest
from unittest.mock import patch, MagicMock

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Ensure backend package can be imported
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app
from app.core.db import Base, get_db
from app.models.models import Candidate as DBCandidate, Job as DBJob
from app.services.parser import parse_resume_text
from app.services.intelligence import generate_intelligence_report
from app.services.github import extract_github_profile


class TestApiDeleteEndpoints(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine(
            "sqlite://",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        self.TestSessionLocal = sessionmaker(bind=self.engine, autocommit=False, autoflush=False)
        Base.metadata.create_all(bind=self.engine)
        self.db = self.TestSessionLocal()
        app.dependency_overrides[get_db] = self._override_get_db
        self.client = TestClient(app)

    def tearDown(self):
        app.dependency_overrides.clear()
        self.db.close()
        self.engine.dispose()

    def _override_get_db(self):
        db = self.TestSessionLocal()
        try:
            yield db
        finally:
            db.close()

    def test_delete_candidate_endpoint(self):
        candidate = DBCandidate(
            id="cand-delete-test",
            name="Delete Me",
            email="delete@example.com",
            phone="123",
            skills=["Python"],
            experience=["Worked on deletes"],
            github_username="deleteme",
            parsed_text="Delete Me",
            github_data={"username": "deleteme", "public_repos": 3, "followers": 1, "repositories": [], "languages": {}},
        )
        self.db.add(candidate)
        self.db.commit()

        response = self.client.delete("/api/candidates/cand-delete-test")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["id"], "cand-delete-test")
        self.assertIsNone(self.db.query(DBCandidate).filter(DBCandidate.id == "cand-delete-test").first())

    def test_delete_job_endpoint(self):
        job = DBJob(
            id="job-delete-test",
            title="Delete Me Job",
            description="A job to delete",
            requirements=["Python"],
        )
        self.db.add(job)
        self.db.commit()

        response = self.client.delete("/api/jobs/job-delete-test")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["id"], "job-delete-test")
        self.assertIsNone(self.db.query(DBJob).filter(DBJob.id == "job-delete-test").first())


class TestBackendServices(unittest.IsolatedAsyncioTestCase):

    def test_resume_parser(self):
        text = """
        John Doe
        Email: john.doe@example.com
        Phone: (123) 456-7890

        Experience:
        Senior Software Engineer (2020 - Present)
        Developed AI platforms using PyTorch, FastAPI, and Docker.
        Experienced with React and Next.js for frontend work.
        """

        parsed, skills = parse_resume_text(text, filename="john_doe_cv.pdf")

        self.assertEqual(parsed["name"], "John Doe")
        self.assertEqual(parsed["email"], "john.doe@example.com")
        self.assertEqual(parsed["phone"], "(123) 456-7890")
        self.assertIn("PyTorch", skills)
        self.assertIn("FastAPI", skills)
        self.assertIn("Docker", skills)
        self.assertIn("React", skills)
        self.assertIn("Next.js", skills)
        self.assertTrue(len(parsed["experience"]) > 0)
        self.assertIn("Senior Software Engineer", parsed["experience"][0])

    def test_intelligence_report(self):
        job_requirements = ["Python", "PyTorch", "Kubernetes", "React"]
        candidate_skills = ["Python", "PyTorch", "Docker"]

        report = generate_intelligence_report(
            candidate_id="cand-123",
            candidate_name="Jane Smith",
            job_id="job-456",
            job_title="ML Ops Engineer",
            job_requirements=job_requirements,
            candidate_skills=candidate_skills,
            similarity_score=0.78,
            github_data={"public_repos": 12, "followers": 8}
        )

        self.assertEqual(report.candidate_id, "cand-123")
        self.assertEqual(report.candidate_name, "Jane Smith")
        self.assertEqual(report.job_id, "job-456")
        self.assertEqual(report.similarity_score, 0.78)
        self.assertIn("Jane Smith is an exceptional match", report.summary)
        self.assertIn("Python", report.strengths)
        self.assertIn("PyTorch", report.strengths)
        self.assertIn("Kubernetes", report.gaps)
        self.assertTrue(len(report.interview_questions) > 0)

    @patch("httpx.AsyncClient.get")
    async def test_github_fallback(self, mock_get):
        # Mock request error to test graceful fallback
        mock_get.side_effect = Exception("Connection refused")

        profile = await extract_github_profile("invalid-user-123")
        self.assertEqual(profile["username"], "invalid-user-123")
        self.assertEqual(profile["public_repos"], 14)
        self.assertEqual(profile["error"], None)


if __name__ == "__main__":
    unittest.main()
