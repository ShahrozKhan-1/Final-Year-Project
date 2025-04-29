import requests
import json
from django.conf import settings

DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions"  # Verify this is the correct endpoint

def evaluate_with_deepseek(prompt):
    headers = {
        "Authorization": f"Bearer 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",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": "deepseek-chat",  # Use the appropriate model
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.7,
        "max_tokens": 1000
    }
    
    try:
        response = requests.post(DEEPSEEK_API_URL, headers=headers, json=payload)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"DeepSeek API error: {e}")
        return None