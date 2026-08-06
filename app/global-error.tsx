'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset?: () => void;
}) {
  const handleTryAgain = () => {
    if (typeof reset === 'function') {
      try {
        reset();
      } catch {
        if (typeof window !== 'undefined') {
          window.location.reload();
        }
      }
    } else if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  return (
    <html lang="en">
      <body className="bg-[var(--bg-app,#0f172a)] text-[var(--text-main,#f8fafc)] font-sans antialiased">
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md w-full bg-[var(--bg-card,#1e293b)] border border-[var(--border-color,rgba(255,255,255,0.1))] rounded-2xl p-8 shadow-xl">
            <h2 className="text-xl font-bold mb-2 text-red-400">Something went wrong</h2>
            <p className="text-sm text-slate-300 mb-6">
              An unexpected system error occurred. Please try again to restore your session.
            </p>
            <button
              type="button"
              onClick={handleTryAgain}
              className="w-full py-3 px-6 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold rounded-xl transition-all shadow-md active:scale-95"
            >
              Try Again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}

