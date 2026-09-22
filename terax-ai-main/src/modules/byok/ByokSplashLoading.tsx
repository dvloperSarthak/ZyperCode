export function ByokSplashLoading() {
  return (
    <div className="fixed inset-0 z-[999999] flex flex-col items-center justify-center bg-[#0A0A0C] text-foreground select-none">
      {/* Subtle top ambient glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#E7B54D]/5 blur-[120px] pointer-events-none rounded-full" />

      <div className="relative flex flex-col items-center gap-4">
        {/* Monospace Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E7B54D]/10 border border-[#E7B54D]/25 text-[#E7B54D] font-mono text-[11px] tracking-wider uppercase">
          <div className="size-1.5 rounded-full bg-[#E7B54D] shadow-[0_0_8px_rgba(231,181,77,0.8)] animate-pulse" />
          <span>ZyperCode</span>
        </div>

        {/* Minimalist spinner */}
        <div className="flex items-center gap-2 mt-2 font-mono text-[12px] text-[#787884]">
          <svg
            className="animate-spin size-3.5 text-[#E7B54D]"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>Initializing secure environment…</span>
        </div>
      </div>
    </div>
  );
}
