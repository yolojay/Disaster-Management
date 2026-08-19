"""
IBM Watsonx.ai client — fetches IAM bearer token and calls the generation API.
"""

import requests
import time
import logging
from typing import List, Optional
from config import IBM_API_KEY, IBM_PROJECT_ID, GENERATION_API_URL, IAM_TOKEN_URL, IBM_MODEL_ID

logger = logging.getLogger(__name__)

_token_cache: dict = {"token": None, "expires_at": 0}


class WatsonxError(Exception):
    """Raised when IBM IAM or generation API returns an actionable error."""
    pass


def _get_iam_token() -> str:
    """Retrieve (or reuse cached) IBM IAM bearer token."""
    now = time.time()
    if _token_cache["token"] and now < _token_cache["expires_at"] - 60:
        return _token_cache["token"]

    try:
        resp = requests.post(
            IAM_TOKEN_URL,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            data={
                "grant_type": "urn:ibm:params:oauth:grant-type:apikey",
                "apikey": IBM_API_KEY,
            },
            timeout=30,
        )
    except requests.exceptions.ConnectionError as exc:
        raise WatsonxError("Cannot reach IBM IAM — check your internet connection.") from exc
    except requests.exceptions.Timeout:
        raise WatsonxError("IBM IAM request timed out after 30 s.")

    if resp.status_code != 200:
        body = resp.json() if resp.content else {}
        code = body.get("errorCode", "")
        msg  = body.get("errorMessage", resp.text[:300])
        if "disabled" in msg.lower() or "BXNIM0462E" in code:
            raise WatsonxError(
                "IBM API key is disabled or expired. "
                "Please generate a new key at https://cloud.ibm.com/iam/apikeys "
                f"and update IBM_API_KEY in config.py. (IBM: {msg})"
            )
        raise WatsonxError(f"IBM IAM error {resp.status_code}: {msg}")

    data = resp.json()
    _token_cache["token"] = data["access_token"]
    _token_cache["expires_at"] = now + int(data.get("expires_in", 3600))
    return _token_cache["token"]


def generate(
    prompt: str,
    max_new_tokens: int = 900,
    stop_sequences: Optional[List[str]] = None,
) -> str:
    """
    Call IBM Watsonx.ai text generation endpoint.
    Returns the generated text string.
    Raises WatsonxError with a clear message on failure.

    NOTE: temperature is intentionally omitted — IBM rejects it when
    decoding_method is 'greedy'. Use 'sample' + temperature if needed.
    """
    token = _get_iam_token()

    payload: dict = {
        "model_id": IBM_MODEL_ID,
        "project_id": IBM_PROJECT_ID,
        "input": prompt,
        "parameters": {
            "decoding_method": "greedy",
            "max_new_tokens": max_new_tokens,
            "repetition_penalty": 1.05,
        },
    }
    if stop_sequences:
        payload["parameters"]["stop_sequences"] = stop_sequences

    try:
        resp = requests.post(
            GENERATION_API_URL,
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
            json=payload,
            timeout=60,
        )
    except requests.exceptions.ConnectionError as exc:
        raise WatsonxError("Cannot reach IBM Watsonx.ai — check your internet connection.") from exc
    except requests.exceptions.Timeout:
        raise WatsonxError("IBM Watsonx.ai generation request timed out after 60 s.")

    if resp.status_code != 200:
        body = resp.json() if resp.content else {}
        errors = body.get("errors", [{}])
        msg = errors[0].get("message", resp.text[:300]) if errors else resp.text[:300]
        raise WatsonxError(f"Watsonx.ai generation error {resp.status_code}: {msg}")

    results = resp.json().get("results", [{}])
    return results[0].get("generated_text", "").strip()
