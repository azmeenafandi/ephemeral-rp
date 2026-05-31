import { useState } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import SettingsModal from './components/SettingsModal';
import CharacterEditor from './components/CharacterEditor';
import AboutModal from './components/AboutModal';
import { useUIStore } from './stores/uiStore';

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="h-dvh flex flex-col bg-slate-950">
      <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar isOpen={sidebarOpen} />
        <ChatArea />
      </div>
      <SettingsModal />
      <CharacterEditor />
      <AboutModal />
    </div>
  );
}
