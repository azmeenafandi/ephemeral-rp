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
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  const formatTime = (ts: number) =>
    new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages
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
              <p className="text-xs text-slate-500 mt-1.5">{formatTime(msg.timestamp)}</p>
            </div>
          </div>
        ))}
      {isStreaming && <StreamingMessage content={streamingContent} />}
      <div ref={bottomRef} />
    </div>
  );
}
