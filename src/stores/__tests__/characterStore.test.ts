import { describe, it, expect, beforeEach } from 'vitest';
import { useCharacterStore } from '../characterStore';

describe('characterStore', () => {
  beforeEach(() => {
    // Reset to initial state
    const builtInCharacters = useCharacterStore.getState().builtInCharacters;
    useCharacterStore.setState({
      builtInCharacters,
      customCharacters: [],
      selectedCharacter: builtInCharacters[0],
    });
  });

  it('has 4 built-in characters', () => {
    const chars = useCharacterStore.getState().builtInCharacters;
    expect(chars).toHaveLength(4);
    expect(chars[0].name).toBe('Eldrin Starweaver');
    expect(chars[1].name).toBe('Nyx');
    expect(chars[2].name).toBe('Captain Zara Voss');
    expect(chars[3].name).toBe('Detective Marlowe');
  });

  it('selects the first built-in character by default', () => {
    expect(useCharacterStore.getState().selectedCharacter?.name).toBe('Eldrin Starweaver');
  });

  it('selects a different character by id', () => {
    const nyx = useCharacterStore.getState().builtInCharacters[1];
    useCharacterStore.getState().selectCharacter(nyx.id);
    expect(useCharacterStore.getState().selectedCharacter?.name).toBe('Nyx');
  });

  it('creates a custom character', () => {
    useCharacterStore.getState().createCharacter({
      name: 'Custom Hero',
      description: 'A custom character',
      personality: 'Brave',
      scenario: 'Custom world',
      systemPrompt: 'You are a hero.',
      greeting: 'Hello!',
    });
    const custom = useCharacterStore.getState().customCharacters;
    expect(custom).toHaveLength(1);
    expect(custom[0].name).toBe('Custom Hero');
    expect(custom[0].isBuiltIn).toBe(false);
    // New character becomes selected
    expect(useCharacterStore.getState().selectedCharacter?.name).toBe('Custom Hero');
  });

  it('edits a custom character', () => {
    useCharacterStore.getState().createCharacter({
      name: 'Original',
      description: 'Desc',
      personality: 'Person',
      scenario: 'Scene',
      systemPrompt: 'Prompt',
      greeting: 'Hi',
    });
    const char = useCharacterStore.getState().customCharacters[0];
    useCharacterStore.getState().editCharacter(char.id, { name: 'Updated' });
    expect(useCharacterStore.getState().customCharacters[0].name).toBe('Updated');
  });

  it('deletes a custom character', () => {
    useCharacterStore.getState().createCharacter({
      name: 'To Delete',
      description: 'Desc',
      personality: 'Person',
      scenario: 'Scene',
      systemPrompt: 'Prompt',
      greeting: 'Hi',
    });
    const char = useCharacterStore.getState().customCharacters[0];
    // Select a built-in first so we can delete
    useCharacterStore.getState().selectCharacter(useCharacterStore.getState().builtInCharacters[0].id);
    useCharacterStore.getState().deleteCharacter(char.id);
    expect(useCharacterStore.getState().customCharacters).toHaveLength(0);
  });

  it('returns a system prompt from selected character', () => {
    const prompt = useCharacterStore.getState().getSystemPrompt();
    expect(prompt).toContain('Eldrin Starweaver');
    expect(prompt).toContain('Roleplay Rules');
  });

  it('returns empty string when no character selected', () => {
    useCharacterStore.setState({ selectedCharacter: null });
    expect(useCharacterStore.getState().getSystemPrompt()).toBe('');
  });

  it('all built-in characters have required fields', () => {
    const chars = useCharacterStore.getState().builtInCharacters;
    for (const char of chars) {
      expect(char.id).toBeTruthy();
      expect(char.name).toBeTruthy();
      expect(char.description).toBeTruthy();
      expect(char.personality).toBeTruthy();
      expect(char.scenario).toBeTruthy();
      expect(char.systemPrompt).toBeTruthy();
      expect(char.greeting).toBeTruthy();
      expect(char.isBuiltIn).toBe(true);
    }
  });
});
