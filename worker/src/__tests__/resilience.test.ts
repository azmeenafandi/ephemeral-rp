import { describe, it, expect, vi } from 'vitest';
import { withRetry, CircuitBreaker } from '../resilience';

describe('withRetry', () => {
  it('succeeds on first attempt', async () => {
    const fn = vi.fn().mockResolvedValue('ok');
    const result = await withRetry(fn);
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries on 502 and succeeds on second attempt', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce({ status: 502 })
      .mockResolvedValueOnce('ok');
    const result = await withRetry(fn, { baseDelayMs: 0 }); // no delay for tests
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('retries on 503 and succeeds', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce({ status: 503 })
      .mockResolvedValueOnce('ok');
    const result = await withRetry(fn, { baseDelayMs: 0 });
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('does not retry on 401 (non-retryable)', async () => {
    const fn = vi.fn().mockRejectedValue({ status: 401 });
    await expect(withRetry(fn, { baseDelayMs: 0 })).rejects.toEqual({ status: 401 });
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('does not retry on 429 (non-retryable)', async () => {
    const fn = vi.fn().mockRejectedValue({ status: 429 });
    await expect(withRetry(fn, { baseDelayMs: 0 })).rejects.toEqual({ status: 429 });
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('exhausts all retries and throws last error', async () => {
    const fn = vi.fn().mockRejectedValue({ status: 502 });
    await expect(withRetry(fn, { maxRetries: 2, baseDelayMs: 0 })).rejects.toEqual({ status: 502 });
    expect(fn).toHaveBeenCalledTimes(3); // initial + 2 retries
  });

  it('retries on network errors (no status property)', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce('ok');
    const result = await withRetry(fn, { baseDelayMs: 0 });
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
  });
});

describe('CircuitBreaker', () => {
  it('starts in CLOSED state (not open)', () => {
    const cb = new CircuitBreaker({ failureThreshold: 3, openTimeoutMs: 1000 });
    expect(cb.isOpen).toBe(false);
  });

  it('opens after threshold failures', () => {
    const cb = new CircuitBreaker({ failureThreshold: 2, openTimeoutMs: 1000 });
    cb.recordFailure();
    expect(cb.isOpen).toBe(false);
    cb.recordFailure();
    expect(cb.isOpen).toBe(true);
  });

  it('returns to CLOSED after success (when not open)', () => {
    const cb = new CircuitBreaker({ failureThreshold: 3, openTimeoutMs: 1000 });
    cb.recordFailure();
    cb.recordSuccess();
    cb.recordFailure();
    expect(cb.isOpen).toBe(false); // counter reset by success
  });

  it('transitions to HALF_OPEN after timeout', async () => {
    const cb = new CircuitBreaker({ failureThreshold: 1, openTimeoutMs: 50 });
    cb.recordFailure();
    expect(cb.isOpen).toBe(true);
    await new Promise((r) => setTimeout(r, 60));
    expect(cb.isOpen).toBe(false); // not open = HALF_OPEN
  });

  it('re-opens on failure while HALF_OPEN', async () => {
    const cb = new CircuitBreaker({ failureThreshold: 1, openTimeoutMs: 50 });
    cb.recordFailure();
    expect(cb.isOpen).toBe(true);
    await new Promise((r) => setTimeout(r, 60));
    expect(cb.isOpen).toBe(false); // HALF_OPEN
    cb.recordFailure();
    expect(cb.isOpen).toBe(true); // back to OPEN
  });

  it('closes on success while HALF_OPEN', async () => {
    const cb = new CircuitBreaker({ failureThreshold: 1, openTimeoutMs: 50 });
    cb.recordFailure();
    expect(cb.isOpen).toBe(true);
    await new Promise((r) => setTimeout(r, 60));
    expect(cb.isOpen).toBe(false); // HALF_OPEN
    cb.recordSuccess();
    expect(cb.isOpen).toBe(false); // CLOSED
  });
});
