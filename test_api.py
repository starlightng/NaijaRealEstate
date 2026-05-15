import urllib.request, json
req = urllib.request.urlopen('http://localhost:8000/properties/')
data = json.loads(req.read().decode('utf-8'))
print(f'Total: {data.get(''total'')}, Items length: {len(data.get(''items'', []))}')
