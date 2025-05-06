import requests
import json
from django.conf import settings

DEEPSEEK_API_URL = "https://openrouter.ai/api/v1/chat/completions"

def evaluate_with_deepseek(prompt):
    api_key = getattr(settings, 'DEEPSEEK_API_KEY', None)
    if not api_key:
        print("❌ DeepSeek API key not configured in settings.")
        return None

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost",  # or your real frontend URL
        "X-Title": "SmartAssess"
    }


    payload = {
        "model": "nvidia/llama-3.1-nemotron-ultra-253b-v1:free",  # or "deepseek-coder" if needed
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.7
    }

    try:
        response = requests.post(DEEPSEEK_API_URL, headers=headers, json=payload, timeout=20)
        response.raise_for_status()
        data = response.json()

        print("✅ DeepSeek API raw response received.")
        print(json.dumps(data, indent=2))

        # Safe access to message content
        choices = data.get("choices", [])
        if choices and isinstance(choices, list):
            message = choices[0].get("message", {})
            content = message.get("content", "").strip()
            if content:
                return content
            else:
                print("⚠️ No 'content' in response message.")
        else:
            print("⚠️ Invalid or empty 'choices' in response.")

    except requests.exceptions.Timeout:
        print("⏰ DeepSeek API request timed out.")
    except requests.exceptions.RequestException as e:
        print(f"🚨 DeepSeek API error: {e}")
    except json.JSONDecodeError:
        print("🚫 Failed to parse JSON from DeepSeek API.")

    return None
