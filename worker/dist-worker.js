// src/index.ts
var index_default = {
  async fetch(request) {
    const requestId = crypto.randomUUID();
    const startTime = Date.now();
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        }
      });
    }
    if (request.method !== "POST" || new URL(request.url).pathname !== "/api/chat") {
      return jsonResponse(405, { error: "Method not allowed. Use POST /api/chat" }, requestId, startTime);
    }
    let body;
    try {
      body = await request.json();
    } catch {
      return jsonResponse(400, { error: "Invalid JSON body" }, requestId, startTime);
    }
    if (!body.apiKey || typeof body.apiKey !== "string") {
      return jsonResponse(400, { error: "Missing or invalid API key" }, requestId, startTime);
    }
    if (!Array.isArray(body.messages) || body.messages.length === 0) {
      return jsonResponse(400, { error: "Messages array is required and must not be empty" }, requestId, startTime);
    }
    try {
      const deepseekResponse = await fetch("https://api.deepseek.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${body.apiKey}`
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: body.messages,
          stream: true
        })
      });
      if (!deepseekResponse.ok) {
        const errBody = await deepseekResponse.json().catch(() => ({}));
        const message = errBody?.error?.message || `DeepSeek API error: ${deepseekResponse.status}`;
        const status = deepseekResponse.status === 401 ? 401 : deepseekResponse.status === 429 ? 429 : 502;
        return jsonResponse(status, { error: message }, requestId, startTime);
      }
      if (!deepseekResponse.body) {
        return jsonResponse(502, { error: "No response body from DeepSeek" }, requestId, startTime);
      }
      return new Response(deepseekResponse.body, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
          "Access-Control-Allow-Origin": "*"
        }
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Internal error";
      return jsonResponse(502, { error: message }, requestId, startTime);
    }
  }
};
function jsonResponse(status, body, requestId, startTime) {
  const duration = Date.now() - startTime;
  console.log(`Request ${requestId}: status=${status} duration=${duration}ms`);
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  });
}
export {
  index_default as default
};
