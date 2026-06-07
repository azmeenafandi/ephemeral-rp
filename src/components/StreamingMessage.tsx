import MarkdownContent from './MarkdownContent';

export default function StreamingMessage({ content }: { content: string }) {
  return (
    <div className="flex justify-start">
      <div className="max-w-[80%] rounded-xl px-4 py-3 bg-slate-800 text-slate-200 border border-slate-700">
        <MarkdownContent content={content} />
        <span className="inline-block w-2 h-4 bg-accent ml-0.5 animate-pulse align-middle" />
      </div>
    </div>
  );
}
