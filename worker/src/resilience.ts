// Retry with exponential backoff
interface RetryConfig {
  maxRetries?: number;
  baseDelayMs?: number;
  retryableStatuses?: Set<number>;
}

const DEFAULT_RETRY_CONFIG: Required<RetryConfig> = {
  maxRetries: 3,
  baseDelayMs: 1000,
  retryableStatuses: new Set([502, 503, 504]),
};

export async function withRetry<T>(
  fn: () => Promise<T>,
  config?: RetryConfig,
): Promise<T> {
  const { maxRetries, baseDelayMs, retryableStatuses } = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const status = (err as { status?: number }).status;
      // Only retry on retryable status codes or network errors (no status)
      if (status !== undefined && !retryableStatuses.has(status)) {
        throw err;
      }
      if (attempt < maxRetries) {
        const delay = baseDelayMs * Math.pow(2, attempt);
        console.log(`Retry attempt ${attempt + 1}/${maxRetries}, waiting ${delay}ms`);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
  throw lastError;
}

// Circuit breaker
type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

interface CircuitBreakerConfig {
  failureThreshold?: number;
  openTimeoutMs?: number;
}

export class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failureCount = 0;
  private openTime = 0;
  private readonly failureThreshold: number;
  private readonly openTimeoutMs: number;

  constructor(config?: CircuitBreakerConfig) {
    this.failureThreshold = config?.failureThreshold ?? 3;
    this.openTimeoutMs = config?.openTimeoutMs ?? 30_000;
  }

  get isOpen(): boolean {
    if (this.state === 'OPEN') {
      if (Date.now() - this.openTime >= this.openTimeoutMs) {
        this.state = 'HALF_OPEN';
        console.log('Circuit: OPEN → HALF_OPEN (timeout elapsed)');
        return false;
      }
      return true;
    }
    return false;
  }

  recordSuccess(): void {
    if (this.state === 'HALF_OPEN') {
      console.log('Circuit: HALF_OPEN → CLOSED (success)');
    }
    this.state = 'CLOSED';
    this.failureCount = 0;
  }

  recordFailure(): void {
    this.failureCount++;
    if (this.state === 'HALF_OPEN' || (this.state === 'CLOSED' && this.failureCount >= this.failureThreshold)) {
      this.state = 'OPEN';
      this.openTime = Date.now();
      console.log(`Circuit: → OPEN (${this.failureCount} failures)`);
    }
  }
}
