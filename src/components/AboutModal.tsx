import { useUIStore } from '../stores/uiStore';

export default function AboutModal() {
  const isOpen = useUIStore((s) => s.aboutModalOpen);
  const closeAbout = useUIStore((s) => s.closeAbout);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeAbout();
      }}
    >
      <div
        className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-slate-100">About Private AI Roleplay</h2>
            <button
              onClick={closeAbout}
              className="text-slate-500 hover:text-slate-300 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-5 text-sm text-slate-300 leading-relaxed">
            {/* Privacy */}
            <section>
              <h3 className="text-slate-100 font-medium mb-1.5">🔒 Complete Privacy</h3>
              <p>
                Nothing you type or receive is ever stored on a server. Your conversations,
                character data, and session files exist only in your browser's memory.
                Close the tab and everything is gone — permanently.
              </p>
            </section>

            {/* BYOK */}
            <section>
              <h3 className="text-slate-100 font-medium mb-1.5">🔑 Bring Your Own Key (BYOK)</h3>
              <p>
                This application does not provide an API key. You must bring your own
                DeepSeek API key. The key is held in your browser's memory and is sent directly
                to DeepSeek — it never touches our servers. The Cloudflare Worker in between
                is a stateless relay that cannot see, log, or store your key or messages.
              </p>
            </section>

            {/* OOC */}
            <section>
              <h3 className="text-slate-100 font-medium mb-1.5">🎭 Out Of Character (OOC)</h3>
              <p>
                Steer the AI's behavior mid-conversation by typing{' '}
                <code className="text-amber-300 bg-amber-900/30 px-1 rounded">OOC: your instruction</code> as a message.
                The directive is stored and quietly applied to all future responses in that session.
                Examples: <em>"OOC: be more poetic"</em>, <em>"OOC: use shorter sentences"</em>.
                Your OOC message appears in amber — no response is generated for it.
              </p>
            </section>

            {/* Session export */}
            <section>
              <h3 className="text-slate-100 font-medium mb-1.5">💾 Save Your Sessions</h3>
              <p>
                Because nothing is stored server-side, refreshing the page or closing the
                tab will erase your entire conversation. Use the{' '}
                <strong className="text-slate-200">Export Session</strong> button in the
                sidebar to download your conversation as a JSON file. You can later import
                it to continue right where you left off.
              </p>
            </section>

            {/* API key best practices */}
            <section>
              <h3 className="text-slate-100 font-medium mb-1.5">🛡️ API Key Best Practice</h3>
              <p>
                Although your key is never stored or transmitted to anyone but DeepSeek,
                we recommend generating a <strong className="text-slate-200">dedicated
                API key</strong> specifically for use on this site, and deleting it from
                your DeepSeek dashboard when you finish your session. This limits exposure
                in the unlikely event of a browser vulnerability.
              </p>
            </section>

            {/* Tech */}
            <section className="pt-2 border-t border-slate-800">
              <p className="text-xs text-slate-500">
                Built with React 19, Zustand, Tailwind CSS, and Cloudflare Workers.
                DeepSeek API via stateless relay proxy.
              </p>
            </section>
          </div>

          <button
            onClick={closeAbout}
            className="btn-primary w-full mt-5 text-sm"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
