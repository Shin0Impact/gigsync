import json, re, glob

def extract(fname):
    raw = open(fname, encoding="utf-8").read()
    try:
        d = json.loads(raw)
    except Exception:
        return None
    if isinstance(d, dict) and "error" in d:
        return {"_error": d["error"]}
    txt = d.get("result", "")
    m = re.search(r"<untrusted-data-[0-9a-f-]+>\s*(\[.*?\])\s*</untrusted-data", txt, re.S)
    if not m:
        m = re.search(r"<untrusted-data-[0-9a-f-]+>\s*(.*?)\s*</untrusted-data", txt, re.S)
        return {"_raw": m.group(1) if m else txt}
    return json.loads(m.group(1))

data = {}
for f in glob.glob("sql_*.json"):
    key = f[4:-5]
    data[key] = extract(f)
    n = len(data[key]) if isinstance(data[key], list) else data[key]
    print(key, "->", n if isinstance(n, int) else type(n))
json.dump(data, open("catalog.json", "w", encoding="utf-8"), indent=1, ensure_ascii=False)
