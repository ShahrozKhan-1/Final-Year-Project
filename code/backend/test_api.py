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
