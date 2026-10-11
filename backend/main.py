from fastapi import FastAPI, UploadFile, File, HTTPException
from pypdf import PdfReader
import io
import json
from backend.services.resume_analysis import analyze_resume
from backend.services.role_recommendation import generate_other_roles
from backend.services.roadmap import generate_roadmap
from backend.setup_vector_db import create_db
from backend.config import qdrant_client,COLLECTION_NAME
from backend.schemas import JobDescription,jd_response_format


app = FastAPI()

# global variables

resume_content = ""
role_selection = ""
custom_jd=None


''' HELPER FUNCTION'''

def get_target():
    if role_selection:
        return {"role_selection": role_selection}
    elif custom_jd is not None:
        return {"custom_jd": custom_jd.model_dump_json(indent=2)}

    raise HTTPException(
        status_code=400,
        detail="Select a role or upload a custom JD"
    )


# -----------------------------
# VECTOR DB VALIDATION
# -----------------------------


print("\n[Step 1/2] Checking vector database...")

if not qdrant_client.collection_exists(COLLECTION_NAME):
    print("\n  Vector database not found. Setting up now (this only runs once)...")
    result = create_db()
    print(f"\n  {result}")

collection_info = qdrant_client.get_collection(COLLECTION_NAME)
vector_count = collection_info.points_count

print(f"  Vector DB ready — {vector_count} knowledge chunks loaded.")


# -----------------------------
# ENDPOINTS
# -----------------------------

''' HOME/DEFAULT '''

@app.get("/")
def home():
    return{"Description":"ResuMind — RAG-Powered Resume Intelligence & Job Fit Analysis"}


''' PDF UPLOAD '''

@app.post("/upload-pdf")
async def upload_pdf(file: UploadFile = File(...)):

    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")

    pdf_bytes = await file.read()

    reader = PdfReader(io.BytesIO(pdf_bytes))

    global resume_content

    for page in reader.pages:
        resume_content += page.extract_text() or ""

    if not resume_content.strip():
        raise HTTPException(status_code=422, detail="The Uploaded PDF does not contain usable content.")

    # Lightweight check: does the content look like a resume?
    resume_keywords = [
        "education", "experience", "skills", "projects", "work",
        "university", "college", "degree", "certification",
        "internship", "objective", "summary", "responsibilities",
        "achievements", "proficiency", "portfolio", "linkedin",
        "github", "resume", "curriculum vitae", "gpa",
    ]
    content_lower = resume_content.lower()
    matched = sum(1 for kw in resume_keywords if kw in content_lower)

    if matched < 3:
        resume_content = ""  # reset so a valid resume can be re-uploaded
        raise HTTPException(
            status_code=422,
            detail="The uploaded PDF does not appear to be a resume. Please upload a valid resume PDF."
        )

    return {
        "Status": "resume uploaded successfully"
    }


''' ROLE SELECTION '''

@app.post("/role-select")
def select_role(role:str):
    global role_selection, custom_jd
    role_selection=role
    custom_jd=None          # clear JD so role takes priority
    return{
        "status":"Role added successfully"
    }


''' CUSTOMISABLE JD '''

@app.post("/upload-jd")
def jd_upload(job_description:JobDescription) ->dict :

    global custom_jd, role_selection
    custom_jd=job_description
    role_selection=""        # clear role so JD takes priority
    return{"status":"Custom JD is uploaded successfully"}


''' ANALYZE '''

@app.get("/analyze")
def analyze():
    if not resume_content.strip():
        raise HTTPException(status_code=400, detail="Upload a resume first")
    
    target = get_target()
    return analyze_resume(resume_content=resume_content, **target)


''' ROLES RECCOMANDATION '''

@app.get("/reccomanded-roles")
def other_roles():
    target = get_target()
    role = target.get("role_selection") or (custom_jd.role if custom_jd else "")
    return generate_other_roles(resume_content, role)

''' ROADMAP '''

@app.get("/roadmap")
def roadmap():
    target = get_target()
    analysis = analyze_resume(resume_content=resume_content, **target)
    match_data = json.loads(analysis["match_answer"])
    roadmap = generate_roadmap(match_data["missing_skills"])
    return roadmap






 




    
