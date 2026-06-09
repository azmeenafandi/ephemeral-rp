import type { Message } from '../types/message';

export function isOocMessage(msg: Message): boolean {
  return msg.role === 'user' && !!(msg as Message & { occ?: boolean }).occ;
}
