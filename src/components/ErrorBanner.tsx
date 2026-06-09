export default function ErrorBanner({ message, variant = 'inline' }: { message: string; variant?: 'inline' | 'modal' }) {
  const styles = variant === 'modal'
    ? 'mb-3 p-2 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-sm'
    : 'px-4 py-2 mx-4 mb-2 bg-red-900/30 border border-red-800 rounded-lg text-red-400 text-sm';
  return <div className={styles}>{message}</div>;
}
