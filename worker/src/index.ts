const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const HttpStatus = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  METHOD_NOT_ALLOWED: 405,
  RATE_LIMITED: 429,
  BAD_GATEWAY: 502,
} as const;

interface ValidatedRequest {
  apiKey: string;
  messages: { role: string; content: string }[];
  stream?: boolean;
}

function validateRequest(body: unknown): ValidatedRequest {
  if (!body || typeof body !== 'object') {
    throw { status: HttpStatus.BAD_REQUEST, message: 'Invalid JSON body' };
  }
  const b = body as Record<string, unknown>;
  if (!b.apiKey || typeof b.apiKey !== 'string') {
    throw { status: HttpStatus.BAD_REQUEST, message: 'Missing or invalid API key' };
  }
  if (!Array.isArray(b.messages) || b.messages.length === 0) {
    throw { status: HttpStatus.BAD_REQUEST, message: 'Messages array is required and must not be empty' };
  }
  return {
    apiKey: b.apiKey as string,
    messages: b.messages as { role: string; content: string }[],
    stream: typeof b.stream === 'boolean' ? b.stream : undefined,
  };
}

async function proxyToDeepSeek(
  apiKey: string,
  messages: { role: string; content: string }[],
  stream: boolean,
): Promise<Response> {
  const deepseekResponse = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-v4-flash',
      messages,
      max_tokens: 8192,
      stream,
    }),
  });

  if (!deepseekResponse.ok) {
    const errBody = await deepseekResponse.json().catch(() => ({})) as { error?: { message?: string } };
    const message = errBody?.error?.message || `DeepSeek API error: ${deepseekResponse.status}`;
    const status = deepseekResponse.status === HttpStatus.UNAUTHORIZED ? HttpStatus.UNAUTHORIZED
      : deepseekResponse.status === HttpStatus.RATE_LIMITED ? HttpStatus.RATE_LIMITED
      : HttpStatus.BAD_GATEWAY;
    throw { status, message };
  }

  if (!deepseekResponse.body) {
    throw { status: HttpStatus.BAD_GATEWAY, message: 'No response body from DeepSeek' };
  }

  return deepseekResponse;
}

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
      return jsonResponse(HttpStatus.METHOD_NOT_ALLOWED, { error: 'Method not allowed. Use POST /api/chat' }, requestId, startTime);
    }

    // Parse and validate request body
    let body: ValidatedRequest;
    try {
      body = validateRequest(await request.json());
    } catch (e) {
      const err = e as { status?: number; message?: string };
      const status = err.status ?? HttpStatus.BAD_REQUEST;
      const message = err.message ?? 'Invalid JSON body';
      return jsonResponse(status, { error: message }, requestId, startTime);
    }

    // Forward to DeepSeek API
    try {
      const deepseekResponse = await proxyToDeepSeek(body.apiKey, body.messages, body.stream !== false);

      return new Response(deepseekResponse.body, {
        headers: {
          ...CORS_HEADERS,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    } catch (err) {
      const e = err as { status?: number; message?: string };
      const message = e?.message || (err instanceof Error ? err.message : 'Internal error');
      return jsonResponse(e?.status || HttpStatus.BAD_GATEWAY, { error: message }, requestId, startTime);
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
