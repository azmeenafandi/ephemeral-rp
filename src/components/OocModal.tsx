import { useState } from 'react';
import { useChatStore } from '../stores/chatStore';
import { useUIStore } from '../stores/uiStore';
import Modal from './Modal';

export default function OocModal() {
  const isOpen = useUIStore((s) => s.oocPanelOpen);
  const closePanel = useUIStore((s) => s.closeOocPanel);
  const oocInstructions = useChatStore((s) => s.oocInstructions);
  const removeOocInstruction = useChatStore((s) => s.removeOocInstruction);

  const [confirmIndex, setConfirmIndex] = useState<number | null>(null);

  return (
    <Modal open={isOpen} onClose={closePanel} title="OOC Directives" maxWidth="max-w-sm">
      {oocInstructions.length === 0 ? (
        <p className="text-sm text-slate-500 py-2">No active directives.</p>
      ) : (
        <ul className="space-y-3">
          {oocInstructions.map((instr, i) => (
            <li key={i} className="text-sm text-slate-300">
              {confirmIndex === i ? (
                <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                  <p className="mb-2 break-words text-slate-200">{instr}</p>
                  <p className="text-xs text-slate-500">
                    Remove this directive?{' '}
                    <button
                      onClick={() => { removeOocInstruction(i); setConfirmIndex(null); }}
                      className="text-red-400 hover:text-red-300 font-medium"
                    >
                      Yes
                    </button>
                    {' / '}
                    <button
                      onClick={() => setConfirmIndex(null)}
                      className="text-slate-400 hover:text-slate-300"
                    >
                      No
                    </button>
                  </p>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-2">
                  <span className="break-words">{instr}</span>
                  <button
                    onClick={() => setConfirmIndex(i)}
                    className="text-slate-500 hover:text-red-400 shrink-0 ml-1"
                    title="Remove directive"
                  >
                    ✕
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
