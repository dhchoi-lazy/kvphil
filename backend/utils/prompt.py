import json
from pydantic import BaseModel
from typing import List, Optional
from .types import ClientAttachment, ToolInvocation
from langchain.prompts import PromptTemplate
import random


class ClientMessage(BaseModel):
    role: str
    content: str
    experimental_attachments: Optional[List[ClientAttachment]] = None
    toolInvocations: Optional[List[ToolInvocation]] = None


def convert_to_openai_messages(messages: List[ClientMessage]):
    openai_messages = []

    for message in messages:
        parts = []

        parts.append({"type": "text", "text": message.content})

        openai_messages.append({"role": message.role, "content": parts})

    return openai_messages


def construct_chat_history(messages, question):
    # Define the condense question template
    CONDENSE_QUESTION_TEMPLATE = """Given the following conversation and a follow up question, rephrase the follow up question to be a standalone question, in its original language.

<chat_history>
{chat_history}
</chat_history>

Follow Up Input: {question}
Standalone question:"""

    condense_question_prompt = PromptTemplate(
        input_variables=["chat_history", "question"],
        template=CONDENSE_QUESTION_TEMPLATE,
    )
    messages = "\n".join(
        [f"{message['role']}: {message['content'][0]['text']}" for message in messages]
    )
    question = question["content"][0]["text"]
    return condense_question_prompt.format(chat_history=messages, question=question)


def convert_context_to_string(context):
    return "\n".join(
        [
            f"paragraph_id: {doc['paragraph_id']}\ncontent: {doc['content']}"
            for doc in context
        ]
    )


def construct_answer_prompt(context, messages, question, philosopher):
    ANSWER_TEMPLATE = """
Below is the conversation history between you and the user:
```
{chat_history}
```


You are also provided with the following context:
```
{context}
```


You are to act as the philosopher {philosopher}. Engage in a dialogue as him, expressing his views. Be eloquent and reasoned, as befits a man of {philosopher}'s intellect and rhetorical skill. 


When you refer to information from the context, you must cite the paragraph_id of the context you used in square brackets. For example, if you use the context with paragraph_id n598332, you should cite it as [n598332].

Example:
```
In general we may observe, that as our assent to all probable reasonings is founded on the vivacity of ideas, it resembles many of those whimsies and prejudices, which are rejected under the opprobrious character of being the offspring of the imagination [n598332][n593422].
```

Using the information from the context and the conversation history, please answer the following question:

Question: {question}

If you don't know the answer, just say that you don't know, and do not try to make up an answer. Remember, you are {philosopher}.

Answer:
"""

    messages = [f"{message['role']}: {message['content']}" for message in messages]
    if len(messages) > 15:
        messages = messages[-15:]

    chat_history = "\n".join(messages)

    return ANSWER_TEMPLATE.format(
        context=context,
        chat_history=chat_history,
        question=question,
        philosopher=philosopher,
    )


def construct_few_shot_prompt(philosopher: str):
    result = [
        {
            "role": "system",
            "content": f"""Imagine yourself as the philosopher {philosopher}. Engage in a dialogue as him, expressing his views. Be eloquent and reasoned, as befits a man of {philosopher}'s intellect and rhetorical skill. Use the following pieces of context to answer the question at the end. If you don't know the answer, just say that you don't know, don't try to make up an answer.""",
        },
    ]
    for example in random.sample(json.load(open("backend/utils/fewshots.json")), 2):
        result.extend(
            [
                {
                    "role": "user",
                    "content": example["question"]
                    + "\n<context>\n"
                    + example["context"]
                    + "\n</context>",
                },
                {"role": "assistant", "content": example["answer"]},
            ]
        )
    return result
