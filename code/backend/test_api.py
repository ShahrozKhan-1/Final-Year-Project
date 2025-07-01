import requests
import json

headers = {
    "Authorization": "Bearer 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",
    "Content-Type": "application/json",
    "HTTP-Referer": "http://localhost"
}

payload = {
    "model": "mistralai/mistral-small-3.2-24b-instruct:free",
    "messages": [
        {
            "role": "user",
            "content": "You are an expert exam question generator. Generate 2 easy MCQs about OOP in JSON format."
        }
    ],
    "temperature": 0.7
}

response = requests.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=payload)
print(response.status_code)
print(response.text)
