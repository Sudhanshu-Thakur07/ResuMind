from backend.config import (
    qdrant_client,
    embeddings_model,
    COLLECTION_NAME
)


def search(query, top_k=10):

    query_vector = list(
        embeddings_model.embed([query])
    )[0].tolist()

    result = qdrant_client.query_points(
        collection_name=COLLECTION_NAME,
        query=query_vector,
        limit=top_k,
        with_payload=True
    ).points

    return result

def extract_context(points):

    context = []

    for point in points:
        if point.payload and "text" in point.payload:
            context.append(point.payload["text"])

    return "\n\n".join(context)

