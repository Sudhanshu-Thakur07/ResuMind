from pydantic import BaseModel


class ResumeContent(BaseModel):
    role: str
    experience: list[str]
    education: str
    skills: list[str]
    projects: list[str]
    achievements: list[str]
    languages: list[str]


class JobDescription(BaseModel):
    role: str
    experience: str
    education: str
    responsibilities: list[str]
    required_skills: list[str]
    preferred_skills: list[str]


class MatchResponse(BaseModel):
    match_percent: int
    missing_skills: list[str]
    short_analysis: str


class OtherRoles(BaseModel):
    roles: list[str]


class RoadmapResponse(BaseModel):
    missing_skills: list[str]
    learning_path: list[str]
    study_resources: list[str]
    recommended_projects: list[str]
    roadmap: list[str]



def json_response_format(name, schema):
    return {
        "type": "json_schema",
        "json_schema": {
            "name": name,
            "schema": schema
        }
    }


resume_response_format = json_response_format(
    "ResumeContent",
    ResumeContent.model_json_schema()
)

jd_response_format = json_response_format(
    "JobDescription",
    JobDescription.model_json_schema()
)

match_response_format = json_response_format(
    "MatchResponse",
    MatchResponse.model_json_schema()
)

other_roles_response_format = json_response_format(
    "OtherRoles",
    OtherRoles.model_json_schema()
)

roadmap_response_format = {
    "type": "json_object"
}

