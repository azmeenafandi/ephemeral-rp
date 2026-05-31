import { describe, it, expect, beforeEach } from 'vitest';
import { useChatStore } from '../chatStore';

const systemPrompt = 'You are a helpful assistant.';

describe('chatStore', () => {
  beforeEach(() => {
    useChatStore.setState({
      messages: [],
      isStreaming: false,
      streamingContent: '',
      error: null,
    });
  });

  it('starts with no messages', () => {
    expect(useChatStore.getState().messages).toHaveLength(0);
    expect(useChatStore.getState().isStreaming).toBe(false);
  });

  it('clears chat', () => {
    useChatStore.setState({
      messages: [
        { id: '1', role: 'user', content: 'Hello', timestamp: 1000 },
        { id: '2', role: 'assistant', content: 'Hi', timestamp: 2000 },
      ],
    });
    useChatStore.getState().clearChat();
    expect(useChatStore.getState().messages).toHaveLength(0);
    expect(useChatStore.getState().error).toBeNull();
  });

  it('imports messages', () => {
    const msgs = [
      { id: 'a', role: 'system' as const, content: 'System', timestamp: 1 },
      { id: 'b', role: 'user' as const, content: 'Hello', timestamp: 2 },
    ];
    useChatStore.getState().importMessages(msgs);
    expect(useChatStore.getState().messages).toHaveLength(2);
    expect(useChatStore.getState().messages[0].content).toBe('System');
  });

  it('generates export data', () => {
    useChatStore.setState({
      messages: [
        { id: '1', role: 'user', content: 'Hello', timestamp: 1000 },
      ],
    });
    const character = { id: 'c1', name: 'Test', description: '', personality: '', scenario: '', systemPrompt: '', greeting: '' };
    const data = useChatStore.getState().getExportData(character);
    expect(data.version).toBe(1);
    expect(data.character).toBe(character);
    expect(data.messages).toHaveLength(1);
    expect(data.exportedAt).toBeTruthy();
  });
});
