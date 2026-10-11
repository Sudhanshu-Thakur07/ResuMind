import os
from pathlib import Path
from dotenv import load_dotenv
from groq import Groq
from qdrant_client import QdrantClient
from fastembed import TextEmbedding

# Load .env from project root (one level above this backend/ folder)
load_dotenv(dotenv_path=Path(__file__).parent.parent / ".env")

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
QDRANT_URL = os.getenv("QDRANT_URL")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")

if not (GROQ_API_KEY and QDRANT_URL and QDRANT_API_KEY):
    raise ValueError(".env content is missing")

llm_model = "qwen/qwen3.8-27b"

embeddings_model = TextEmbedding(
    model_name="BAAI/bge-small-en-v1.5"
)

groq_client = Groq(api_key=GROQ_API_KEY)

qdrant_client = QdrantClient(
    url=QDRANT_URL,
    api_key=QDRANT_API_KEY,
    timeout=60
)

COLLECTION_NAME = "roles_knowledge"
EMBEDDING_SIZE = 384



















