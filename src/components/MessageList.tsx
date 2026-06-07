import { useRef, useEffect } from 'react';
import { useChatStore } from '../stores/chatStore';
import StreamingMessage from './StreamingMessage';
import MarkdownContent from './MarkdownContent';

export default function MessageList() {
  const messages = useChatStore((s) => s.messages);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const streamingContent = useChatStore((s) => s.streamingContent);
  const editingMessageId = useChatStore((s) => s.editingMessageId);
  const startEditing = useChatStore((s) => s.startEditing);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  const formatTime = (ts: number) =>
    new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const displayedMessages = editingMessageId
    ? (() => {
        const editIndex = messages.findIndex((m) => m.id === editingMessageId);
        return editIndex !== -1 ? messages.slice(0, editIndex) : messages;
      })()
    : messages;

  const bubbleStyle = (role: string, occ?: boolean) => {
    if (occ) {
      return role === 'user'
        ? 'bg-amber-900/30 text-amber-200 border border-amber-800/50'
        : 'bg-amber-900/20 text-amber-200 border border-amber-800/40';
    }
    return role === 'user'
      ? 'bg-indigo-900/40 text-slate-100 border border-indigo-800/50'
      : 'bg-slate-800 text-slate-200 border border-slate-700';
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {displayedMessages
        .filter((m) => m.role !== 'system')
        .map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] sm:max-w-[80%] rounded-xl px-4 py-3 ${bubbleStyle(msg.role, msg.occ)}`}
            >
              <MarkdownContent content={msg.content} />
              <div className="flex items-center justify-between mt-1.5">
                <p className="text-xs text-slate-500">{formatTime(msg.timestamp)}</p>
                {msg.role === 'user' && !isStreaming && !editingMessageId && (
                  <button
                    onClick={() => startEditing(msg.id)}
                    className="text-xs text-slate-600 hover:text-slate-400 transition-colors"
                    title="Edit this message"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      {isStreaming && <StreamingMessage content={streamingContent} />}
      <div ref={bottomRef} />
    </div>
  );
}
