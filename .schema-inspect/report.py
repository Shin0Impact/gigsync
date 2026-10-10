import json

cat = json.load(open("catalog.json", encoding="utf-8"))
tables_info = json.load(open("tables_pretty.json", encoding="utf-8"))["tables"]
rows = {t["name"].split(".")[1]: t.get("rows") for t in tables_info}

cols = {}
for r in cat["columns"]:
    cols.setdefault(r["table_name"], []).append(r)

cons = {}
for r in cat["constraints"]:
    cons.setdefault(r["table_name"], []).append(r)

idx = {}
for r in cat["indexes"]:
    idx.setdefault(r["tablename"], []).append(r)

rls = {r["table_name"]: r for r in cat["rls"]}

lines = []
order = sorted(cols.keys())
for t in order:
    lines.append(f"## {t}  (rows: {rows.get(t, '?')}, rls_enabled: {rls.get(t,{}).get('rls_enabled')})")
    pk = [c["column_name"] for c in cols[t] if c.get("is_identity") == "YES"]
    lines.append("Columns:")
    for c in cols[t]:
        nn = "NOT NULL" if c["is_nullable"] == "NO" else "nullable"
        ident = f" IDENTITY {c['identity_generation']}" if c.get("is_identity") == "YES" else ""
        dflt = f" DEFAULT {c['column_default']}" if c["column_default"] else ""
        lines.append(f"  - {c['column_name']}: {c['data_type']} (udt {c['udt_name']}), {nn}{ident}{dflt}")
    seen = set()
    if cons.get(t):
        lines.append("Constraints:")
        for c in cons[t]:
            key = (c["constraint_name"], c["column_name"])
            if key in seen: continue
            seen.add(key)
            extra = ""
            if c["constraint_type"] == "FOREIGN KEY":
                extra = f" -> {c['foreign_table']}.{c['foreign_column']}"
            lines.append(f"  - [{c['constraint_type']}] {c['constraint_name']} on ({c['column_name']}){extra}")
            if c.get("def") and c["constraint_type"] in ("CHECK","UNIQUE"):
                lines.append(f"      def: {c['def']}")
    if idx.get(t):
        lines.append("Indexes:")
        for i in idx[t]:
            lines.append(f"  - {i['indexname']}: {i['indexdef']}")
    lines.append("")

open("schema_report.md", "w", encoding="utf-8").write("\n".join(lines))
print("\n".join(lines[:120]))
