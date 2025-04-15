import os
import json
import uuid
from datetime import datetime
from typing import List, Dict
from pydantic import BaseModel
from dotenv import load_dotenv
from fastapi import FastAPI, Query
from fastapi.responses import StreamingResponse
from openai import OpenAI
from sqlalchemy import create_engine, Column, String, DateTime, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from .utils.prompt import (
    ClientMessage,
    convert_to_openai_messages,
    construct_chat_history,
    construct_few_shot_prompt,
    construct_answer_prompt,
)
from .utils.rag import get_similar_documents
from rapidfuzz import process
import re
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.pool import QueuePool

load_dotenv(".env")

app = FastAPI()

client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

# Database setup
DATABASE_URL = os.environ.get("DATABASE_URL")


engine = create_engine(
    DATABASE_URL,
    pool_size=5,
    max_overflow=10,
    pool_timeout=30,
    pool_pre_ping=True,
    pool_recycle=3600,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://dh-choi.com", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Define SQLAlchemy model for messages
class AssistantMessage(Base):
    __tablename__ = "message"
    id = Column(String, primary_key=True, index=True)
    content = Column(JSON, nullable=False)
    createdAt = Column(DateTime(3), nullable=False, name="createdAt")
    chatId = Column(String, nullable=False, name="chatId")
    role = Column(String, nullable=False, name="role")
    references = Column(JSON, nullable=True, name="references")


# Create tables
Base.metadata.create_all(bind=engine)


class GenerateTitleRequest(BaseModel):
    message: str


class Request(BaseModel):
    id: str
    messages: List[ClientMessage]


def save_chat(
    chat_id: str,
    message: str,
    references: List[Dict[str, str]] = None,
):
    session = SessionLocal()
    try:
        message_id = str(uuid.uuid4())
        session.add(
            AssistantMessage(
                id=message_id,
                chatId=chat_id,
                role="assistant",
                content=message,
                createdAt=datetime.utcnow(),
                references=references,
            )
        )
        session.commit()

    finally:
        session.close()


def add_references(text: str, references: List[Dict[str, str]]):
    # Create a mapping of paragraph_id to URL for quick lookup
    paragraph_id_to_url = {ref["paragraph_id"]: ref["url"] for ref in references}
    paragraph_ids = list(paragraph_id_to_url.keys())

    # Compile the regex pattern with re.DOTALL to match newlines
    pattern = re.compile(r"\[.*?\]")

    # Define a function to process each match
    def replace_match(match):
        potential_ref = match.group(0)  # The full matched text, including brackets
        content = potential_ref.strip("[]")  # Remove brackets

        # Split the content by semicolons to handle multiple references
        refs = [ref.strip() for ref in content.split(";")]
        new_refs = []

        for ref in refs:
            # Use fuzzy matching to find the closest paragraph_id
            match_data = process.extractOne(ref, paragraph_ids)
            if match_data:
                best_match, score = match_data[:2]
                if score >= 80:  # Adjust the threshold as needed
                    url = paragraph_id_to_url[best_match]
                    # Replace with hyperlink
                    new_refs.append(f"<a href='{url}'>{best_match}</a>")

                else:
                    # If no good match, keep the original reference
                    new_refs.append(ref)
            else:
                # If no match data, keep the original reference
                new_refs.append(ref)

        # Reconstruct the bracketed reference with updated links
        return f"[{' '.join(new_refs)}]"

    # Use the compiled pattern to replace all references in the text
    new_text = pattern.sub(replace_match, text)

    return new_text


def stream_text(
    messages: List[ClientMessage],
    chat_id: str,
    protocol: str = "text",
    references: List[Dict[str, str]] = None,
):
    try:
        stream = client.chat.completions.create(
            messages=messages,
            model="gpt-4o",
            stream=True,
        )
    except Exception as e:
        save_chat(chat_id, f"{e}", [{"url": "", "paragraph_id": ""}])
        yield f"{e}"

    full_response = ""
    buffer = ""
    buffer_size = 30  # Adjust the buffer size as needed

    if protocol == "text":
        # Regex pattern to detect an incomplete reference at the end of the buffer
        incomplete_ref_pattern = re.compile(r"\[[^\]]*$")

        for chunk in stream:
            for choice in chunk.choices:
                if choice.finish_reason == "stop":
                    # Process any remaining text in the buffer
                    if buffer:
                        if references:
                            text = add_references(buffer, references)
                        else:
                            text = buffer
                        full_response += text
                        yield f"{text}"
                    break
                else:
                    buffer += choice.delta.content

                    # Process the buffer when it reaches the buffer size
                    if len(buffer) >= buffer_size:
                        # Check for incomplete reference at the end of the buffer
                        if incomplete_ref_pattern.search(buffer):
                            # Incomplete reference detected, wait for more data
                            continue
                        else:
                            # No incomplete reference, safe to process the buffer
                            if references:
                                text = add_references(buffer, references)
                            else:
                                text = buffer
                            full_response += text
                            yield f"{text}"
                            buffer = ""

    save_chat(chat_id, full_response, references)


def convert_to_standalone_question(standalone_prompt):
    question = client.chat.completions.create(
        messages=[{"role": "user", "content": standalone_prompt}],
        model="gpt-4o",
    )
    return question.choices[0].message.content


@app.post("/api/chat")
async def handle_chat_data(
    request: Request,
    philosopher_name: str,
    philosopher_id: str,
    protocol: str = Query("text"),
):
    try:
        messages = request.messages
        openai_messages = convert_to_openai_messages(messages)

        standalone_prompt = construct_chat_history(
            openai_messages[:-1], openai_messages[-1]
        )
        standalone_question = convert_to_standalone_question(standalone_prompt)
        if philosopher_id == "hume":
            few_shot_prompt = construct_few_shot_prompt("David Hume")
        else:
            few_shot_prompt = None
        similar_docs = get_similar_documents(standalone_question, philosopher_id)
        references = [
            {"url": doc["url"], "paragraph_id": doc["paragraph_id"]}
            for doc in similar_docs
        ]
        question_prompt = construct_answer_prompt(
            similar_docs, openai_messages, standalone_question, philosopher_name
        )

        question_request = [
            {"role": "user", "content": question_prompt},
        ]
        if few_shot_prompt:
            question_request = few_shot_prompt + question_request
        response = StreamingResponse(
            stream_text(question_request, request.id, protocol, references),
            media_type="text/plain",
        )

        response.headers["x-vercel-ai-data-stream"] = "v1"
        response.headers["x-documents"] = json.dumps(references)
    except Exception as e:
        response = f"{e}"
        response.headers["x-vercel-ai-data-stream"] = "v1"
        response.headers["x-documents"] = json.dumps([])
        return response
    return response


def generate_title_from_user_message(message: str):
    system_prompt = """- you will generate a short title based on the first message a user begins a conversation with
    - ensure it is not more than 80 characters long
    - the title should be a summary of the user's message
    - do not use quotes or colons"""

    title = client.chat.completions.create(
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": message},
        ],
        model="gpt-4o-mini",
    )

    return title.choices[0].message.content


@app.post("/api/chat/generate_title")
async def generate_title(request: GenerateTitleRequest):
    message = request.message
    try:
        title = generate_title_from_user_message(message)
        return {"title": title}
    except Exception as e:
        return {"title": f"{e}"}
