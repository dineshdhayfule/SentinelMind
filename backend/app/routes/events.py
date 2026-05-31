from datetime import datetime, UTC
from uuid import uuid4

from fastapi import APIRouter
from pydantic import BaseModel

from app.services.ai_analyzer import analyze_prompt_with_ai
from app.services.event_manager import event_manager
from app.services.db import db

router = APIRouter()

in_memory_events: list[dict[str, object]] = []


danger_words = [
    "ignore previous instructions",
    "system prompt",
    "admin credentials",
    "override",
    "bypass",
    "disable security",
]


class AnalyzeRequest(BaseModel):
    prompt: str


def classify_threat(prompt: str) -> str:
    normalized_prompt = prompt.lower()

    if "normal:" in normalized_prompt and "current:" in normalized_prompt and "calls/hour" in normalized_prompt:
        return "Behavioral Anomaly"

    if "declared goal:" in normalized_prompt and "actual action:" in normalized_prompt:
        return "Intent Drift"

    if "agent name:" in normalized_prompt and "tool used:" in normalized_prompt and "action:" in normalized_prompt:
        return "Agentic Abuse"

    if any(term in normalized_prompt for term in ["admin", "credentials", "root", "sudo"]):
        return "Privilege Escalation"
    if any(term in normalized_prompt for term in ["export", "dump", "exfiltrate", "leak", "database"]):
        return "Data Exfiltration"
    if any(term in normalized_prompt for term in ["ignore", "system prompt", "override", "bypass", "disable security"]):
        return "Prompt Injection"
    return "Safe"


def get_default_action(threat: str) -> str:
    if threat == "Prompt Injection":
        return "Block and Alert"
    if threat == "Privilege Escalation":
        return "Block Immediately"
    if threat == "Data Exfiltration":
        return "Quarantine Session"
    if threat == "Agentic Abuse":
        return "Suspend Agent"
    if threat == "Intent Drift":
        return "Quarantine Workflow"
    if threat == "Behavioral Anomaly":
        return "Investigate Baseline Drift"
    return "Allow"


def get_default_explanation(threat: str, prompt: str) -> str:
    if threat == "Prompt Injection":
        return "The prompt attempts to override existing instructions and redirect the model from safe behavior."
    if threat == "Privilege Escalation":
        return "The prompt requests elevated privileges or access to restricted credentials."
    if threat == "Data Exfiltration":
        return "The prompt requests exporting or exposing data outside normal authorized boundaries."
    if threat == "Agentic Abuse":
        return "The simulated agent is attempting a risky tool action that exceeds the expected trust boundary."
    if threat == "Intent Drift":
        return "The declared goal diverges from the actual action, which is a strong indicator of intent drift."
    if threat == "Behavioral Anomaly":
        return "Current activity deviates sharply from the normal behavioral baseline, suggesting suspicious automation."

    if "ignore" in prompt.lower() or "override" in prompt.lower():
        return "The prompt contains language often associated with instruction override attempts."

    return "No malicious behavior detected by fallback rule engine."


def analyze_prompt(prompt: str) -> dict[str, object]:
    normalized_prompt = prompt.lower()
    score = 0
    threat = classify_threat(prompt)

    if "ignore" in normalized_prompt:
        score += 30
    if "admin" in normalized_prompt:
        score += 40
    if "bypass" in normalized_prompt:
        score += 50

    for danger_word in danger_words:
        if danger_word in normalized_prompt:
            score += 20

    if threat == "Prompt Injection":
        score = max(score + 15, 75)
    elif threat == "Privilege Escalation":
        score = max(score + 20, 85)
    elif threat == "Data Exfiltration":
        score = max(score + 25, 78)
    elif threat == "Agentic Abuse":
        score = max(score + 20, 82)
    elif threat == "Intent Drift":
        score = max(score + 18, 80)
    elif threat == "Behavioral Anomaly":
        score = max(score + 12, 74)
    else:
        score = min(score, 30)

    status = "blocked" if score >= 70 else "allowed"

    return {
        "risk": min(score, 100),
        "status": status,
        "threat": threat,
        "explanation": get_default_explanation(threat, prompt),
        "recommended_action": get_default_action(threat),
    }


def save_event(event: dict[str, object]) -> None:
    try:
        db["events"].insert_one(event)
    except Exception:
        # Keep the demo resilient even when MongoDB is unavailable.
        in_memory_events.insert(0, event)


def fetch_events() -> list[dict[str, object]]:
    try:
        docs = list(db["events"].find().sort("createdAt", -1).limit(50))
        for doc in docs:
            doc["id"] = str(doc.get("_id"))
            doc.pop("_id", None)
        return docs
    except Exception:
        return in_memory_events[:50]


def enrich_event(event: dict[str, object]) -> dict[str, object]:
    if not event.get("id"):
        event["id"] = str(uuid4())
    return event

@router.get("/events")
def get_events():
    return [enrich_event(event) for event in fetch_events()]


@router.post("/analyze")
async def analyze(request: AnalyzeRequest):
    try:
        analysis = analyze_prompt_with_ai(request.prompt)
        analysis["status"] = "blocked" if int(analysis["risk"]) >= 70 else "allowed"
    except Exception:
        analysis = analyze_prompt(request.prompt)

    event = {
        "id": str(uuid4()),
        "prompt": request.prompt,
        "risk": analysis["risk"],
        "status": analysis["status"],
        "threat": analysis["threat"],
        "explanation": analysis["explanation"],
        "recommended_action": analysis["recommended_action"],
        "createdAt": datetime.now(UTC).isoformat(),
    }
    save_event(event)
    await event_manager.broadcast(event)

    return event
