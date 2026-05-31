import type { Message } from '../types/message';

const CHARS_PER_TOKEN = 4; // rough estimate
const MAX_TOKENS = 6000;
const MAX_CHARS = MAX_TOKENS * CHARS_PER_TOKEN;

/**
 * Trims conversation history to fit within context window.
 * Always preserves the system prompt (first message if role === 'system').
 * Removes oldest user/assistant pairs first.
 */
export function trimMessages(messages: Message[]): Message[] {
  const systemMsg = messages.find((m) => m.role === 'system');
  const nonSystem = messages.filter((m) => m.role !== 'system');

  let totalChars = (systemMsg?.content.length ?? 0) + nonSystem.reduce((sum, m) => sum + m.content.length, 0);

  const trimmed = [...nonSystem];

  // Remove oldest user/assistant pairs until within limit
  while (totalChars > MAX_CHARS && trimmed.length > 1) {
    const removed = trimmed.shift()!;
    totalChars -= removed.content.length;
  }

  const result: Message[] = [];
  if (systemMsg) result.push(systemMsg);
  result.push(...trimmed);
  return result;
}

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

export function estimateTotalTokens(messages: Message[]): number {
  return messages.reduce((sum, m) => sum + estimateTokens(m.content), 0);
}
