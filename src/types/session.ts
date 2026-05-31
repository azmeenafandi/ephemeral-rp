import type { Character } from './character';
import type { Message } from './message';

export interface SessionExport {
  version: number;
  exportedAt: string;
  character: Character;
  messages: Message[];
}
