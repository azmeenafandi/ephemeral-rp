import { useApiKeyStore } from '../stores/apiKeyStore';
import { useUIStore } from '../stores/uiStore';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export default function Header({ onToggleSidebar }: HeaderProps) {
  const hasKey = useApiKeyStore((s) => s.hasApiKey());
  const openSettings = useUIStore((s) => s.openSettings);

  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900 shrink-0">
      <div className="flex items-center gap-3">
        <button onClick={onToggleSidebar} className="btn-ghost lg:hidden" aria-label="Toggle sidebar">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h1 className="text-lg font-semibold text-slate-100">Private AI Roleplay</h1>
        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
          deepseek-v4-flash
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span
          className={`flex items-center gap-1.5 text-xs ${hasKey ? 'text-emerald-400' : 'text-red-400'}`}
        >
          <span className={`w-2 h-2 rounded-full ${hasKey ? 'bg-emerald-400' : 'bg-red-400'}`} />
          {hasKey ? 'Key set' : 'No API key'}
        </span>
        <button onClick={openSettings} className="btn-ghost" aria-label="Settings">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>
    </header>
  );
}
