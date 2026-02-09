import requests
import json

url = "https://api.printables.com/graphql/"
headers = {
    "Content-Type": "application/json"
}
data = {
    "query": "query GetPopularModels($offset: Int!) { prints(limit: 100, offset: $offset) { id name summary slug likesCount downloadsCount license { name url } images { filePath } user { publicUsername } stlFiles { url } } }",
    "variables": {
        "offset": 0
    }
}

response = requests.post(url, headers=headers, json=data)

print(response.status_code)
print(response.text)
