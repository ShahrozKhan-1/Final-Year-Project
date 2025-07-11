import requests
import json
import logging
from django.conf import settings

AI_Model_API_URL = "https://openrouter.ai/api/v1/chat/completions"
DEFAULT_MODEL = "mistralai/mistral-small-3.2-24b-instruct:free"

logger = logging.getLogger(__name__)

def evaluate_with_AI(prompt, model=DEFAULT_MODEL, temperature=0.7, timeout=10):
    """
    Sends a prompt to the AI API and returns the model's response.

    Args:
        prompt (str): User prompt to send to the AI.
        model (str): The model identifier to use.
        temperature (float): Creativity level of the model output.
        timeout (int): Timeout for the request in seconds.

    Returns:
        str or None: The AI-generated response or None on failure.
    """
    api_key = getattr(settings, 'MODEL_API_KEY', None)
    if not api_key:
        logger.error("API key not configured in Django settings.")
        return None

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost",
    }

    payload = {
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": temperature,
    }

    print(f"sending prompt to AI API: {payload}")  # Debugging line to see the full payload
    try:
        response = requests.post(AI_Model_API_URL, headers=headers, json=payload, timeout=timeout)
        response.raise_for_status()

        if not response.text.strip():
            logger.error("Empty response from AI API.")
            return None

        try:
            data = response.json()
            print(f"AI API response: {data}")  # Debugging line to see the full response
        except json.JSONDecodeError as e:
            logger.error(f"JSON decode error: {e} — Response was: {repr(response.text)}")
            return None

        content = (
            data.get("choices", [{}])[0]
                .get("message", {})
                .get("content", "")
                .strip()
        )

        if content:
            return content
        else:
            logger.warning("No 'content' in AI response.")
            return None


    except requests.Timeout:
        logger.warning("AI API request timed out.")
    except requests.HTTPError as http_err:
        logger.error(f"HTTP error: {http_err.response.status_code} - {http_err.response.text}")
    except requests.RequestException as e:
        logger.error(f"Request error: {e}")
    except json.JSONDecodeError:
        logger.error("Failed to decode JSON from AI API.")

    return None
