import sys, json, re
sys.path.insert(0, ".")
from mcp_client import MCP, unwrap_text
mcp = MCP(); mcp.initialize()
def run(name, q):
    res = mcp.call("execute_sql", {"project_id": "rdartzjlsxgzuxtjxhoe", "query": q})
    txt = unwrap_text(res) or "NULL"
    open(f"sql_{name}.json", "w", encoding="utf-8").write(txt)
    m2 = re.search(r"<untrusted-data-[0-9a-f-]+>\s*(\[.*?\])\s*</untrusted-data", txt, re.S)
    print(name, "=>", (m2.group(1)[:600] if m2 else txt[:300]))
run("views", """
SELECT table_name, table_type FROM information_schema.tables
WHERE table_schema = 'public' AND table_type IN ('VIEW','BASE TABLE') AND table_type = 'VIEW'
ORDER BY table_name
""")
run("policies_all", "SELECT schemaname, tablename, policyname, cmd, permissive FROM pg_policies ORDER BY schemaname, tablename")
