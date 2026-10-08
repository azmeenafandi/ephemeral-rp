import { useEffect } from 'react';
import { useCharacterStore } from '../stores/characterStore';
import { useChatStore } from '../stores/chatStore';
import { useUIStore } from '../stores/uiStore';

const NOTICE_DISMISS_MS = 5000;

export default function CharacterSelector() {
  const builtInCharacters = useCharacterStore((s) => s.builtInCharacters);
  const customCharacters = useCharacterStore((s) => s.customCharacters);
  const selectedCharacter = useCharacterStore((s) => s.selectedCharacter);
  const selectCharacter = useCharacterStore((s) => s.selectCharacter);
  const startNewChat = useChatStore((s) => s.startNewChat);
  const clearOocInstructions = useChatStore((s) => s.clearOocInstructions);
  const notice = useUIStore((s) => s.notice);
  const setNotice = useUIStore((s) => s.setNotice);
  const clearNotice = useUIStore((s) => s.clearNotice);
  const openCharacterEditor = useUIStore((s) => s.openCharacterEditor);

  const allChars = [...builtInCharacters, ...customCharacters];

  // Auto-dismiss the character-switch notice after a few seconds
  useEffect(() => {
    if (notice) {
      const timer = setTimeout(() => clearNotice(), NOTICE_DISMISS_MS);
      return () => clearTimeout(timer);
    }
  }, [notice, clearNotice]);

  const handleSelect = (id: string) => {
    const char = allChars.find((c) => c.id === id);
    const isSwitch = selectedCharacter?.id !== id;
    // Directives are scoped to the selected character, so a switch to a
    // different character drops them — but say so rather than clearing silently.
    if (isSwitch && char && useChatStore.getState().oocInstructions.length > 0) {
      clearOocInstructions();
      setNotice(`Your /ooc directives don't roll over to ${char.name}.`);
    }
    selectCharacter(id);
    startNewChat(char?.greeting);
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
        Character
      </label>
      <select
        value={selectedCharacter?.id ?? ''}
        onChange={(e) => handleSelect(e.target.value)}
        className="input-field text-sm"
      >
        {allChars.map((char) => (
          <option key={char.id} value={char.id}>
            {char.name} {char.isBuiltIn ? '' : '(custom)'}
          </option>
        ))}
      </select>
      {notice && (
        <p role="status" className="text-xs text-amber-400/80">
          {notice}
        </p>
      )}
      {selectedCharacter && (
        <div className="text-xs text-slate-500 space-y-1">
          <p>{selectedCharacter.description}</p>
          {!selectedCharacter.isBuiltIn && (
            <button
              onClick={() => openCharacterEditor(selectedCharacter.id)}
              className="text-accent hover:text-accent-hover mt-1"
            >
              Edit character
            </button>
          )}
        </div>
      )}
    </div>
  );
}
