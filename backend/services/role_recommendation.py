import json

from schemas import other_roles_response_format

from services.llm_service import generate_llm_response
from services.qdrant_service import search, extract_context


def generate_other_roles(resume_extract, current_role):

    query = f"""
            Find job roles related to this candidate's skills,
            experience, projects, education and technical background.

            Candidate:
            {resume_extract}
            """

    context_points = search(
        query,
        top_k=15
    )

    context_text = extract_context(context_points)

    prompt = f"""
                You are a professional career-role matching system.

                Identify other job roles that this candidate can reasonably apply for.

                CANDIDATE RESUME:
                {resume_extract}

                AVAILABLE RELATED ROLES:
                {context_text}

                CURRENT ROLE:
                {current_role}

                RULES:

                1. Return only roles supported by the resume.
                2. Do not invent roles.
                3. Do not recommend a role based on one keyword.
                4. Consider skills, projects, experience and education.
                5. Do not return the current role.
                6. Do not return duplicate roles.
                7. Return only actual job titles.
                8. Return ONLY JSON according to the provided schema.
                
                """

    answer = generate_llm_response(
        prompt,
        other_roles_response_format
    )

    return json.loads(answer)

