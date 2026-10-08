import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CharacterSelector from '../CharacterSelector';
import { useCharacterStore } from '../../stores/characterStore';
import { useChatStore } from '../../stores/chatStore';
import { useUIStore } from '../../stores/uiStore';
import type { Character } from '../../types/character';

const charA: Character = {
  id: 'char-a',
  name: 'Char A',
  description: '',
  personality: '',
  scenario: '',
  systemPrompt: '',
  greeting: 'Hi from A',
};

const charB: Character = {
  id: 'char-b',
  name: 'Char B',
  description: '',
  personality: '',
  scenario: '',
  systemPrompt: '',
  greeting: 'Hi from B',
};

describe('CharacterSelector OOC directive scoping', () => {
  beforeEach(() => {
    useCharacterStore.setState({
      builtInCharacters: [charA, charB],
      customCharacters: [],
      selectedCharacter: charA,
    });
    useChatStore.setState({ oocInstructions: [], messages: [], chatCharacterId: 'char-a' });
    useUIStore.setState({ notice: null });
  });

  const selectChar = (id: string) => {
    fireEvent.change(screen.getByRole('combobox'), { target: { value: id } });
  };

  it('clears active directives and shows a notice when switching to a different character', () => {
    useChatStore.setState({ oocInstructions: ['be concise'] });
    render(<CharacterSelector />);

    selectChar('char-b');

    expect(useChatStore.getState().oocInstructions).toEqual([]);
    expect(useCharacterStore.getState().selectedCharacter?.id).toBe('char-b');
    expect(screen.getByRole('status')).toHaveTextContent(
      "Your /ooc directives don't roll over to Char B.",
    );
  });

  it('shows no notice when switching with no active directives', () => {
    render(<CharacterSelector />);

    selectChar('char-b');

    expect(useCharacterStore.getState().selectedCharacter?.id).toBe('char-b');
    expect(screen.queryByRole('status')).toBeNull();
    expect(useUIStore.getState().notice).toBeNull();
  });

  it('keeps directives and shows no notice when re-selecting the same character', () => {
    useChatStore.setState({ oocInstructions: ['be concise'] });
    render(<CharacterSelector />);

    selectChar('char-a');

    expect(useChatStore.getState().oocInstructions).toEqual(['be concise']);
    expect(screen.queryByRole('status')).toBeNull();
    expect(useUIStore.getState().notice).toBeNull();
  });
});
