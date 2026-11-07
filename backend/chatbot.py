import os
import json
import logging
from typing import Dict, Any, List, Optional
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from sqlalchemy import text

from google import genai
from google.genai import types
from google.genai.errors import APIError
from tenacity import retry, retry_if_exception, stop_after_attempt, wait_exponential_jitter

# Load environment variables FIRST before initializing Gemini
load_dotenv()

logger = logging.getLogger("ridefleet.chatbot")

# Initialize Gemini Client
api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key) if api_key else genai.Client()

PRIMARY_MODEL = "gemini-2.5-flash"
FALLBACK_MODEL = "gemini-1.5-flash"


def is_transient_error(exception: Exception) -> bool:
    """Only retry 503 (Unavailable) or 429 (Rate Limit). Fail fast on 400/404/401."""
    if isinstance(exception, APIError):
        return exception.code in (503, 429)
    return False


@retry(
    stop=stop_after_attempt(2),
    wait=wait_exponential_jitter(initial=1, max=3),
    retry=retry_if_exception(is_transient_error),
    reraise=True
)
def _call_gemini_model(model: str, prompt: str, config: types.GenerateContentConfig) -> str:
    response = client.models.generate_content(
        model=model,
        contents=prompt,
        config=config
    )
    return response.text or ""


def execute_gemini_call(
    prompt: str,
    system_instruction: Optional[str] = None,
    json_output: bool = False
) -> str:
    config = types.GenerateContentConfig(
        system_instruction=system_instruction,
        temperature=0.2,
        response_mime_type="application/json" if json_output else "text/plain"
    )

    for model in [PRIMARY_MODEL, FALLBACK_MODEL]:
        try:
            return _call_gemini_model(model, prompt, config)
        except APIError as e:
            if e.code in (503, 429):
                logger.warning(f"Model {model} rate limited/overloaded. Retrying fallback...")
                continue
            raise e
        except Exception as ex:
            logger.error(f"Error calling {model}: {ex}")
            continue

    raise RuntimeError("Gemini service unavailable.")


def extract_search_filters(user_message: str) -> Dict[str, Any]:
    system_prompt = (
        "Extract vehicle search criteria from user messages into JSON. "
        "Allowed keys: vehicle_type, max_price, fuel_type, transmission, min_seats, location."
    )
    try:
        raw_json = execute_gemini_call(
            prompt=user_message,
            system_instruction=system_prompt,
            json_output=True
        )
        return json.loads(raw_json)
    except Exception as e:
        logger.error(f"Filter extraction failed: {e}")
        return {}


def query_vehicles(db: Session, filters: Dict[str, Any]) -> List[Dict[str, Any]]:
    query_str = (
        "SELECT id, brand, model, vehicle_type, price_per_day, fuel_type, "
        "transmission, seats, location, image_url "
        "FROM vehicles WHERE 1=1"
    )
    params: Dict[str, Any] = {}

    if filters.get("vehicle_type"):
        query_str += " AND LOWER(vehicle_type) = LOWER(:vehicle_type)"
        params["vehicle_type"] = filters["vehicle_type"]

    if filters.get("max_price"):
        query_str += " AND price_per_day <= :max_price"
        params["max_price"] = float(filters["max_price"])

    if filters.get("fuel_type"):
        query_str += " AND LOWER(fuel_type) = LOWER(:fuel_type)"
        params["fuel_type"] = filters["fuel_type"]

    if filters.get("transmission"):
        query_str += " AND LOWER(transmission) = LOWER(:transmission)"
        params["transmission"] = filters["transmission"]

    if filters.get("min_seats"):
        query_str += " AND seats >= :min_seats"
        params["min_seats"] = int(filters["min_seats"])

    if filters.get("location"):
        query_str += " AND LOWER(location) LIKE LOWER(:location)"
        params["location"] = f"%{filters['location']}%"

    query_str += " ORDER BY price_per_day ASC LIMIT 6"

    result = db.execute(text(query_str), params)
    rows = result.mappings().all()

    return [
        {
            "id": r["id"],
            "name": f"{r['brand']} {r['model']}",
            "type": r["vehicle_type"],
            "pricePerDay": float(r["price_per_day"]),
            "fuel": r["fuel_type"],
            "transmission": r["transmission"],
            "seats": r["seats"],
            "location": r["location"],
            "imageUrl": r.get("image_url") or ""
        }
        for r in rows
    ]


def chatbot_reply(user_message: str, db: Session) -> Dict[str, Any]:
    filters = extract_search_filters(user_message)
    vehicles = query_vehicles(db, filters)

    if not vehicles:
        reply = "I couldn't find any available vehicles matching your criteria. Try expanding your budget or changing locations!"
    else:
        summary_prompt = (
            f"User query: '{user_message}'. Matching fleet: {json.dumps(vehicles)}. "
            "Provide a friendly, concise 1-2 sentence recommendation."
        )
        try:
            reply = execute_gemini_call(prompt=summary_prompt)
        except Exception:
            reply = f"Here are {len(vehicles)} matching available vehicles for your trip:"

    return {
        "reply": reply,
        "vehicles": vehicles
    }