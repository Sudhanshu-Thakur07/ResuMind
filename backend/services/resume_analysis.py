
from backend.schemas import (
    resume_response_format,
    jd_response_format,
    match_response_format
)

from backend.services.llm_service import (
    content_extraction,
    generate_llm_response
)

from backend.services.qdrant_service import (
    search,
    extract_context
)


def analyze_resume(resume_content, role_selection=None, custom_jd=None):

    resume_data = resume_content

    resume_extract = content_extraction(
        resume_data,
        resume_response_format,
        "Resume"
    )

    if role_selection is not None:
        query = (
            f"{role_selection} job responsibilities required skills "
            f"experience education"
        )

        context_points = search(
            query,
            top_k=15
        )

        context_text = extract_context(context_points)

        jd_extract = content_extraction(
            context_text,
            jd_response_format,
            "Job_Description"
        )

    elif custom_jd is not None:
        jd_extract= custom_jd


    match_prompt = f"""
                    You are an expert technical recruiter and resume matching system.

                    Compare the resume with the job description using SEMANTIC understanding, not keyword counting.

                    Evaluate:
                    - Skills and technical knowledge
                    - Experience and responsibilities
                    - Projects
                    - Education
                    - Tools/frameworks
                    - Role-specific requirements

                    RULES:

                    1. Understand the meaning of each JD requirement. Do not mark a skill missing only because its exact keyword is absent.

                    2. Look for actual evidence in the resume. Consider a requirement:
                    - FULL: strong direct evidence
                    - PARTIAL: some evidence, but an important part is missing
                    - INDIRECT: related evidence, but insufficient to confirm the requirement
                    - MISSING: no sufficient evidence

                    3. Do not invent skills, experience, projects, or technologies.

                    4. Related skills are not automatically equivalent.
                    Example: Python ≠ Machine Learning, Docker ≠ Kubernetes.
                    But genuine semantic matches should receive credit.
                    Example: "Built APIs with FastAPI" satisfies REST API development.

                    5. For partial or missing requirements, identify the SPECIFIC capability gap, not just the keyword.
                    Bad: "testing"
                    Good: "No clear evidence of unit or integration testing."

                    6. "MISSING" means there is insufficient evidence in the resume; it does not mean the candidate definitely lacks the skill.

                    7. Calculate match_percent using weighted semantic coverage. Core/required role-specific requirements must have more weight than minor or generic skills.

                    8. If a requirement is PARTIAL, do not put it in missing_skills.

                    Example:
                    JD: "ML model evaluation and cross-validation"
                    Resume: "Built classification models using scikit-learn and evaluated using F1-score."
                    Result: PARTIAL, because model evaluation is demonstrated but cross-validation is not.

                    Return ONLY valid JSON:
                    Do not use Markdown or add extra fields.

                    Resume:
                    {resume_extract}

                    Job Description:
                    {jd_extract}  """

    

    match_answer = generate_llm_response(
        match_prompt,
        match_response_format
    )

    return {
        "resume_extract": resume_extract,
        "jd_extract": jd_extract,
        "match_answer": match_answer
    }




