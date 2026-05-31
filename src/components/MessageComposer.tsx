import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { useChatStore } from '../stores/chatStore';
import { useCharacterStore } from '../stores/characterStore';
import { useApiKeyStore } from '../stores/apiKeyStore';

export default function MessageComposer() {
  const [input, setInput] = useState('');
  const sendMessage = useChatStore((s) => s.sendMessage);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const getSystemPrompt = useCharacterStore((s) => s.getSystemPrompt);
  const apiKey = useApiKeyStore((s) => s.apiKey);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming || !apiKey) return;
    setInput('');
    sendMessage(trimmed, apiKey, getSystemPrompt());
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
        <button
          onClick={handleSend}
          disabled={isStreaming || !input.trim()}
          className="btn-primary shrink-0"
        >
          {isStreaming ? (
            <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
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
