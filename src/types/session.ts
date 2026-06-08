import type { Character } from './character';
import type { Message } from './message';

export interface SessionExport {
  version: number;
  appVersion: string;
  exportedAt: string;
  character: Character;
  messages: Message[];
}
