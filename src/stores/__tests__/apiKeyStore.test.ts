import { describe, it, expect, beforeEach } from 'vitest';
import { useApiKeyStore } from '../apiKeyStore';

describe('apiKeyStore', () => {
  beforeEach(() => {
    useApiKeyStore.setState({ apiKey: null });
  });

  it('starts with no API key', () => {
    expect(useApiKeyStore.getState().apiKey).toBeNull();
    expect(useApiKeyStore.getState().hasApiKey()).toBe(false);
  });

  it('sets and retrieves an API key', () => {
    useApiKeyStore.getState().setApiKey('sk-test-1234');
    expect(useApiKeyStore.getState().apiKey).toBe('sk-test-1234');
    expect(useApiKeyStore.getState().hasApiKey()).toBe(true);
  });

  it('clears the API key', () => {
    useApiKeyStore.getState().setApiKey('sk-test-1234');
    useApiKeyStore.getState().clearApiKey();
    expect(useApiKeyStore.getState().apiKey).toBeNull();
    expect(useApiKeyStore.getState().hasApiKey()).toBe(false);
  });

  it('treats empty string as no key', () => {
    useApiKeyStore.getState().setApiKey('');
    expect(useApiKeyStore.getState().hasApiKey()).toBe(false);
  });
});
