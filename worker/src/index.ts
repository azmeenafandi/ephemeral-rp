interface ChatRequest {
  apiKey: string;
  messages: { role: string; content: string }[];
  stream?: boolean;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const requestId = crypto.randomUUID();
    const startTime = Date.now();

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: CORS_HEADERS,
      });
    }

    // Only POST /api/chat
    if (url.pathname !== '/api/chat' || request.method !== 'POST') {
      return jsonResponse(405, { error: 'Method not allowed. Use POST /api/chat' }, requestId, startTime);
    }

    // Parse and validate request body
    let body: ChatRequest;
    try {
      body = await request.json() as ChatRequest;
    } catch {
      return jsonResponse(400, { error: 'Invalid JSON body' }, requestId, startTime);
    }

    if (!body.apiKey || typeof body.apiKey !== 'string') {
      return jsonResponse(400, { error: 'Missing or invalid API key' }, requestId, startTime);
    }

    if (!Array.isArray(body.messages) || body.messages.length === 0) {
      return jsonResponse(400, { error: 'Messages array is required and must not be empty' }, requestId, startTime);
    }

    // Forward to DeepSeek API
    try {
      const deepseekResponse = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${body.apiKey}`,
        },
        body: JSON.stringify({
          model: 'deepseek-v4-flash',
          messages: body.messages,
          max_tokens: 8192,
          stream: body.stream !== false,
        }),
      });

      if (!deepseekResponse.ok) {
        const errBody = await deepseekResponse.json().catch(() => ({})) as { error?: { message?: string } };
        const message = errBody?.error?.message || `DeepSeek API error: ${deepseekResponse.status}`;
        const status = deepseekResponse.status === 401 ? 401
          : deepseekResponse.status === 429 ? 429
          : 502;
        return jsonResponse(status, { error: message }, requestId, startTime);
      }

      if (!deepseekResponse.body) {
        return jsonResponse(502, { error: 'No response body from DeepSeek' }, requestId, startTime);
      }

      return new Response(deepseekResponse.body, {
        headers: {
          ...CORS_HEADERS,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Internal error';
      return jsonResponse(502, { error: message }, requestId, startTime);
    }
  },
};

function jsonResponse(status: number, body: object, requestId: string, startTime: number): Response {
  const duration = Date.now() - startTime;
  console.log(`Request ${requestId}: status=${status} duration=${duration}ms`);

  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}
