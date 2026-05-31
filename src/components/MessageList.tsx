import { useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import { useChatStore } from '../stores/chatStore';
import StreamingMessage from './StreamingMessage';

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

  // If editing a message, only show messages before the editing point
  const displayedMessages = editingMessageId
    ? (() => {
        const editIndex = messages.findIndex((m) => m.id === editingMessageId);
        return editIndex !== -1 ? messages.slice(0, editIndex) : messages;
      })()
    : messages;

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
              className={`max-w-[80%] rounded-xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-indigo-900/40 text-slate-100 border border-indigo-800/50'
                  : 'bg-slate-800 text-slate-200 border border-slate-700'
              }`}
            >
              <div className="prose prose-sm prose-invert max-w-none text-sm leading-relaxed">
                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
                  {msg.content}
                </ReactMarkdown>
              </div>
              <div className="flex items-center justify-between mt-1.5">
                <p className="text-xs text-slate-500">{formatTime(msg.timestamp)}</p>
                {msg.role === 'user' && !isStreaming && !editingMessageId && (
                  <button
                    onClick={() => startEditing(msg.id)}
                    className="text-xs text-slate-600 hover:text-slate-400 transition-colors"
                    title="Edit this message"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
