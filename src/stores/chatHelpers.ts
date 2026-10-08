import { v4 as uuidv4 } from '../utils/uuid';
import { trimMessages } from '../utils/contextManager';
import type { Message } from '../types/message';
import type { Character } from '../types/character';

export function isOocMessage(msg: Message): boolean {
  return msg.role === 'user' && !!(msg as Message & { occ?: boolean }).occ;
}

export function buildApiPayload(
  content: string,
  systemPrompt: string,
  baseMessages: Message[],
  oocInstructions: string[],
): { role: string; content: string }[] {
  const effectiveSystemPrompt = oocInstructions.length > 0
    ? `${systemPrompt}\n\n[DIRECTIVE — Apply these user instructions WHILE remaining in character: ${oocInstructions.join('; ')}]`
    : systemPrompt;

  const userMessage: Message = {
    id: uuidv4(),
    role: 'user',
    content,
    timestamp: Date.now(),
  };

  const apiMessages: Message[] = [
    { id: uuidv4(), role: 'system' as const, content: effectiveSystemPrompt, timestamp: Date.now() },
    ...baseMessages.filter((m) => !isOocMessage(m)),
    userMessage,
  ];

  const trimmed = trimMessages(apiMessages);
  return trimmed.map((m) => ({ role: m.role, content: m.content }));
}

export interface StreamResult {
  content: string;
  finishReason: string | null;
}

/**
 * Surfaced through the existing composer/ChatArea error banner when the model
 * stops because it hit its token limit. The partial reply is still stored —
 * the notice exists so a truncated answer is never silently mistaken for a
 * complete one.
 */
export const TRUNCATION_NOTICE =
  'The response was cut off because the model reached its length limit. The partial reply was kept.';

export async function streamAssistantResponse(
  response: Response,
  onChunk: (fullContent: string) => void,
): Promise<StreamResult> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let fullContent = '';
  let finishReason: string | null = null;
  let remainder = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = remainder + decoder.decode(value, { stream: true });
    const lines = chunk.split('\n');
    remainder = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') continue;
        try {
          const parsed = JSON.parse(data);
          const choice = parsed.choices?.[0];
          if (choice?.finish_reason) {
            finishReason = choice.finish_reason;
          }
          // Only `delta.content` is read. `reasoning_content` deltas are
          // deliberately ignored so model "thinking" can never reach stored or
          // exported session state.
          const delta = choice?.delta?.content;
          if (delta) {
            fullContent += delta;
            onChunk(fullContent);
          }
        } catch {
          console.warn('SSE: malformed chunk skipped');
        }
      }
    }
  }

  return { content: fullContent, finishReason };
}

import { AuthError, NetworkError, ValidationError } from '../utils/errors';

export function formatErrorMessage(err: unknown, fallback = 'An error occurred'): string {
  if (err instanceof DOMException && err.name === 'AbortError') {
    return 'Request timed out — the AI took too long to respond. Please try again.';
  }
  if (err instanceof AuthError) {
    return err.userMessage ?? 'API key rejected — please check your key in Settings.';
  }
  if (err instanceof NetworkError) {
    return err.userMessage ?? 'Network error. Please check your connection and try again.';
  }
  if (err instanceof ValidationError) {
    return err.userMessage ?? err.message;
  }
  if (err instanceof Error) {
    return err.message;
  }
  return fallback;
}

export function reconstructOocInstructions(messages: Message[]): string[] {
  const result: string[] = [];
  for (const msg of messages) {
    if (isOocMessage(msg)) {
      result.push(msg.content.replace(/^OOC:\s*/i, ''));
    }
  }
  return result;
}

export function detectCharacterFromMessages(messages: Message[], allChars: Character[]): string | null {
  for (const msg of messages) {
    if (msg.role === 'system') {
      const match = allChars.find((c) => c.systemPrompt === msg.content);
      if (match) return match.id;
    }
  }
  return null;
}
