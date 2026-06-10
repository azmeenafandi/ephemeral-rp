import { v4 as uuidv4 } from '../utils/uuid';
import { AuthError } from '../utils/errors';
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

export async function streamAssistantResponse(
  response: Response,
  onChunk: (fullContent: string) => void,
): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let fullContent = '';
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
          const delta = parsed.choices?.[0]?.delta?.content;
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

  return fullContent;
}

export function formatErrorMessage(err: unknown, fallback = 'An error occurred'): string {
  if (err instanceof DOMException && err.name === 'AbortError') {
    return 'Request timed out — the AI took too long to respond. Please try again.';
  }
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    if (msg.includes('invalid api key') || msg.includes('unauthorized') || msg.includes('401')) {
      return 'API key rejected — please check your key in Settings.';
    }
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
