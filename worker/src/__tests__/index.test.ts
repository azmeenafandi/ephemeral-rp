import { describe, it, expect, beforeAll } from 'vitest';

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
