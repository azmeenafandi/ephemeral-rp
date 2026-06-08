import type { Character } from '../types/character';
import type { Message } from '../types/message';
import type { SessionExport } from '../types/session';

export function makeCharacter(overrides?: Partial<Character>): Character {
  return {
    id: 'test-char-1',
    name: 'Test Character',
    description: 'A test character',
    personality: 'Friendly',
    scenario: 'Test lab',
    systemPrompt: 'You are a helpful assistant.',
    greeting: 'Hello!',
    isBuiltIn: false,
    ...overrides,
  };
}

export function makeMessage(overrides?: Partial<Message>): Message {
  return {
    id: 'msg-1',
    role: 'user',
    content: 'Hello',
    timestamp: 1000,
    ...overrides,
  };
}

export function makeSession(overrides?: Partial<SessionExport>): SessionExport {
  return {
    version: '1.0.0',
    appVersion: '1.0.0',
    exportedAt: '2026-01-01T00:00:00.000Z',
    character: makeCharacter(),
    messages: [makeMessage()],
    ...overrides,
  };
}
