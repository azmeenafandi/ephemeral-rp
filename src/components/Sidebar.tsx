import { useCharacterStore } from '../stores/characterStore';
import { useChatStore } from '../stores/chatStore';
import { useUIStore } from '../stores/uiStore';
import CharacterSelector from './CharacterSelector';
import { exportSession, importSession } from '../utils/sessionIO';

export default function Sidebar() {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const selectedCharacter = useCharacterStore((s) => s.selectedCharacter);
  const getExportData = useChatStore((s) => s.getExportData);
  const clearChat = useChatStore((s) => s.clearChat);
  const startNewChat = useChatStore((s) => s.startNewChat);
  const importMessages = useChatStore((s) => s.importMessages);
  const selectCharacter = useCharacterStore((s) => s.selectCharacter);
  const openCharacterEditor = useUIStore((s) => s.openCharacterEditor);
  const openAbout = useUIStore((s) => s.openAbout);

  const handleExport = () => {
    const data = getExportData();
    exportSession(data);
    toggleSidebar();
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await importSession(file);
      if (result) {
        selectCharacter(result.character.id);
        importMessages(result.messages);
        toggleSidebar();
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to import session');
    }
    e.target.value = '';
  };

  return (
    <>
      {/* Backdrop - mobile only */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transition-all duration-200 overflow-hidden border-r border-slate-800 bg-slate-900 flex flex-col shrink-0 lg:relative lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 flex flex-col gap-3 h-full">
          <CharacterSelector />

          <button
            onClick={() => {
              startNewChat(selectedCharacter?.greeting);
              toggleSidebar();
            }}
            className="btn-secondary w-full text-sm"
          >
            + New Chat
          </button>

          <button
            onClick={() => {
              openCharacterEditor();
              toggleSidebar();
            }}
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

          <button
            onClick={() => {
              openAbout();
              toggleSidebar();
            }}
            className="btn-secondary w-full text-sm"
          >
            ℹ️ About
          </button>
        </div>
      </aside>
    </>
  );
}
