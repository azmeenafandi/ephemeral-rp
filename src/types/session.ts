import type { Character } from './character';
import type { Message } from './message';

export interface SessionExport {
  version: string;
  appVersion: string;
  exportedAt: string;
  character: Character;
  messages: Message[];
  oocInstructions?: string[];
}
