import urllib.request
import json

def test_properties():
    try:
        url = "http://localhost:8000/properties/"
        print(f"Fetching from {url}...")
        with urllib.request.urlopen(url) as response:
            status = response.getcode()
            body = response.read().decode('utf-8')
            print(f"Status: {status}")
            data = json.loads(body)
            # PaginatedResponse has 'data' and 'meta'
            items = data.get('data', [])
            meta = data.get('meta', {})
            total = meta.get('total', 0)
            print(f"Total in meta: {total}")
            print(f"Items count in data: {len(items)}")
            for idx, item in enumerate(items):
                print(f"[{idx}] ID: {item.get('id')}, Title: {item.get('title')}, Status: {item.get('status')}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_properties()
