import sys, json, re
sys.path.insert(0, ".")
from mcp_client import MCP, unwrap_text
mcp = MCP(); mcp.initialize()
def run(name, q):
    res = mcp.call("execute_sql", {"project_id": "rdartzjlsxgzuxtjxhoe", "query": q})
    open(f"sql_{name}.json", "w", encoding="utf-8").write(unwrap_text(res) or "NULL")
    print(name, "saved")
run("triggers2", """
SELECT c.relname AS table_name, t.tgname, p.proname AS func, t.tgenabled
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_proc p ON p.oid = t.tgfoid
WHERE n.nspname = 'public' AND NOT t.tgisinternal
ORDER BY c.relname, t.tgname
""")
run("nonpostgis_functions", """
SELECT p.proname, pg_get_function_arguments(p.oid) AS args, pg_get_function_result(p.oid) AS result
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.prolang = (SELECT oid FROM pg_language WHERE lanname = 'plpgsql')
  AND p.proname NOT IN (SELECT proname FROM pg_proc WHERE pronamespace = 'public'::regnamespace GROUP BY proname HAVING FALSE)
ORDER BY p.proname
LIMIT 200
""")
