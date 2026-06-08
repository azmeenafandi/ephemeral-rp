import type { SessionExport } from '../types/session';
import type { Character } from '../types/character';
import type { Message } from '../types/message';
import { validateShape } from './validate';

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

  const obj = validateShape(
    data,
    { version: 'number', appVersion: 'string', character: 'object', messages: 'array' },
    'Session',
  );

  // Validate minimum format version
  if ((obj.version as number) < 1) {
    throw new Error('Invalid session file: unsupported version');
  }

  const char = validateShape(
    obj.character,
    {
      id: 'string',
      name: 'string',
      personality: 'string',
      systemPrompt: 'string',
      greeting: 'string',
    },
    'Character',
  );

  for (const [i, msg] of (obj.messages as unknown[]).entries()) {
    validateShape(
      msg,
      {
        id: 'string',
        role: { type: 'string', oneOf: ['system', 'user', 'assistant'] },
        content: 'string',
        timestamp: 'number',
      },
      `Message[${i}]`,
    );
  }

  return {
    character: char as unknown as Character,
    messages: obj.messages as Message[],
  };
}
