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

function resolveFormatVersion(obj: Record<string, unknown>): string {
  const version = typeof obj.version === 'number' ? '1.0.0' : obj.version;
  if (typeof version !== 'string' || !version.match(/^\d+\.\d+\.\d+$/)) {
    throw new Error('Invalid session file: unsupported version format');
  }
  return version;
}

function extractOocInstructions(
  obj: Record<string, unknown>,
  formatVersion: string,
  messages: Message[],
): { oocInstructions: string[]; messages: Message[] } {
  if (formatVersion >= '1.1.0') {
    return {
      oocInstructions: (obj.oocInstructions as string[]) ?? [],
      messages,
    };
  }
  // Legacy format (1.0.0): reconstruct from occ:true messages
  const oocInstructions: string[] = [];
  const filtered = messages.filter((m) => {
    const isOoc = (m as Message & { occ?: boolean }).occ;
    if (isOoc) {
      oocInstructions.push(m.content.replace(/^OOC:\s*/i, ''));
    }
    return !isOoc;
  });
  return { oocInstructions, messages: filtered };
}

export async function importSession(
  file: File,
): Promise<{ character: Character; messages: Message[]; oocInstructions: string[] }> {
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
    { version: 'string', appVersion: 'string', character: 'object', messages: 'array' },
    'Session',
  );

  const formatVersion = resolveFormatVersion(obj);

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

  const { oocInstructions, messages: filteredMessages } = extractOocInstructions(obj, formatVersion, obj.messages as Message[]);

  return {
    character: char as unknown as Character,
    messages: filteredMessages,
    oocInstructions,
  };
}
