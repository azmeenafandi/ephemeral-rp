import MarkdownContent from './MarkdownContent';
import Spinner from './Spinner';

export default function StreamingMessage({ content }: { content: string }) {
  const isThinking = content.length === 0;

  return (
    <div className="flex justify-start">
      <div className="max-w-[80%] rounded-xl px-4 py-3 bg-slate-800 text-slate-200 border border-slate-700">
        {isThinking ? (
          <div
            className="flex items-center gap-2 text-slate-400"
            role="status"
            aria-live="polite"
          >
            <Spinner />
            <span className="text-sm italic">Thinking…</span>
          </div>
        ) : (
          <>
            <MarkdownContent content={content} />
            <span className="inline-block w-2 h-4 bg-accent ml-0.5 animate-pulse align-middle" />
          </>
        )}
      </div>
    </div>
  );
}
