import { useCharacterStore } from '../stores/characterStore';
import { useChatStore } from '../stores/chatStore';
import { useUIStore } from '../stores/uiStore';
import CharacterSelector from './CharacterSelector';
import { exportSession, importSession } from '../utils/sessionIO';

interface SidebarProps {
  isOpen: boolean;
}

export default function Sidebar({ isOpen }: SidebarProps) {
  const selectedCharacter = useCharacterStore((s) => s.selectedCharacter);
  const getExportData = useChatStore((s) => s.getExportData);
  const clearChat = useChatStore((s) => s.clearChat);
  const startNewChat = useChatStore((s) => s.startNewChat);
  const importMessages = useChatStore((s) => s.importMessages);
  const selectCharacter = useCharacterStore((s) => s.selectCharacter);
  const openCharacterEditor = useUIStore((s) => s.openCharacterEditor);

  const handleExport = () => {
    if (!selectedCharacter) return;
    const data = getExportData(selectedCharacter);
    exportSession(data);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await importSession(file);
      if (result) {
        selectCharacter(result.character.id);
        importMessages(result.messages);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to import session');
    }
    e.target.value = '';
  };

  return (
    <aside
      className={`${isOpen ? 'w-64' : 'w-0'} lg:w-64 transition-all duration-200 overflow-hidden border-r border-slate-800 bg-slate-900 flex flex-col shrink-0`}
    >
      <div className="p-4 flex flex-col gap-3 h-full">
        <CharacterSelector />

        <button
          onClick={() => {
            startNewChat(selectedCharacter?.greeting);
          }}
          className="btn-secondary w-full text-sm"
        >
          + New Chat
        </button>

        <button
          onClick={() => openCharacterEditor()}
          className="btn-secondary w-full text-sm"
        >
          + Custom Character
        </button>

        <div className="flex-1" />

        <button onClick={handleExport} className="btn-secondary w-full text-sm">
          📥 Export Session
        </button>

        <label className="btn-secondary w-full text-sm text-center cursor-pointer">
          📤 Import Session
          <input type="file" accept=".json" onChange={handleImport} className="hidden" />
        </label>
      </div>
    </aside>
  );
}
