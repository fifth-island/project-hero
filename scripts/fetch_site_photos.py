"""Download openly-licensed site photos from Wikimedia Commons using curl."""
import json, urllib.request, urllib.parse, os, subprocess, time

PHOTO_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'figures', 'site_photos')
os.makedirs(PHOTO_DIR, exist_ok=True)

SEARCHES = {
    "berkley":      ["Berkeley Community Garden South End Boston"],
    "castle":       ["Castle Square Boston Chinatown"],
    "chin":         ["Chinatown park Boston"],
    "dewey":        ["Dewey Square Boston"],
    "eliotnorton":  ["Eliot Norton Park Boston"],
    "greenway":     ["Rose Kennedy Greenway Chinatown Boston"],
    "lyndenboro":   ["Chinatown Boston neighborhood park"],
    "msh":          ["Mary Soo Hoo Park Boston"],
    "oxford":       ["Oxford Street Chinatown Boston"],
    "reggie":       ["Reggie Wong Park Boston Chinatown"],
    "taitung":      ["Chinatown Gate Boston"],
    "tufts":        ["community garden South End Boston"],
}

def search_commons(query):
    encoded = urllib.parse.quote(query)
    url = (f"https://commons.wikimedia.org/w/api.php?action=query&list=search"
           f"&srsearch={encoded}&srnamespace=6&srlimit=5&format=json")
    req = urllib.request.Request(url, headers={"User-Agent": "HEROSProject/1.0"})
    resp = urllib.request.urlopen(req, timeout=15)
    data = json.loads(resp.read())
    results = data.get('query', {}).get('search', [])
    return [r['title'] for r in results if r['title'].lower().endswith(('.jpg', '.png', '.jpeg'))]

def get_image_url(title):
    encoded = urllib.parse.quote(title)
    url = (f"https://commons.wikimedia.org/w/api.php?action=query&titles={encoded}"
           f"&prop=imageinfo&iiprop=url|extmetadata&format=json")
    req = urllib.request.Request(url, headers={"User-Agent": "HEROSProject/1.0"})
    resp = urllib.request.urlopen(req, timeout=15)
    data = json.loads(resp.read())
    for pid, pdata in data['query']['pages'].items():
        ii = pdata.get('imageinfo', [{}])[0]
        meta = ii.get('extmetadata', {})
        return {
            'url': ii.get('url', ''),
            'license': meta.get('LicenseShortName', {}).get('value', 'unknown'),
            'author': meta.get('Artist', {}).get('value', 'unknown'),
            'title': title,
        }
    return None

results = {}
for key, queries in SEARCHES.items():
    print(f"--- {key} ---")
    found = None
    for q in queries:
        try:
            titles = search_commons(q)
            for t in titles:
                info = get_image_url(t)
                if info and info['url']:
                    found = info
                    break
        except Exception as e:
            print(f"  search error: {e}")
        if found:
            break
        time.sleep(0.3)

    if found:
        ext = found['url'].split('.')[-1].lower()[:4]
        filepath = os.path.join(PHOTO_DIR, f"{key}.{ext}")
        ret = subprocess.run(
            ['curl', '-L', '-s', '-o', filepath, '-A', 'HEROSProject/1.0', found['url']],
            timeout=30
        )
        if ret.returncode == 0 and os.path.exists(filepath) and os.path.getsize(filepath) > 1000:
            sz = os.path.getsize(filepath)
            print(f"  OK ({sz//1024}KB): {found['title']}  [{found['license']}]")
            results[key] = {
                'file': f"{key}.{ext}",
                'source': found['title'],
                'license': found['license'],
                'author': found['author'],
                'wikimedia_url': found['url'],
                'status': 'downloaded',
            }
        else:
            print(f"  FAILED download")
            results[key] = {'status': 'download_failed'}
    else:
        print(f"  NO IMAGE FOUND")
        results[key] = {'status': 'not_found'}

# Update photo_sources.json
src_path = os.path.join(PHOTO_DIR, 'photo_sources.json')
with open(src_path) as f:
    sources = json.load(f)
for key, res in results.items():
    if key in sources:
        sources[key].update(res)
with open(src_path, 'w') as f:
    json.dump(sources, f, indent=2)

downloaded = sum(1 for r in results.values() if r['status'] == 'downloaded')
print(f"\n=== {downloaded}/{len(SEARCHES)} photos downloaded ===")
