import requests
import json

response = requests.get(
  url="https://openrouter.ai/api/v1/auth/key",
  headers={
    "Authorization": f"Bearer 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"
  }
)

print(json.dumps(response.json(), indent=2))
