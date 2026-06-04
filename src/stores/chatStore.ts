import { create } from 'zustand';
import type { Message } from '../types/message';
import type { SessionExport } from '../types/session';
import type { Character } from '../types/character';
import { v4 as uuidv4 } from '../utils/uuid';
import { trimMessages } from '../utils/contextManager';
import { API_BASE_URL } from '../config';
import { useCharacterStore } from './characterStore';

interface ChatState {
  messages: Message[];
  isStreaming: boolean;
  streamingContent: string;
  error: string | null;
  editingMessageId: string | null;
  editingContent: string | null;
  oocInstructions: string[];
  chatCharacterId: string | null;
  sendMessage: (content: string, apiKey: string, systemPrompt: string) => Promise<void>;
  clearChat: () => void;
  startNewChat: (greeting?: string) => void;
  importMessages: (messages: Message[]) => void;
  getExportData: () => SessionExport;
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
  oocInstructions: [],
  chatCharacterId: null,

  startNewChat: (greeting) => {
    const char = useCharacterStore.getState().selectedCharacter;
    if (greeting) {
      const msg: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: greeting,
        timestamp: Date.now(),
      };
      set({ messages: [msg], error: null, isStreaming: false, streamingContent: '', oocInstructions: [], chatCharacterId: char?.id ?? null });
    } else {
      set({ messages: [], error: null, isStreaming: false, streamingContent: '', oocInstructions: [], chatCharacterId: char?.id ?? null });
    }
  },

  sendMessage: async (content, apiKey, systemPrompt) => {
    const { editingMessageId, oocInstructions, chatCharacterId } = get();

    // If chatCharacterId is not yet set (e.g. imported chat), capture it now
    if (!chatCharacterId) {
      const char = useCharacterStore.getState().selectedCharacter;
      if (char) {
        set({ chatCharacterId: char.id });
      }
    }

    // If editing a previous message, truncate everything from that point
    let baseMessages = get().messages;
    if (editingMessageId) {
      const editIndex = baseMessages.findIndex((m) => m.id === editingMessageId);
      if (editIndex !== -1) {
        baseMessages = baseMessages.slice(0, editIndex);
      }
    }

    const isOOC = /^OOC:\s*/i.test(content);

    // Handle OOC: store instruction, add amber bubble, no API call
    if (isOOC) {
      const strippedContent = content.replace(/^OOC:\s*/i, '');
      const userMessage: Message = {
        id: uuidv4(),
        role: 'user',
        content,
        timestamp: Date.now(),
        occ: true,
      };
      set({
        messages: [...baseMessages, userMessage],
        isStreaming: false,
        streamingContent: '',
        error: null,
        editingMessageId: null,
        editingContent: null,
        oocInstructions: [...get().oocInstructions, strippedContent],
      });
      return;
    }

    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content,
      timestamp: Date.now(),
    };

    // Build system prompt with OOC instructions if any
    let effectiveSystemPrompt = systemPrompt;
    if (oocInstructions.length > 0) {
      effectiveSystemPrompt = `${systemPrompt}\n\n[OUT OF CHARACTER — Follow these ongoing instructions: ${oocInstructions.join('; ')}]`;
    }

    // Build API messages: system prompt (with OOC directives), then base messages (filtering OOC user messages), then current user
    const apiMessages: Message[] = [
      { id: uuidv4(), role: 'system' as const, content: effectiveSystemPrompt, timestamp: Date.now() },
      ...baseMessages.filter((m) => !(m.role === 'user' && (m as Message & { occ?: boolean }).occ)),
      userMessage,
    ];

    // Apply context window management before sending
    const trimmed = trimMessages(apiMessages);
    const messages = trimmed.map((m) => ({ role: m.role, content: m.content }));

    const storeMessages = [...baseMessages, userMessage];

    set({
      messages: storeMessages,
      isStreaming: true,
      streamingContent: '',
      error: null,
      editingMessageId: null,
      editingContent: null,
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

  clearChat: () => set({ messages: [], error: null, oocInstructions: [], chatCharacterId: null }),

  startEditing: (messageId) => {
    const msg = get().messages.find((m) => m.id === messageId);
    if (!msg || msg.role !== 'user') return;
    set({ editingMessageId: messageId, editingContent: msg.content });
  },

  cancelEditing: () => set({ editingMessageId: null, editingContent: null }),

  importMessages: (messages) => {
    const oocInstructions: string[] = [];
    for (const msg of messages) {
      if (msg.role === 'user' && (msg as Message & { occ?: boolean }).occ) {
        const stripped = msg.content.replace(/^OOC:\s*/i, '');
        oocInstructions.push(stripped);
      }
    }

    // Try to detect the character from imported system messages
    const charStore = useCharacterStore.getState();
    const allChars = [...charStore.builtInCharacters, ...charStore.customCharacters];
    let chatCharacterId: string | null = null;
    for (const msg of messages) {
      if (msg.role === 'system') {
        const match = allChars.find((c) => c.systemPrompt === msg.content);
        if (match) {
          chatCharacterId = match.id;
          break;
        }
      }
    }

    set({ messages, error: null, oocInstructions, chatCharacterId });
  },

  getExportData: () => {
    const { chatCharacterId } = get();
    const charStore = useCharacterStore.getState();
    const allChars = [...charStore.builtInCharacters, ...charStore.customCharacters];
    const character = allChars.find((c) => c.id === chatCharacterId);

    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      character: character ?? { id: 'unknown', name: 'Unknown', description: '', personality: '', scenario: '', systemPrompt: '', greeting: '' },
      messages: get().messages,
    };
  },
}));
