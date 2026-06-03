import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import SettingsModal from './components/SettingsModal';
import CharacterEditor from './components/CharacterEditor';
import AboutModal from './components/AboutModal';
import { useUIStore } from './stores/uiStore';

export default function App() {
  const { toggleSidebar } = useUIStore();

  return (
    <div className="fixed inset-0 flex flex-col bg-slate-950">
      <Header onToggleSidebar={toggleSidebar} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <ChatArea />
      </div>
      <SettingsModal />
      <CharacterEditor />
      <AboutModal />
    </div>
  );
}
