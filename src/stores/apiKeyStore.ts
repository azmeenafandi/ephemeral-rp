import { create } from 'zustand';

interface ApiKeyState {
  apiKey: string | null;
  setApiKey: (key: string) => void;
  clearApiKey: () => void;
  hasApiKey: () => boolean;
}

export const useApiKeyStore = create<ApiKeyState>((set, get) => ({
  apiKey: null,
  setApiKey: (key) => set({ apiKey: key }),
  clearApiKey: () => set({ apiKey: null }),
  hasApiKey: () => get().apiKey !== null && get().apiKey!.length > 0,
}));
