import requests
import json

response = requests.get(
  url="https://openrouter.ai/api/v1/auth/key",
  headers={
    "Authorization": f"Bearer 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"
  }
)

print(json.dumps(response.json(), indent=2))
