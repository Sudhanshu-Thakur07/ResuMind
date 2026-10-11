from dotenv import load_dotenv
from qdrant_client import QdrantClient
from qdrant_client.models import Distance,VectorParams,PointStruct
import json
import os
import time
from pathlib import Path
from fastembed import TextEmbedding

# Load .env from project root (one level above this backend/ folder)
load_dotenv(dotenv_path=Path(__file__).parent.parent / ".env")

# credentials and setup 

QDRANT_URL = os.getenv("QDRANT_URL")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")

if not (QDRANT_URL or QDRANT_API_KEY ):
    raise ValueError(".env content is missing")


# required models

embeddings_model = TextEmbedding(
    model_name="BAAI/bge-small-en-v1.5"
)

# client setup 

qdrant_client = QdrantClient(
            url= QDRANT_URL,
            api_key= QDRANT_API_KEY,
            timeout=60,
)

# Preflight connectivity check with retries
MAX_RETRIES = 3
for attempt in range(1, MAX_RETRIES + 1):
    try:
        qdrant_client.get_collections()  
        print("Connected to Qdrant successfully.")
        break
    except Exception as conn_err:
        if attempt == MAX_RETRIES:
            print(f"\n[ERROR] Could not connect to Qdrant after {MAX_RETRIES} attempts.")
            print(f"Reason: {conn_err}")
            print("\nTroubleshooting tips:")
            print("  1. Your Qdrant Cloud cluster may be PAUSED. Visit https://cloud.qdrant.io and resume it.")
            print("  2. Verify QDRANT_URL and QDRANT_API_KEY in your .env file are correct and not expired.")
            print("  3. Check your internet connection / firewall settings.")
        print(f"  Attempt {attempt} failed: {conn_err}. Retrying in 5 seconds...")
        time.sleep(5)




########## "job_roles_knowledge"

COLLECTION_NAME = "roles_knowledge"
EMBEDDING_SIZE = 384

    ##########
def create_db():
    # Deleting previous collection

    if qdrant_client.collection_exists(COLLECTION_NAME):
        print(f"Deleting Collection: {COLLECTION_NAME}")
        qdrant_client.delete_collection(COLLECTION_NAME)

    # Creating collection

    qdrant_client.create_collection(
        collection_name=COLLECTION_NAME,
        vectors_config=VectorParams(
            size=EMBEDDING_SIZE,
            distance=Distance.COSINE,
        ),
    )

    print(f"Data collection named {COLLECTION_NAME} created successfully!!")


    # Data Source

    roles_path = Path(__file__).parent.parent / "data" / "roles_data"
    index = 1
    points = []

    for roles_details in roles_path.iterdir():

        if roles_details.is_file() and roles_details.suffix.lower() == ".json":

            with open(roles_details, "r", encoding="utf-8") as fh:
                documents = json.load(fh)

            for role_name, role_data in documents.items():

                # Role information
                role = role_data.get("role", {})
                text = f"""Role: {role_name}
                        Title: {role.get("title", "")}
                        Level: {role.get("level", "")}
                        Focus: {role.get("focus", "")}
                        Objective: {role.get("objective", "")}
                        """
                
                points.append(
                    PointStruct(
                        id=index,
                        vector=list(embeddings_model.embed([text]))[0].tolist(),
                        payload={
                            "role": role_name,
                            "category": "role",
                            "source": roles_details.name,
                            "text": text.strip()
                        }
                    )
                )
                index += 1

                # Responsibilities
                for number, responsibility in role_data.get("responsibilities", {}).items():

                    text = f""" Role: {role_name}
                                Responsibility: {responsibility}"""

                    points.append(
                        PointStruct(
                            id=index,
                            vector=list(embeddings_model.embed([text]))[0].tolist(),
                            payload={
                                "role": role_name,
                                "category": "responsibility",
                                "number": number,
                                "source": roles_details.name,
                                "text": text.strip()
                            }
                        )
                    )
                    index += 1

                # Required skills
                for category, skills in role_data.get("required_skills", {}).items():

                    text = f"""
                                Role: {role_name}
                                Skill Category: {category}
                                Skills: {", ".join(skills)}
                                """

                    points.append(
                        PointStruct(
                            id=index,
                            vector=list(embeddings_model.embed([text]))[0].tolist(),
                            payload={
                                "role": role_name,
                                "category": "required_skill",
                                "skill_category": category,
                                "source": roles_details.name,
                                "text": text.strip()
                            }
                        )
                    )
                    index += 1

                # Preferred skills
                skills = role_data.get("preferred_skills", [])

                if skills:
                    text = f"""
                                Role: {role_name}
                                Preferred Skills: {", ".join(skills)}
                                """

                    points.append(
                        PointStruct(
                            id=index,
                            vector=list(embeddings_model.embed([text]))[0].tolist(),
                            payload={
                                "role": role_name,
                                "category": "preferred_skill",
                                "source": roles_details.name,
                                "text": text.strip()
                            }
                        )
                    )
                    index += 1

                # Qualifications
                qualifications = role_data.get("qualifications", {})

                if qualifications:
                    text = f"""
                                Role: {role_name}
                                Education: {qualifications.get("education", "")}
                                Experience: {qualifications.get("experience", "")}
                                Portfolio: {qualifications.get("portfolio", "")}
                                """

                    points.append(
                        PointStruct(
                            id=index,
                            vector=list(embeddings_model.embed([text]))[0].tolist(),
                            payload={
                                "role": role_name,
                                "category": "qualification",
                                "source": roles_details.name,
                                "text": text.strip()
                            }
                        )
                    )
                    index += 1


                # Projects
                for number, project in role_data.get("projects", {}).items():

                    text = f"""
                                Role: {role_name}
                                Project: {project.get("name", "")}
                                Description: {project.get("description", "")}
                                Strong Features: {", ".join(project.get("strong_features", []))}
                                Stack: {", ".join(project.get("stack", []))}
                                """

                    points.append(
                        PointStruct(
                            id=index,
                            vector=list(embeddings_model.embed([text]))[0].tolist(),
                            payload={
                                "role": role_name,
                                "category": "project",
                                "project_number": number,
                                "project_name": project.get("name", ""),
                                "source": roles_details.name,
                                "text": text.strip()
                            }
                        )
                    )
                    index += 1

                # Study resources
                for resource_name, resource in role_data.get("study_resources", {}).items():

                    text = f"""
                                Role: {role_name}
                                Resource: {resource_name}
                                Description: {resource.get("resource", "")}
                                URL: {resource.get("url", "")}
                                """

                    points.append(
                        PointStruct(
                            id=index,
                            vector=list(embeddings_model.embed([text]))[0].tolist(),
                            payload={
                                "role": role_name,
                                "category": "study_resource",
                                "resource_name": resource_name,
                                "url": resource.get("url", ""),
                                "source": roles_details.name,
                                "text": text.strip()
                            }
                        )
                    )
                    index += 1


    # Upload everything to Qdrant

    qdrant_client.upsert(
        collection_name=COLLECTION_NAME,
        points=points
    )

    return(f"{len(points)} chunks stored successfully in Qdrant!!")















