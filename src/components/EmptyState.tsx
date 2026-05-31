export default function EmptyState() {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="text-5xl mb-4">🎭</div>
        <h2 className="text-xl font-semibold text-slate-200 mb-2">Private AI Roleplay</h2>
        <p className="text-slate-400 text-sm mb-6">
          Select a character, set your DeepSeek API key in Settings, and start roleplaying.
          Your data never leaves your browser.
        </p>
        <div className="grid grid-cols-2 gap-2 text-left text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="text-emerald-400">🔒</span> No server storage
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-emerald-400">🔑</span> Your API key, your control
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-emerald-400">💾</span> Export your sessions
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-emerald-400">🌙</span> Dark mode always
          </div>
        </div>
      </div>
    </div>
  );
}
