import json, sys
sys.path.insert(0, ".")
from mcp_client import MCP, unwrap_text

mcp = MCP()
mcp.initialize()

QUERIES = {
"columns": """
SELECT table_name, column_name, ordinal_position, data_type, udt_name,
       is_nullable, column_default, is_identity, identity_generation
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position
""",
"constraints": """
SELECT tc.table_name, tc.constraint_name, tc.constraint_type,
       kcu.column_name, ccu.table_name AS foreign_table, ccu.column_name AS foreign_column,
       pg_get_constraintdef(c.oid) AS def
FROM information_schema.table_constraints tc
JOIN pg_constraint c ON c.conname = tc.constraint_name AND c.connamespace = 'public'::regnamespace
LEFT JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage ccu
  ON tc.constraint_name = ccu.constraint_name AND tc.table_schema = ccu.table_schema
WHERE tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_type, tc.constraint_name
""",
"enums": """
SELECT t.typname AS enum_name, e.enumlabel AS value, e.enumsortorder
FROM pg_type t JOIN pg_enum e ON e.enumtypid = t.oid
WHERE t.typtype = 'e'
ORDER BY t.typname, e.enumsortorder
""",
"indexes": """
SELECT schemaname, tablename, indexname, indexdef
FROM pg_indexes WHERE schemaname = 'public'
ORDER BY tablename, indexname
""",
"triggers": """
SELECT event_object_table AS table_name, trigger_name, action_timing, event_manipulation,
       action_orientation, action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name
""",
"extensions": """
SELECT extname, extversion FROM pg_extension ORDER BY extname
""",
"geo_columns": """
SELECT f_table_schema, f_table_name, f_geometry_column, geometry_type, srid, type
FROM public.geometry_columns
UNION ALL
SELECT f_table_schema, f_table_name, f_geography_column, NULL, srid, type
FROM public.geography_columns
ORDER BY 1,2
""",
"rls": """
SELECT c.relname AS table_name, c.relrowsecurity AS rls_enabled, c.relforcerowsecurity AS force_rls
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'r'
ORDER BY c.relname
""",
"policies": """
SELECT tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies WHERE schemaname = 'public'
ORDER BY tablename, policyname
""",
"functions": """
SELECT p.proname, pg_get_function_arguments(p.oid) AS args,
       pg_get_function_result(p.oid) AS result, l.lanname AS lang
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
JOIN pg_language l ON l.oid = p.prolang
WHERE n.nspname = 'public'
ORDER BY p.proname
""",
}

for name, q in QUERIES.items():
    res = mcp.call("execute_sql", {"project_id": "rdartzjlsxgzuxtjxhoe", "query": q})
    txt = unwrap_text(res)
    open(f"sql_{name}.json", "w", encoding="utf-8").write(txt or "NULL")
    print("=== ", name, " -> ", (txt or "")[:120].replace("\n"," "))
