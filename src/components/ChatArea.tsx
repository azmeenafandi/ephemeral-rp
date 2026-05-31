import MessageList from './MessageList';
import MessageComposer from './MessageComposer';
import EmptyState from './EmptyState';
import { useChatStore } from '../stores/chatStore';

export default function ChatArea() {
  const messages = useChatStore((s) => s.messages);
  const error = useChatStore((s) => s.error);
  const hasMessages = messages.length > 0;

  return (
    <main className="flex-1 flex flex-col min-w-0">
      {hasMessages ? (
        <>
          <MessageList />
          {error && (
            <div className="px-4 py-2 mx-4 mb-2 bg-red-900/30 border border-red-800 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}
          <MessageComposer />
        </>
      ) : (
        <EmptyState />
      )}
    </main>
  );
}
