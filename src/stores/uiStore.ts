import { create } from 'zustand';
import { useChatStore } from './chatStore';

interface UIState {
  sidebarOpen: boolean;
  settingsModalOpen: boolean;
  characterEditorOpen: boolean;
  aboutModalOpen: boolean;
  editingCharacterId: string | null;
  editingMessageId: string | null;
  editingContent: string | null;
  oocPanelOpen: boolean;
  openOocPanel: () => void;
  closeOocPanel: () => void;
  toggleSidebar: () => void;
  openSettings: () => void;
  closeSettings: () => void;
  openCharacterEditor: (id?: string) => void;
  closeCharacterEditor: () => void;
  openAbout: () => void;
  closeAbout: () => void;
  startEditing: (messageId: string) => void;
  cancelEditing: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  oocPanelOpen: false,
  sidebarOpen: true,
  settingsModalOpen: false,
  characterEditorOpen: false,
  aboutModalOpen: false,
  editingCharacterId: null,
  editingMessageId: null,
  editingContent: null,
  openOocPanel: () => set({ oocPanelOpen: true }),
  closeOocPanel: () => set({ oocPanelOpen: false }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  openSettings: () => set({ settingsModalOpen: true }),
  closeSettings: () => set({ settingsModalOpen: false }),
  openCharacterEditor: (id) =>
    set({ characterEditorOpen: true, editingCharacterId: id ?? null }),
  closeCharacterEditor: () =>
    set({ characterEditorOpen: false, editingCharacterId: null }),
  openAbout: () => set({ aboutModalOpen: true }),
  closeAbout: () => set({ aboutModalOpen: false }),
  startEditing: (messageId) => {
    const messages = useChatStore.getState().messages;
    const msg = messages.find((m) => m.id === messageId);
    if (!msg || msg.role !== 'user') return;
    set({ editingMessageId: messageId, editingContent: msg.content });
  },
  cancelEditing: () => set({ editingMessageId: null, editingContent: null }),
}));
