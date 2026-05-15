
import requests
import json

# Configuration
API_URL = "http://localhost:8000"
ENDPOINT = f"{API_URL}/properties/"

def check_approved_listings():
    print(f"Checking approved listings at {ENDPOINT}...\n")
    try:
        response = requests.get(ENDPOINT)
        response.raise_for_status()
        data = response.json()

        # The API returns a dict with an 'items' list
        items = data.get('items', [])

        if not items:
            print("❌ No approved properties found in the API response.")
            print("This means either: \n1. No properties are set to 'approved' status\n2. Properties are marked as deleted\n3. The database is empty")
            return

        print(f"✅ Found {len(items)} approved properties:\n")
        for i, prop in enumerate(items, 1):
            print(f"{i}. {prop.get('title')} (ID: {prop.get('id')})")
            print(f"   - Status: Approved")
            print(f"   - City: {prop.get('city')}, State: {prop.get('state')}")
            print(f"   - Price: ₦{prop.get('price')}")
            print(f"   - Images: {len(prop.get('images', []))} images found")
            for img in prop.get('images', []):
                print(f"     - Image URL: {img.get('url')}")
            print("-" * 40)

    except requests.exceptions.ConnectionError:
        print("❌ Error: Could not connect to the backend. Is the Docker container running?")
    except Exception as e:
        print(f"❌ An unexpected error occurred: {e}")

if __name__ == "__main__":
    check_approved_listings()
