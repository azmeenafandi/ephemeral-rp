import { create } from 'zustand';
import type { Message } from '../types/message';
import type { SessionExport } from '../types/session';
import { v4 as uuidv4 } from '../utils/uuid';
import { API_BASE_URL, APP_VERSION, SESSION_FORMAT_VERSION } from '../config';
import { useCharacterStore } from './characterStore';
import { buildApiPayload, streamAssistantResponse, formatErrorMessage, reconstructOocInstructions, detectCharacterFromMessages } from './chatHelpers';
import { isOocMessage } from '../utils/messageHelpers';

interface ChatState {
  messages: Message[];
  isStreaming: boolean;
  streamingContent: string;
  error: string | null;
  oocInstructions: string[];
  addOocInstruction: (text: string) => void;
  removeOocInstruction: (index: number) => void;
  chatCharacterId: string | null;
  editingMessageId: string | null;
  editingContent: string | null;
  startEditing: (messageId: string) => void;
  cancelEditing: () => void;
  sendMessage: (content: string, apiKey: string, systemPrompt: string) => Promise<void>;
  clearChat: () => void;
  startNewChat: (greeting?: string) => void;
  importMessages: (messages: Message[], oocInstructions?: string[]) => void;
  getExportData: () => SessionExport;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  editingMessageId: null,
  editingContent: null,
  isStreaming: false,
  streamingContent: '',
  error: null,
  oocInstructions: [],
  addOocInstruction: (text) =>
    set((state) => ({
      oocInstructions: [...state.oocInstructions, text],
    })),
  removeOocInstruction: (index) =>
    set((state) => ({
      oocInstructions: state.oocInstructions.filter((_, i) => i !== index),
    })),
  chatCharacterId: null,

  startEditing: (messageId) => {
    const msg = get().messages.find((m) => m.id === messageId);
    if (!msg || msg.role !== 'user') return;
    set({ editingMessageId: messageId, editingContent: msg.content });
  },
  cancelEditing: () => set({ editingMessageId: null, editingContent: null }),

  startNewChat: (greeting) => {
    const char = useCharacterStore.getState().selectedCharacter;
    if (greeting) {
      const msg: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: greeting,
        timestamp: Date.now(),
      };
      set({ messages: [msg], error: null, isStreaming: false, streamingContent: '', oocInstructions: [], chatCharacterId: char?.id ?? null, editingMessageId: null, editingContent: null });
    } else {
      set({ messages: [], error: null, isStreaming: false, streamingContent: '', oocInstructions: [], chatCharacterId: char?.id ?? null, editingMessageId: null, editingContent: null });
    }
  },

  sendMessage: async (content, apiKey, systemPrompt) => {
    const { oocInstructions, chatCharacterId, editingMessageId } = get();

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

    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content,
      timestamp: Date.now(),
    };

    const apiPayload = buildApiPayload(content, systemPrompt, baseMessages, oocInstructions);
    const storeMessages = [...baseMessages, userMessage];

    set({
      messages: storeMessages,
      isStreaming: true,
      streamingContent: '',
      error: null,
      editingMessageId: null,
      editingContent: null,
    });

    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey, messages: apiPayload }),
        // 180s = 3 min to allow for Worker retries (up to 3 × 60s + overhead)
        signal: AbortSignal.timeout(180_000),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(err.error || `HTTP ${response.status}`);
      }

      const fullContent = await streamAssistantResponse(response, (fc) =>
        set({ streamingContent: fc }),
      );

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
      set({
        isStreaming: false,
        streamingContent: '',
        error: formatErrorMessage(err),
      });
    }
  },

  clearChat: () => set({ messages: [], error: null, oocInstructions: [], chatCharacterId: null }),

  importMessages: (messages, oocInstructions?) => {
    const instructions = oocInstructions ?? reconstructOocInstructions(messages);

    // Try to detect the character from imported system messages
    const allChars = [...useCharacterStore.getState().builtInCharacters, ...useCharacterStore.getState().customCharacters];
    const chatCharacterId = detectCharacterFromMessages(messages, allChars);

    set({ messages, error: null, oocInstructions: instructions, chatCharacterId });
  },

  getExportData: () => {
    const { chatCharacterId, oocInstructions } = get();
    const character = chatCharacterId ? useCharacterStore.getState().getCharacterById(chatCharacterId) : null;

    return {
      version: SESSION_FORMAT_VERSION,
      appVersion: APP_VERSION,
      exportedAt: new Date().toISOString(),
      character: character ?? { id: 'unknown', name: 'Unknown', description: '', personality: '', scenario: '', systemPrompt: '', greeting: '' },
      messages: get().messages.filter((m) => !isOocMessage(m)),
      oocInstructions,
    };
  },
}));
