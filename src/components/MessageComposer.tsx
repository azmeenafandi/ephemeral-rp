import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import Spinner from './Spinner';
import { useChatStore } from '../stores/chatStore';
import { useUIStore } from '../stores/uiStore';
import { useCharacterStore } from '../stores/characterStore';
import { useApiKeyStore } from '../stores/apiKeyStore';

export default function MessageComposer() {
  const [input, setInput] = useState('');
  const sendMessage = useChatStore((s) => s.sendMessage);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const editingMessageId = useUIStore((s) => s.editingMessageId);
  const editingContent = useUIStore((s) => s.editingContent);
  const cancelEditing = useUIStore((s) => s.cancelEditing);
  const getSystemPrompt = useCharacterStore((s) => s.getSystemPrompt);
  const apiKey = useApiKeyStore((s) => s.apiKey);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Pre-fill input when editing a previous message
  useEffect(() => {
    if (editingContent !== null) {
      setInput(editingContent);
    }
  }, [editingMessageId, editingContent]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  // Refocus textarea after streaming completes so the user can keep typing
  useEffect(() => {
    if (!isStreaming && apiKey) {
      textareaRef.current?.focus();
    }
  }, [isStreaming, apiKey]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming || !apiKey) return;
    setInput('');
    sendMessage(trimmed, apiKey, getSystemPrompt());
    textareaRef.current?.focus();
  };

  const handleCancelEdit = () => {
    setInput('');
    cancelEditing();
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!apiKey) {
    return (
      <div className="p-4 border-t border-slate-800 bg-slate-900">
        <p className="text-center text-sm text-slate-500">
          Set your DeepSeek API key in Settings to start chatting
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 border-t border-slate-800 bg-slate-900">
      {editingMessageId && (
        <div className="max-w-4xl mx-auto mb-2 flex items-center gap-2">
          <span className="text-xs text-amber-400/80 italic">
            Editing a previous message — responses below this point will be replaced.
          </span>
        </div>
      )}
      <div className="flex gap-2 items-end max-w-4xl mx-auto">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message... (Enter to send, Shift+Enter for newline)"
          disabled={isStreaming}
          rows={1}
          className="input-field resize-none flex-1"
        />
        {editingMessageId && (
          <button
            onClick={handleCancelEdit}
            disabled={isStreaming}
            className="btn-secondary shrink-0 text-sm"
          >
            Cancel
          </button>
        )}
        <button
          onClick={handleSend}
          disabled={isStreaming || !input.trim()}
          className="btn-primary shrink-0"
        >
          {isStreaming ? <Spinner /> : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
