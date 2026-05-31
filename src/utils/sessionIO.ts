import type { SessionExport } from '../types/session';
import type { Character } from '../types/character';
import type { Message } from '../types/message';

export function exportSession(data: SessionExport): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'session.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export async function importSession(
  file: File,
): Promise<{ character: Character; messages: Message[] }> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File too large — maximum size is 5 MB');
  }

  const text = await file.text();
  let data: unknown;

  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('Invalid file: not valid JSON');
  }

  if (!data || typeof data !== 'object') {
    throw new Error('Invalid session file: not a JSON object');
  }

  const obj = data as Record<string, unknown>;

  if (typeof obj.version !== 'number' || obj.version < 1) {
    throw new Error('Invalid session file: missing or invalid version');
  }

  if (!obj.character || typeof obj.character !== 'object') {
    throw new Error('Invalid session file: missing character data');
  }

  if (!Array.isArray(obj.messages)) {
    throw new Error('Invalid session file: messages must be an array');
  }

  const char = obj.character as Record<string, unknown>;
  if (
    typeof char.id !== 'string' ||
    typeof char.name !== 'string' ||
    typeof char.personality !== 'string' ||
    typeof char.systemPrompt !== 'string' ||
    typeof char.greeting !== 'string'
  ) {
    throw new Error('Invalid session file: character missing required fields');
  }

  for (const msg of obj.messages) {
    if (
      typeof msg !== 'object' ||
      !msg ||
      typeof (msg as Record<string, unknown>).id !== 'string' ||
      !['system', 'user', 'assistant'].includes((msg as Record<string, unknown>).role as string) ||
      typeof (msg as Record<string, unknown>).content !== 'string' ||
      typeof (msg as Record<string, unknown>).timestamp !== 'number'
    ) {
      throw new Error('Invalid session file: malformed message entry');
    }
  }

  return {
    character: char as unknown as Character,
    messages: obj.messages as Message[],
  };
}
