import sys
sys.path.insert(0, ".")
from mcp_client import MCP, unwrap_text
import json, re

mcp = MCP(); mcp.initialize()
q = """
SELECT f_table_schema, f_table_name, f_geometry_column, coord_dimension, srid, type
FROM public.geometry_columns
UNION ALL
SELECT f_table_schema, f_table_name, f_geography_column, NULL, srid, type
FROM public.geography_columns
ORDER BY 1,2
"""
res = mcp.call("execute_sql", {"project_id": "rdartzjlsxgzuxtjxhoe", "query": q})
txt = unwrap_text(res)
open("sql_geo_columns.json", "w", encoding="utf-8").write(txt or "NULL")
print((txt or "")[:400])
