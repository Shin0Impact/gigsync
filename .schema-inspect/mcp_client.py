import json, os, sys, urllib.request

URL = "https://agent-gw.kimi.com/coding/v1/mcp/supabase.supabase"
TOKEN = os.environ["KIMI_AGENT_GW_KEY"]

class MCP:
    def __init__(self):
        self.session = None
        self.req_id = 0

    def _post(self, method, params=None, is_notification=False):
        self.req_id += 1
        body = {"jsonrpc": "2.0", "method": method}
        if not is_notification:
            body["id"] = self.req_id
        if params is not None:
            body["params"] = params
        data = json.dumps(body).encode()
        req = urllib.request.Request(URL, data=data, method="POST")
        req.add_header("Content-Type", "application/json")
        req.add_header("Accept", "application/json, text/event-stream")
        req.add_header("Authorization", "Bearer " + TOKEN)
        if self.session:
            req.add_header("Mcp-Session-Id", self.session)
        with urllib.request.urlopen(req, timeout=60) as resp:
            if resp.headers.get("Mcp-Session-Id"):
                self.session = resp.headers["Mcp-Session-Id"]
            raw = resp.read().decode("utf-8", "replace")
        # parse SSE or plain JSON
        if raw.startswith("event:") or "\ndata:" in raw:
            for line in raw.splitlines():
                if line.startswith("data:"):
                    payload = line[5:].strip()
                    if payload == "[DONE]":
                        continue
                    try:
                        return json.loads(payload)
                    except Exception:
                        pass
            return None
        try:
            return json.loads(raw)
        except Exception:
            return None

    def initialize(self):
        r = self._post("initialize", {
            "protocolVersion": "2025-03-26",
            "capabilities": {},
            "clientInfo": {"name": "schema-inspector", "version": "1.0"},
        })
        self._post("notifications/initialized", is_notification=True)
        return r

    def call(self, name, arguments):
        r = self._post("tools/call", {"name": name, "arguments": arguments})
        if r is None:
            return None
        if "error" in r and r["error"]:
            return {"_error": r["error"]}
        return r.get("result", r)

def unwrap_text(result):
    if result is None:
        return None
    if isinstance(result, dict) and result.get("_error"):
        return json.dumps(result)
    out = []
    for item in result.get("content", []):
        if item.get("type") == "text":
            out.append(item["text"])
        else:
            out.append(json.dumps(item))
    return "\n".join(out)

if __name__ == "__main__":
    mode = sys.argv[1]
    mcp = MCP()
    init = mcp.initialize()
    if mode == "tools":
        r = mcp._post("tools/list", {})
        for t in r.get("result", {}).get("tools", []):
            print(t["name"], "-", json.dumps(t.get("inputSchema", {}))[:300])
    elif mode == "call":
        name = sys.argv[2]
        args = json.loads(sys.argv[3]) if len(sys.argv) > 3 else {}
        res = mcp.call(name, args)
        print(unwrap_text(res))
