import re
import io
import logging
from pypdf import PdfReader
from typing import List, Dict, Any, Tuple

logger = logging.getLogger("ResumeParser")

# List of common technical skills to search for
SKILLS_VOCABULARY = [
    "Python", "PyTorch", "TensorFlow", "Keras", "Scikit-Learn", "NumPy", "Pandas",
    "ROCm", "CUDA", "FastAPI", "Flask", "Django", "SQL", "PostgreSQL", "MongoDB", "Redis",
    "JavaScript", "TypeScript", "React", "Next.js", "Vue", "Angular", "HTML", "CSS", "Tailwind",
    "Docker", "Kubernetes", "AWS", "GCP", "Azure", "Git", "CI/CD", "Rust", "Go", "C++", "Java",
    "Machine Learning", "Deep Learning", "NLP", "LLM", "Embeddings", "Vector Databases",
    "System Design", "Microservices", "REST API", "GraphQL"
]

def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """Extracts all text from PDF bytes."""
    try:
        pdf_file = io.BytesIO(pdf_bytes)
        reader = PdfReader(pdf_file)
        text = ""
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
        return text
    except Exception as e:
        logger.error(f"Error reading PDF: {e}")
        return ""

def parse_resume_text(text: str, filename: str = "") -> Tuple[Dict[str, Any], List[str]]:
    """
    Parses resume text to extract name, email, phone, skills, and experience items.
    Runs on CPU.
    """
    # 1. Extract Email
    email_pattern = r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+'
    emails = re.findall(email_pattern, text)
    email = emails[0] if emails else None

    # 2. Extract Phone
    phone_pattern = r'(?:(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})'
    phones = re.findall(phone_pattern, text)
    phone = phones[0] if phones else None

    # 3. Extract Name
    # Heuristic: Find first non-empty lines, exclude common headers.
    lines = [line.strip() for line in text.split('\n') if line.strip()]
    name = None
    for line in lines[:3]:
        # Exclude lines containing contact details or typical headers
        if "@" not in line and not any(kw in line.lower() for kw in ["resume", "cv", "curriculum", "page", "phone", "email"]):
            # Check if line looks like a name (e.g. 2-3 words capitalized)
            words = line.split()
            if 1 <= len(words) <= 4 and all(w[0].isupper() or w[0].isdigit() or w.lower() in ["de", "von", "van"] for w in words if w):
                name = line
                break
    
    if not name:
        # Fallback to filename (strip extension)
        if filename:
            name = filename.rsplit('.', 1)[0].replace('_', ' ').replace('-', ' ').title()
        else:
            name = "Unknown Candidate"

    # 4. Extract Skills
    skills = []
    for skill in SKILLS_VOCABULARY:
        # Use word boundaries or check substring depending on special characters
        pattern = r'\b' + re.escape(skill) + r'\b'
        # Handle cases like Next.js, C++ which don't have standard word boundaries at the end
        if skill.endswith('.') or skill.endswith('+'):
            pattern = r'\b' + re.escape(skill)
        
        if re.search(pattern, text, re.IGNORECASE):
            skills.append(skill)

    # 5. Extract Experience (Simple heuristic: find lines starting with year/date or containing common titles)
    experience = []
    exp_keywords = ["engineer", "developer", "scientist", "analyst", "lead", "manager", "intern"]
    date_pattern = r'\b(19|20)\d{2}\b'
    
    for line in lines:
        if any(kw in line.lower() for kw in exp_keywords) and (re.search(date_pattern, line) or any(m in line.lower() for m in ["present", "current"])):
            experience.append(line)
            if len(experience) >= 5: # Limit to top 5 experience highlights
                break

    parsed_info = {
        "name": name,
        "email": email,
        "phone": phone,
        "skills": skills,
        "experience": experience
    }
    
    return parsed_info, skills
