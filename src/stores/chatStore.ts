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
  sendMessage: (content: string, apiKey: string, systemPrompt: string) => Promise<void>;
  clearChat: () => void;
  startNewChat: (greeting?: string) => void;
  importMessages: (messages: Message[]) => void;
  getExportData: (character: Character) => SessionExport;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isStreaming: false,
  streamingContent: '',
  error: null,

  startNewChat: (greeting) => {
    if (greeting) {
      const msg: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: greeting,
        timestamp: Date.now(),
      };
      set({ messages: [msg], error: null, isStreaming: false, streamingContent: '' });
    } else {
      set({ messages: [], error: null, isStreaming: false, streamingContent: '' });
    }
  },

  sendMessage: async (content, apiKey, systemPrompt) => {
    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content,
      timestamp: Date.now(),
    };

    const allMessages: Message[] = [
      { id: uuidv4(), role: 'system' as const, content: systemPrompt, timestamp: Date.now() },
      ...get().messages,
      userMessage,
    ];

    // Apply context window management before sending
    const trimmed = trimMessages(allMessages);
    const messages = trimmed.map((m) => ({ role: m.role, content: m.content }));

    set((state) => ({
      messages: [...state.messages, userMessage],
      isStreaming: true,
      streamingContent: '',
      error: null,
    }));

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

      const assistantMessage: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: fullContent,
        timestamp: Date.now(),
      };

      set((state) => ({
        messages: [...state.messages, assistantMessage],
        isStreaming: false,
        streamingContent: '',
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

  clearChat: () => set({ messages: [], error: null }),

  importMessages: (messages) => set({ messages, error: null }),

  getExportData: (character) => ({
    version: 1,
    exportedAt: new Date().toISOString(),
    character,
    messages: get().messages,
  }),
}));
