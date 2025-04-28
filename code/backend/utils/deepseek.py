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