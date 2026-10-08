import { create } from 'zustand';

interface UIState {
  sidebarOpen: boolean;
  settingsModalOpen: boolean;
  characterEditorOpen: boolean;
  aboutModalOpen: boolean;
  editingCharacterId: string | null;
  oocPanelOpen: boolean;
  notice: string | null;
  openOocPanel: () => void;
  closeOocPanel: () => void;
  setNotice: (notice: string) => void;
  clearNotice: () => void;
  toggleSidebar: () => void;
  openSettings: () => void;
  closeSettings: () => void;
  openCharacterEditor: (id?: string) => void;
  closeCharacterEditor: () => void;
  openAbout: () => void;
  closeAbout: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  oocPanelOpen: false,
  sidebarOpen: true,
  settingsModalOpen: false,
  characterEditorOpen: false,
  aboutModalOpen: false,
  editingCharacterId: null,
  notice: null,
  openOocPanel: () => set({ oocPanelOpen: true }),
  closeOocPanel: () => set({ oocPanelOpen: false }),
  setNotice: (notice) => set({ notice }),
  clearNotice: () => set({ notice: null }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  openSettings: () => set({ settingsModalOpen: true }),
  closeSettings: () => set({ settingsModalOpen: false }),
  openCharacterEditor: (id) =>
    set({ characterEditorOpen: true, editingCharacterId: id ?? null }),
  closeCharacterEditor: () =>
    set({ characterEditorOpen: false, editingCharacterId: null }),
  openAbout: () => set({ aboutModalOpen: true }),
  closeAbout: () => set({ aboutModalOpen: false }),
}));
