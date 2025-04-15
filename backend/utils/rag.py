import os
import openai
import psycopg2 as pg2
from dotenv import load_dotenv

load_dotenv(".env")

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
DB_URL = os.getenv("DATABASE_URL")

client = openai.OpenAI(api_key=OPENAI_API_KEY)


def generate_embedding(query):
    response = client.embeddings.create(input=query, model="text-embedding-3-large")
    return response.data[0].embedding


def format_array(arr):
    return "[" + ",".join(str(x) for x in arr) + "]"


def find_similar_documents(query, philosopher_id, top_k=5, min_similarity=0.3):

    query_embedding = generate_embedding(query)
    embedding_string = format_array(query_embedding)

    with pg2.connect(DB_URL) as conn:
        with conn.cursor() as cur:
            # Fetch matching results from the database
            cur.execute(
                """
                SELECT 
                    id,
                    paragraph_id,
                    url,
                    paragraph,
                    (embedding <=> %s) AS distance
                FROM sources
                WHERE embedding IS NOT NULL
                    AND philosopher_id = %s
                    OR paragraph ILIKE %s
                ORDER BY distance
                LIMIT %s
                """,
                (embedding_string, philosopher_id, f"%{query}%", top_k),
            )
            results = cur.fetchall()

    results_as_dicts = [
        {
            "id": id,
            "paragraph_id": paragraph_id,
            "url": url,
            "paragraph": paragraph,
            "distance": distance,
        }
        for id, paragraph_id, url, paragraph, distance in results
    ]

    filtered_results = [
        result for result in results_as_dicts if result["distance"] >= min_similarity
    ]

    if filtered_results:
        return filtered_results

    return (
        max(results_as_dicts, key=lambda x: x["distance"], default=None)
        if results_as_dicts
        else []
    )


def get_similar_documents(query, philosopher_id, top_k=5, min_similarity=0.3):
    similar_docs = find_similar_documents(
        query, philosopher_id, top_k=top_k, min_similarity=min_similarity
    )

    return similar_docs
