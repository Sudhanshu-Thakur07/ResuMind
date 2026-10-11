import json

from backend.schemas import roadmap_response_format

from backend.services.llm_service import generate_llm_response
from backend.services.qdrant_service import search, extract_context


def generate_roadmap(missing_skills):

    missing_skills_text = ", ".join(missing_skills)

    roadmap_points = []

    query = f"""
    Find study resources, learning material, practical projects
    and useful resources for these missing skills:

    {missing_skills_text}
    """

    roadmap_points = search(
        query,
        top_k=15
            )

    roadmap_points.extend(roadmap_points)

    roadmap_context = extract_context(roadmap_points)

    roadmap_prompt = f"""
                        Create a career learning roadmap.

                        Missing skills:
                        {missing_skills_text}

                        Knowledge base:
                        {roadmap_context}

                        Return valid JSON only.

                        The response must contain exactly these keys:

                        learning_path
                        study_resources
                        recommended_projects
                        roadmap

                        All four values must be arrays of strings.

                        Do not return Markdown.
                        Do not return explanations outside JSON.
                        Do not add additional keys.
                        Use only information from the knowledge base.
                        """

    answer = generate_llm_response(
        roadmap_prompt,
        roadmap_response_format
    )

    return json.loads(answer)



