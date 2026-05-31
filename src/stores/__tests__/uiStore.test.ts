import { describe, it, expect, beforeEach } from 'vitest';
import { useUIStore } from '../uiStore';

describe('uiStore', () => {
  beforeEach(() => {
    useUIStore.setState({
      sidebarOpen: true,
      settingsModalOpen: false,
      characterEditorOpen: false,
      editingCharacterId: null,
    });
  });

  it('starts with sidebar open', () => {
    expect(useUIStore.getState().sidebarOpen).toBe(true);
  });

  it('toggles sidebar', () => {
    useUIStore.getState().toggleSidebar();
    expect(useUIStore.getState().sidebarOpen).toBe(false);
    useUIStore.getState().toggleSidebar();
    expect(useUIStore.getState().sidebarOpen).toBe(true);
  });

  it('opens and closes settings modal', () => {
    useUIStore.getState().openSettings();
    expect(useUIStore.getState().settingsModalOpen).toBe(true);
    useUIStore.getState().closeSettings();
    expect(useUIStore.getState().settingsModalOpen).toBe(false);
  });

  it('opens character editor with no id (create mode)', () => {
    useUIStore.getState().openCharacterEditor();
    expect(useUIStore.getState().characterEditorOpen).toBe(true);
    expect(useUIStore.getState().editingCharacterId).toBeNull();
  });

  it('opens character editor with id (edit mode)', () => {
    useUIStore.getState().openCharacterEditor('char-123');
    expect(useUIStore.getState().characterEditorOpen).toBe(true);
    expect(useUIStore.getState().editingCharacterId).toBe('char-123');
  });

  it('closes character editor', () => {
    useUIStore.getState().openCharacterEditor('char-123');
    useUIStore.getState().closeCharacterEditor();
    expect(useUIStore.getState().characterEditorOpen).toBe(false);
    expect(useUIStore.getState().editingCharacterId).toBeNull();
  });
});
