import { useCharacterStore } from '../stores/characterStore';
import { useChatStore } from '../stores/chatStore';
import { useUIStore } from '../stores/uiStore';

export default function CharacterSelector() {
  const builtInCharacters = useCharacterStore((s) => s.builtInCharacters);
  const customCharacters = useCharacterStore((s) => s.customCharacters);
  const selectedCharacter = useCharacterStore((s) => s.selectedCharacter);
  const selectCharacter = useCharacterStore((s) => s.selectCharacter);
  const startNewChat = useChatStore((s) => s.startNewChat);
  const openCharacterEditor = useUIStore((s) => s.openCharacterEditor);

  const allChars = [...builtInCharacters, ...customCharacters];

  const handleSelect = (id: string) => {
    selectCharacter(id);
    const all = [...builtInCharacters, ...customCharacters];
    const char = all.find((c) => c.id === id);
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
