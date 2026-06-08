import { describe, it, expect } from 'vitest';
import { exportSession, importSession } from '../sessionIO';
import type { SessionExport } from '../../types/session';
import type { Character } from '../../types/character';
import type { Message } from '../../types/message';

const mockCharacter: Character = {
  id: 'test-char-1',
  name: 'Test Mage',
  description: 'A test character',
  personality: 'Testy',
  scenario: 'Test realm',
  systemPrompt: 'You are a test mage.',
  greeting: 'Hello, tester!',
};

const mockMessages: Message[] = [
  { id: 'msg-0', role: 'system', content: 'You are a test mage.', timestamp: 1000 },
  { id: 'msg-1', role: 'user', content: 'Hello', timestamp: 2000 },
  { id: 'msg-2', role: 'assistant', content: 'Hi there!', timestamp: 3000 },
];

function makeExport(): SessionExport {
  return { version: '1.0.0', appVersion: '1.0.0', exportedAt: new Date().toISOString(), character: mockCharacter, messages: mockMessages };
}

describe('sessionIO', () => {
  describe('exportSession', () => {
    it('creates a downloadable JSON blob', () => {
      const data = makeExport();
      // exportSession triggers a download — we just verify it doesn't throw
      expect(() => exportSession(data)).not.toThrow();
    });
  });

  describe('importSession', () => {
    it('parses a valid session file', async () => {
      const data = makeExport();
      const json = JSON.stringify(data);
      const file = new File([json], 'session.json', { type: 'application/json' });
      const result = await importSession(file);
      expect(result.character.name).toBe('Test Mage');
      expect(result.messages).toHaveLength(3);
    });

    it('rejects invalid JSON', async () => {
      const file = new File(['not json'], 'session.json', { type: 'application/json' });
      await expect(importSession(file)).rejects.toThrow('Invalid file: not valid JSON');
    });

    it('rejects non-object JSON', async () => {
      const file = new File(['"just a string"'], 'session.json', { type: 'application/json' });
      await expect(importSession(file)).rejects.toThrow('Session: not an object');
    });

    it('rejects missing version', async () => {
      const data = makeExport();
      delete (data as any).version;
      const file = new File([JSON.stringify(data)], 'session.json', { type: 'application/json' });
      await expect(importSession(file)).rejects.toThrow('version');
    });

    it('rejects missing character', async () => {
      const data = makeExport();
      delete (data as any).character;
      const file = new File([JSON.stringify(data)], 'session.json', { type: 'application/json' });
      await expect(importSession(file)).rejects.toThrow('character');
    });

    it('rejects character missing required fields', async () => {
      const data = makeExport();
      delete (data.character as any).personality;
      const file = new File([JSON.stringify(data)], 'session.json', { type: 'application/json' });
      await expect(importSession(file)).rejects.toThrow('Character: personality must be string');
    });

    it('rejects non-array messages', async () => {
      const data = {
        version: '1.0.0',
        appVersion: '1.0.0',
        exportedAt: '2026-01-01T00:00:00Z',
        character: {
          id: 'test-char-1',
          name: 'Test Mage',
          description: 'A test character',
          personality: 'Testy',
          scenario: 'Test realm',
          systemPrompt: 'You are a test mage.',
          greeting: 'Hello, tester!',
        },
        messages: 'not an array',
      };
      const file = new File([JSON.stringify(data)], 'session.json', { type: 'application/json' });
      await expect(importSession(file)).rejects.toThrow('messages must be an array');
    });

    it('rejects malformed message entries', async () => {
      const data = {
        version: '1.0.0',
        appVersion: '1.0.0',
        exportedAt: '2026-01-01T00:00:00Z',
        character: {
          id: 'test-char-1',
          name: 'Test Mage',
          description: 'A test character',
          personality: 'Testy',
          scenario: 'Test realm',
          systemPrompt: 'You are a test mage.',
          greeting: 'Hello, tester!',
        },
        messages: [{ id: 'bad', role: 'INVALID', content: 'x', timestamp: 1 }],
      };
      const file = new File([JSON.stringify(data)], 'session.json', { type: 'application/json' });
      await expect(importSession(file)).rejects.toThrow('Message[0]: role must be one of "system", "user", "assistant"');
    });

    it('roundtrips correctly', async () => {
      const data = {
        version: '1.0.0',
        appVersion: '1.0.0',
        exportedAt: '2026-01-01T00:00:00Z',
        character: {
          id: 'test-char-1',
          name: 'Test Mage',
          description: 'A test character',
          personality: 'Testy',
          scenario: 'Test realm',
          systemPrompt: 'You are a test mage.',
          greeting: 'Hello, tester!',
        },
        messages: [
          { id: 'msg-0', role: 'system', content: 'You are a test mage.', timestamp: 1000 },
          { id: 'msg-1', role: 'user', content: 'Hello', timestamp: 2000 },
          { id: 'msg-2', role: 'assistant', content: 'Hi there!', timestamp: 3000 },
        ],
      };
      const file = new File([JSON.stringify(data)], 'session.json', { type: 'application/json' });
      const result = await importSession(file);
      expect(result.character.name).toBe('Test Mage');
      expect(result.character.personality).toBe('Testy');
      expect(result.messages).toHaveLength(3);
      expect(result.messages[0].content).toBe('You are a test mage.');
    });
  });
});
