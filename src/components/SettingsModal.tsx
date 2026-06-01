import { useState } from 'react';
import { useApiKeyStore } from '../stores/apiKeyStore';
import { useUIStore } from '../stores/uiStore';

export default function SettingsModal() {
  const isOpen = useUIStore((s) => s.settingsModalOpen);
  const closeSettings = useUIStore((s) => s.closeSettings);
  const apiKey = useApiKeyStore((s) => s.apiKey);
  const setApiKey = useApiKeyStore((s) => s.setApiKey);
  const clearApiKey = useApiKeyStore((s) => s.clearApiKey);
  const [inputValue, setInputValue] = useState('');

  if (!isOpen) return null;

  const maskedKey = apiKey
    ? `${apiKey.slice(0, 4)}${'•'.repeat(Math.max(0, apiKey.length - 8))}${apiKey.slice(-4)}`
    : '';

  const handleSet = () => {
    if (inputValue.trim()) {
      setApiKey(inputValue.trim());
      setInputValue('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={closeSettings}>
      <div
        className="card w-full max-w-md mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Settings</h2>
          <button onClick={closeSettings} className="btn-ghost text-sm">✕</button>
        </div>

        {/* API Key Section */}
        <section className="mb-6">
          <h3 className="text-sm font-medium text-slate-300 mb-2">DeepSeek API Key</h3>
          <p className="text-xs text-slate-500 mb-3">
            Your key is stored only in browser memory and is lost on page refresh.
            It is sent with each request to the Cloudflare Worker and forwarded to DeepSeek.
          </p>

          {apiKey ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 bg-slate-800 rounded-lg px-3 py-2 border border-slate-700">
                <code className="text-sm text-slate-300 font-mono flex-1">{maskedKey}</code>
                <button onClick={clearApiKey} className="text-red-400 hover:text-red-300 text-xs">
                  Clear
                </button>
              </div>
              <p className="flex items-center gap-1.5 text-xs text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                API key set
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="password"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="sk-..."
                  className="input-field flex-1"
                  onKeyDown={(e) => e.key === 'Enter' && handleSet()}
                />
                <button onClick={handleSet} disabled={!inputValue.trim()} className="btn-primary text-sm">
                  Set
                </button>
              </div>
              <p className="flex items-center gap-1.5 text-xs text-red-400">
                <span className="w-2 h-2 rounded-full bg-red-400" />
                No API key set
              </p>
            </div>
          )}

          <p className="mt-2 p-2 bg-amber-900/20 border border-amber-800/30 rounded text-xs text-amber-400">
            ⚠️ Your API key will be lost when you refresh the page. Export your session to save conversations.
          </p>
        </section>

        {/* Model Section */}
        <section className="mb-6">
          <h3 className="text-sm font-medium text-slate-300 mb-2">Model</h3>
          <div className="bg-slate-800 rounded-lg px-3 py-2 border border-slate-700">
            <code className="text-sm text-slate-300">deepseek-v4-flash</code>
          </div>
        </section>

        {/* About Section */}
        <section>
          <h3 className="text-sm font-medium text-slate-300 mb-2">About</h3>
          <div className="text-xs text-slate-500 space-y-1">
            <p>Private AI Roleplay v{import.meta.env.VITE_APP_VERSION}</p>
            <p className="flex items-center gap-1">
              <span className="text-emerald-400">🔒</span>
              Your data never leaves your browser. No server-side storage. No logging of conversations.
            </p>
            <p>Powered by DeepSeek API · Deployed on Cloudflare</p>
          </div>
        </section>
      </div>
    </div>
  );
}
