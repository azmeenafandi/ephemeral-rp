import Modal from './Modal';
import { useUIStore } from '../stores/uiStore';

export default function AboutModal() {
  const isOpen = useUIStore((s) => s.aboutModalOpen);
  const closeAbout = useUIStore((s) => s.closeAbout);

  return (
    <Modal open={isOpen} onClose={closeAbout} title="About Private AI Roleplay" maxWidth="max-w-md">
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

            {/* Characters */}
            <section>
              <h3 className="text-slate-100 font-medium mb-1.5">🎭 Characters & Templates</h3>
              <p>
                The app includes <strong className="text-slate-200">10 built-in characters</strong> across
                fantasy, cyberpunk, sci-fi, noir, and real-world expert domains (maths, history,
                cooking, counselling, tech, and nature). Custom characters can be created through
                the editor, and new built-in characters can be added by anyone as simple{' '}
                <strong className="text-slate-200">Markdown template files</strong> —
                no coding required.
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
    </Modal>
  );
}
