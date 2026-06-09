import MessageList from './MessageList';
import MessageComposer from './MessageComposer';
import EmptyState from './EmptyState';
import ErrorBanner from './ErrorBanner';
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
          {error && <ErrorBanner message={error} />}
          <MessageComposer />
        </>
      ) : (
        <EmptyState />
      )}
    </main>
  );
}
