import { create } from 'zustand';
import type { Character } from '../types/character';
import { builtInCharacters } from '../characters/builtIn';
import { v4 as uuidv4 } from '../utils/uuid';

interface CharacterState {
  builtInCharacters: Character[];
  customCharacters: Character[];
  selectedCharacter: Character | null;
  selectCharacter: (id: string) => void;
  createCharacter: (char: Omit<Character, 'id' | 'isBuiltIn'>) => void;
  editCharacter: (id: string, updates: Partial<Character>) => void;
  deleteCharacter: (id: string) => void;
  getSystemPrompt: () => string;
}

export const useCharacterStore = create<CharacterState>((set, get) => ({
  builtInCharacters,
  customCharacters: [],
  selectedCharacter: builtInCharacters[0],

  selectCharacter: (id) => {
    const allChars = [...get().builtInCharacters, ...get().customCharacters];
    const char = allChars.find((c) => c.id === id);
    if (char) set({ selectedCharacter: char });
  },

  createCharacter: (char) => {
    const newChar: Character = {
      ...char,
      id: uuidv4(),
      isBuiltIn: false,
    };
    set((state) => ({
      customCharacters: [...state.customCharacters, newChar],
      selectedCharacter: newChar,
    }));
  },

  editCharacter: (id, updates) => {
    set((state) => ({
      customCharacters: state.customCharacters.map((c) =>
        c.id === id ? { ...c, ...updates } : c,
      ),
      selectedCharacter:
        state.selectedCharacter?.id === id
          ? { ...state.selectedCharacter, ...updates }
          : state.selectedCharacter,
    }));
  },

  deleteCharacter: (id) => {
    set((state) => {
      const filtered = state.customCharacters.filter((c) => c.id !== id);
      return {
        customCharacters: filtered,
        selectedCharacter:
          state.selectedCharacter?.id === id
            ? state.builtInCharacters[0]
            : state.selectedCharacter,
      };
    });
  },

  getSystemPrompt: () => {
    const char = get().selectedCharacter;
    if (!char) return '';
    return char.systemPrompt;
  },
}));
