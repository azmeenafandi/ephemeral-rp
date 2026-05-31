import { create } from 'zustand';

interface UIState {
  sidebarOpen: boolean;
  settingsModalOpen: boolean;
  characterEditorOpen: boolean;
  editingCharacterId: string | null;
  toggleSidebar: () => void;
  openSettings: () => void;
  closeSettings: () => void;
  openCharacterEditor: (id?: string) => void;
  closeCharacterEditor: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  settingsModalOpen: false,
  characterEditorOpen: false,
  editingCharacterId: null,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  openSettings: () => set({ settingsModalOpen: true }),
  closeSettings: () => set({ settingsModalOpen: false }),
  openCharacterEditor: (id) =>
    set({ characterEditorOpen: true, editingCharacterId: id ?? null }),
  closeCharacterEditor: () =>
    set({ characterEditorOpen: false, editingCharacterId: null }),
}));
