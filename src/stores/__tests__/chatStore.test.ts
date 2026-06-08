import { describe, it, expect, beforeEach } from 'vitest';
import { useChatStore } from '../chatStore';
import { useCharacterStore } from '../characterStore';

const systemPrompt = 'You are a helpful assistant.';

describe('chatStore', () => {
  beforeEach(() => {
    useChatStore.setState({
      messages: [],
      isStreaming: false,
      streamingContent: '',
      error: null,
      chatCharacterId: null,
    });
    useCharacterStore.setState({
      builtInCharacters: [],
      customCharacters: [],
      selectedCharacter: null,
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
    const data = useChatStore.getState().getExportData();
    expect(data.version).toBe('1.1.0');
    expect(data.messages).toHaveLength(1);
    expect(data.exportedAt).toBeTruthy();
    // No chatCharacterId set, so fallback character is used
    expect(data.character.id).toBe('unknown');
  });

  it('generates export data with matching character', () => {
    const character = { id: 'test-char', name: 'Test', description: '', personality: '', scenario: '', systemPrompt: 'test prompt', greeting: '' };
    useChatStore.setState({
      messages: [
        { id: '1', role: 'user', content: 'Hello', timestamp: 1000 },
      ],
      chatCharacterId: 'test-char',
    });
    useCharacterStore.setState({
      builtInCharacters: [character],
      customCharacters: [],
    });
    const data = useChatStore.getState().getExportData();
    expect(data.version).toBe('1.1.0');
    expect(data.character.id).toBe('test-char');
    expect(data.messages).toHaveLength(1);
  });
});
