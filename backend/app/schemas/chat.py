from pydantic import BaseModel
from typing import Any, Dict, List, Optional

class ChatRequest(BaseModel):
    user_message: str

class Message(BaseModel):
    role: str
    content: str = "Respuesta generada por el modelo."
    refusal: Optional[str] = None
    annotations: Optional[list] = []

class Choice(BaseModel):
    index: int
    message: Message
    logprobs: Optional[dict] = None
    finish_reason: str

class PromptTokensDetails(BaseModel):
    cached_tokens: int
    audio_tokens: int

class CompletionTokensDetails(BaseModel):
    reasoning_tokens: int
    audio_tokens: int
    accepted_prediction_tokens: int
    rejected_prediction_tokens: int

class Usage(BaseModel):
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int
    prompt_tokens_details: PromptTokensDetails
    completion_tokens_details: CompletionTokensDetails

class GPTResponse(BaseModel):
    id: str
    object: str
    created: int
    model: str
    choices: List[Choice]
    usage: Usage
    service_tier: str
    system_fingerprint: str

class ChatResponse(BaseModel):
    prompt: str
    response: GPTResponse
    emocion_pet: str