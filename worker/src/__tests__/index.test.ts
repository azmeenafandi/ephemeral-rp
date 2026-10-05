import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';

/** Build a POST /api/chat request with an explicit client IP (for rate-limit isolation). */
function chatRequest(ip = '203.0.113.10'): Request {
  return new Request('https://example.com/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': ip },
    body: JSON.stringify({ apiKey: 'sk-test', messages: [{ role: 'user', content: 'Hi' }] }),
  });
}

/** Load a fresh Worker module so its module-private circuit breaker and rate limiter reset. */
async function loadWorker(): Promise<{ fetch: (request: Request) => Promise<Response> }> {
  vi.resetModules();
  const mod = await import('../index');
  return mod.default;
}

describe('Cloudflare Worker', () => {
  let workerModule: { default: { fetch: (request: Request) => Promise<Response> } };

  beforeAll(async () => {
    workerModule = await import('../index');
  });

  it('exports a default object with a fetch method', () => {
    expect(workerModule.default).toBeDefined();
    expect(typeof workerModule.default.fetch).toBe('function');
  });

  it('returns 405 for GET requests', async () => {
    const request = new Request('https://example.com/api/chat', { method: 'GET' });
    const response = await workerModule.default.fetch(request);
    expect(response.status).toBe(405);
    const body = await response.json() as { error: string };
    expect(body.error).toContain('Method not allowed');
  });

  it('returns 400 for missing API key', async () => {
    const request = new Request('https://example.com/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [{ role: 'user', content: 'Hi' }] }),
    });
    const response = await workerModule.default.fetch(request);
    expect(response.status).toBe(400);
    const body = await response.json() as { error: string };
    expect(body.error).toContain('API key');
  });

  it('returns 400 for empty messages array', async () => {
    const request = new Request('https://example.com/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey: 'sk-test', messages: [] }),
    });
    const response = await workerModule.default.fetch(request);
    expect(response.status).toBe(400);
    const body = await response.json() as { error: string };
    expect(body.error).toContain('Messages');
  });

  it('returns 400 for invalid JSON body', async () => {
    const request = new Request('https://example.com/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not valid json',
    });
    const response = await workerModule.default.fetch(request);
    expect(response.status).toBe(400);
  });

  it('returns 400 for missing messages field', async () => {
    const request = new Request('https://example.com/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey: 'sk-test' }),
    });
    const response = await workerModule.default.fetch(request);
    expect(response.status).toBe(400);
  });

  it('handles CORS preflight', async () => {
    const request = new Request('https://example.com/api/chat', { method: 'OPTIONS' });
    const response = await workerModule.default.fetch(request);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });

  it('returns 405 for non-/api/chat POST', async () => {
    const request = new Request('https://example.com/other', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey: 'sk-test', messages: [{ role: 'user', content: 'Hi' }] }),
    });
    const response = await workerModule.default.fetch(request);
    expect(response.status).toBe(405);
  });

  it('does NOT log API keys or message content', () => {
    const source = workerModule.default.fetch.toString();
    const logStatements = source.match(/console\.log/g);
    expect(logStatements).toBeDefined();
    expect(source).not.toMatch(/console\.log.*apiKey/);
    expect(source).not.toMatch(/console\.log.*body\.messages/);
  });
});

describe('upstream error classification', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('relays an upstream 400 to the client as a 4xx, not 502', async () => {
    const worker = await loadWorker();
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: { message: 'bad request' } }), { status: 400 }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const response = await worker.fetch(chatRequest());

    expect(response.status).toBe(400);
    const body = await response.json() as { error: string };
    expect(body.error).toBe('bad request');
  });

  it('does not retry an upstream 4xx (fetch called exactly once)', async () => {
    const worker = await loadWorker();
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: { message: 'bad request' } }), { status: 400 }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await worker.fetch(chatRequest());

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('does not increment the circuit breaker on an upstream 4xx', async () => {
    const worker = await loadWorker();
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: { message: 'bad request' } }), { status: 400 }),
    );
    vi.stubGlobal('fetch', fetchMock);

    // The breaker threshold is 3. If 4xx counted, the 4th request would
    // short-circuit to 503 without calling upstream.
    for (let i = 0; i < 4; i++) {
      const response = await worker.fetch(chatRequest(`203.0.113.${i + 1}`));
      expect(response.status).toBe(400);
    }
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it('still retries a genuine 5xx with backoff and trips the breaker', async () => {
    vi.useFakeTimers();
    const worker = await loadWorker();
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: { message: 'upstream down' } }), { status: 502 }),
    );
    vi.stubGlobal('fetch', fetchMock);

    // Each failing request exhausts the initial call + 3 retries (delays 1s/2s/4s).
    for (let i = 0; i < 3; i++) {
      const responsePromise = worker.fetch(chatRequest(`198.51.100.${i + 1}`));
      await vi.advanceTimersByTimeAsync(10_000);
      const response = await responsePromise;
      expect(response.status).toBe(502);
    }
    expect(fetchMock).toHaveBeenCalledTimes(12); // 3 requests x (1 + 3 retries)

    // Breaker is now OPEN: the next request short-circuits to 503, no upstream call.
    const blocked = await worker.fetch(chatRequest('198.51.100.99'));
    expect(blocked.status).toBe(503);
    expect(fetchMock).toHaveBeenCalledTimes(12);
  });

  it('still retries a network failure and counts it toward the breaker', async () => {
    vi.useFakeTimers();
    const worker = await loadWorker();
    const fetchMock = vi.fn().mockRejectedValue(new Error('network down'));
    vi.stubGlobal('fetch', fetchMock);

    const responsePromise = worker.fetch(chatRequest());
    await vi.advanceTimersByTimeAsync(10_000);
    const response = await responsePromise;

    expect(response.status).toBe(502); // no upstream status -> gateway error
    expect(fetchMock).toHaveBeenCalledTimes(4); // initial + 3 retries
  });
});
