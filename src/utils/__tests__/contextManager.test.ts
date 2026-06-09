import { describe, it, expect } from 'vitest';
import { trimMessages, estimateTokens, estimateTotalTokens } from '../contextManager';
import type { Message } from '../../types/message';

const systemMsg: Message = { id: 's', role: 'system' as const, content: 'You are helpful.', timestamp: 0 };

function makeMessages(count: number): Message[] {
  const msgs: Message[] = [systemMsg];
  for (let i = 0; i < count; i++) {
    const userMsg: Message = { id: `u${i}`, role: 'user', content: `Message ${i}`, timestamp: i * 2 + 1 };
    const asstMsg: Message = { id: `a${i}`, role: 'assistant', content: `Response ${i}`, timestamp: i * 2 + 2 };
    msgs.push(userMsg, asstMsg);
  }
  return msgs;
}

function makeLargeMessage(size: number): Message {
  const msg: Message = { id: 'big', role: 'user', content: 'x'.repeat(size), timestamp: 999 };
  return msg;
}

describe('contextManager', () => {
  describe('estimateTokens', () => {
    it('estimates ~1 token per 4 chars', () => {
      expect(estimateTokens('abcd')).toBe(1);
      expect(estimateTokens('abcde')).toBe(2);
      expect(estimateTokens('')).toBe(0);
    });
  });

  describe('estimateTotalTokens', () => {
    it('sums estimates across messages', () => {
      const msg: Message = { id: 'u1', role: 'user', content: 'Hello world!', timestamp: 1 };
      const msgs = [systemMsg, msg];
      const total = estimateTotalTokens(msgs);
      expect(total).toBeGreaterThan(0);
    });
  });

  describe('trimMessages', () => {
    it('preserves the system prompt', () => {
      const msgs = makeMessages(3);
      const trimmed = trimMessages(msgs);
      expect(trimmed[0]).toEqual(systemMsg);
      expect(trimmed[0].role).toBe('system');
    });

    it('returns all messages when under limit', () => {
      const msgs = makeMessages(5);
      const trimmed = trimMessages(msgs);
      // 5 pairs * (~20 chars each) + system = well under 24000 chars
      expect(trimmed.length).toBe(msgs.length);
    });

    it('trims oldest user/assistant pairs when over limit', () => {
      const msgs = makeMessages(3);
      // Add a massive message to force trimming
      msgs.push(makeLargeMessage(30000));
      const trimmed = trimMessages(msgs);
      // Should trim old messages to make room
      expect(trimmed.length).toBeLessThan(msgs.length);
      // System message still present
      expect(trimmed[0].role).toBe('system');
    });

    it('handles no system message', () => {
      const msgs: Message[] = [
        { id: 'u1', role: 'user', content: 'Hi', timestamp: 1 },
        { id: 'a1', role: 'assistant', content: 'Hey', timestamp: 2 },
      ];
      const trimmed = trimMessages(msgs);
      expect(trimmed.length).toBe(2);
    });

    it('handles empty message array', () => {
      const trimmed = trimMessages([]);
      expect(trimmed).toEqual([]);
    });

    it('returns empty array for empty messages', () => {
      expect(trimMessages([])).toEqual([]);
    });

    it('preserves system message alone', () => {
      const result = trimMessages([{ id: 's', role: 'system', content: 'You are helpful.', timestamp: 0 }]);
      expect(result).toHaveLength(1);
      expect(result[0].role).toBe('system');
    });

    it('handles no system message', () => {
      const msgs = Array.from({ length: 5 }, (_, i) => ({
        id: `m${i}`, role: 'user' as const, content: 'hello', timestamp: i,
      }));
      const result = trimMessages(msgs);
      expect(result.length).toBeGreaterThan(0);
    });
  });
});
