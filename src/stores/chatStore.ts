import { create } from 'zustand';
import type { Message } from '../types/message';
import type { SessionExport } from '../types/session';
import type { Character } from '../types/character';
import { v4 as uuidv4 } from '../utils/uuid';
import { trimMessages } from '../utils/contextManager';
import { API_BASE_URL } from '../config';

interface ChatState {
  messages: Message[];
  isStreaming: boolean;
  streamingContent: string;
  error: string | null;
  editingMessageId: string | null;
  editingContent: string | null;
  pendingOOCOutput: boolean;
  sendMessage: (content: string, apiKey: string, systemPrompt: string) => Promise<void>;
  clearChat: () => void;
  startNewChat: (greeting?: string) => void;
  importMessages: (messages: Message[]) => void;
  getExportData: (character: Character) => SessionExport;
  startEditing: (messageId: string) => void;
  cancelEditing: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isStreaming: false,
  streamingContent: '',
  error: null,
  editingMessageId: null,
  editingContent: null,
  pendingOOCOutput: false,

  startNewChat: (greeting) => {
    if (greeting) {
      const msg: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: greeting,
        timestamp: Date.now(),
      };
      set({ messages: [msg], error: null, isStreaming: false, streamingContent: '', pendingOOCOutput: false });
    } else {
      set({ messages: [], error: null, isStreaming: false, streamingContent: '', pendingOOCOutput: false });
    }
  },

  sendMessage: async (content, apiKey, systemPrompt) => {
    const { editingMessageId } = get();

    // If editing a previous message, truncate everything from that point
    let baseMessages = get().messages;
    if (editingMessageId) {
      const editIndex = baseMessages.findIndex((m) => m.id === editingMessageId);
      if (editIndex !== -1) {
        baseMessages = baseMessages.slice(0, editIndex);
      }
    }

    const isOOC = /^OCC:\s*/i.test(content);

    let userMessage: Message;
    let oocSystemMsg: Message | null = null;

    if (isOOC) {
      userMessage = {
        id: uuidv4(),
        role: 'user',
        content,
        timestamp: Date.now(),
        occ: true,
      };
      const strippedContent = content.replace(/^OCC:\s*/i, '');
      oocSystemMsg = {
        id: uuidv4(),
        role: 'system',
        content: `[OUT OF CHARACTER — The roleplayer says to you directly: "${strippedContent}". Briefly acknowledge this instruction in one sentence, then immediately continue the roleplay while naturally incorporating this change.]`,
        timestamp: Date.now(),
      };
    } else {
      userMessage = {
        id: uuidv4(),
        role: 'user',
        content,
        timestamp: Date.now(),
      };
    }

    // Build API messages: system prompt, optional OOC instruction, then base messages (filtering OOC user messages), then current user (if not OOC)
    const apiMessages: Message[] = [
      { id: uuidv4(), role: 'system' as const, content: systemPrompt, timestamp: Date.now() },
      ...(oocSystemMsg ? [oocSystemMsg] : []),
      ...baseMessages.filter((m) => !(m.role === 'user' && (m as Message & { occ?: boolean }).occ)),
    ];

    if (!isOOC) {
      apiMessages.push(userMessage);
    }

    // Apply context window management before sending
    const trimmed = trimMessages(apiMessages);
    const messages = trimmed.map((m) => ({ role: m.role, content: m.content }));

    const storeMessages = oocSystemMsg
      ? [...baseMessages, oocSystemMsg, userMessage]
      : [...baseMessages, userMessage];

    set({
      messages: storeMessages,
      isStreaming: true,
      streamingContent: '',
      error: null,
      editingMessageId: null,
      editingContent: null,
      pendingOOCOutput: isOOC,
    });

    // Abort stuck requests after 2 minutes (connection stalled, DeepSeek timeout, etc.)
    const STREAM_TIMEOUT_MS = 120_000;

    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey, messages }),
        signal: AbortSignal.timeout(STREAM_TIMEOUT_MS),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(err.error || `HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) {
                fullContent += delta;
                set({ streamingContent: fullContent });
              }
            } catch {
              // skip malformed SSE chunks
            }
          }
        }
      }

      const { pendingOOCOutput } = get();

      const assistantMessage: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: fullContent,
        timestamp: Date.now(),
        ...(pendingOOCOutput ? { occ: true } : {}),
      };

      set((state) => ({
        messages: [...state.messages, assistantMessage],
        isStreaming: false,
        streamingContent: '',
        pendingOOCOutput: false,
      }));
    } catch (err) {
      const message =
        err instanceof DOMException && err.name === 'AbortError'
          ? 'Request timed out — the AI took too long to respond. Please try again.'
          : err instanceof Error
            ? err.message
            : 'An error occurred';
      set({
        isStreaming: false,
        streamingContent: '',
        error: message,
      });
    }
  },

  clearChat: () => set({ messages: [], error: null, pendingOOCOutput: false }),

  startEditing: (messageId) => {
    const msg = get().messages.find((m) => m.id === messageId);
    if (!msg || msg.role !== 'user') return;
    set({ editingMessageId: messageId, editingContent: msg.content });
  },

  cancelEditing: () => set({ editingMessageId: null, editingContent: null }),

  importMessages: (messages) => set({ messages, error: null }),

  getExportData: (character) => ({
    version: 1,
    exportedAt: new Date().toISOString(),
    character,
    messages: get().messages,
  }),
}));
