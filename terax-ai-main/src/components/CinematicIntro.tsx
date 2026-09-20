import { useCallback, useEffect, useRef, useState } from "react";

const STORAGE_KEY = "zypercode_intro_completed";

export function shouldPlayIntro(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(STORAGE_KEY) !== "true";
  } catch {
    return false;
  }
}

export function resetIntroStatus(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

type Props = {
  onComplete?: () => void;
  forcePlay?: boolean;
};

export function CinematicIntro({ onComplete, forcePlay = false }: Props) {
  const [visible, setVisible] = useState(() => forcePlay || shouldPlayIntro());
  const [fadingOut, setFadingOut] = useState(false);

  // References to animation stages
  const stageCommandRef = useRef<HTMLDivElement>(null);
  const cmdPrefixRef = useRef<HTMLSpanElement>(null);
  const cmdTextRef = useRef<HTMLSpanElement>(null);
  const cmdCursorRef = useRef<HTMLSpanElement>(null);
  const cmdSubtextRef = useRef<HTMLDivElement>(null);

  const stageWakeRef = useRef<HTMLDivElement>(null);
  const wakeLineRef = useRef<HTMLDivElement>(null);
  const wakeZyRef = useRef<HTMLSpanElement>(null);
  const wakeAiRef = useRef<HTMLSpanElement>(null);

  const stageCodeRef = useRef<HTMLDivElement>(null);
  const editorFrameRef = useRef<HTMLDivElement>(null);
  const codeContentRef = useRef<HTMLPreElement>(null);

  const stageRevealRef = useRef<HTMLDivElement>(null);
  const brandWordmarkRef = useRef<HTMLDivElement>(null);
  const brandSubtitleRef = useRef<HTMLDivElement>(null);
  const finalCursorRef = useRef<HTMLSpanElement>(null);

  const cancelledRef = useRef(false);

  const handleFinish = useCallback(() => {
    if (cancelledRef.current) return;
    cancelledRef.current = true;
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {}

    setFadingOut(true);
    setTimeout(() => {
      setVisible(false);
      onComplete?.();
    }, 600);
  }, [onComplete]);

  // Handle escape key or click to skip
  useEffect(() => {
    if (!visible) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === " ") {
        e.preventDefault();
        handleFinish();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [visible, handleFinish]);

  // Safety fallback timeout: never let intro hang forever
  useEffect(() => {
    if (!visible) return;
    const safetyTimer = setTimeout(() => {
      handleFinish();
    }, 32000);
    return () => clearTimeout(safetyTimer);
  }, [visible, handleFinish]);

  // Run the sequence
  useEffect(() => {
    if (!visible) return;
    cancelledRef.current = false;

    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        const t = setTimeout(() => {
          if (!cancelledRef.current) resolve();
        }, ms);
        // Clear timeout if cancelled
        if (cancelledRef.current) clearTimeout(t);
      });

    const runSequence = async () => {
      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      if (prefersReducedMotion) {
        if (stageRevealRef.current && brandWordmarkRef.current) {
          stageRevealRef.current.classList.remove("hidden");
          stageRevealRef.current.style.opacity = "1";
          brandWordmarkRef.current.style.opacity = "1";
          brandWordmarkRef.current.style.transform = "scale(1)";
        }
        await wait(1200);
        handleFinish();
        return;
      }

      // Initial buffer
      await wait(800);
      if (cancelledRef.current) return;

      // ---------------------------------------------------------
      // 01 — BLACK (Init)
      // ---------------------------------------------------------
      if (stageCommandRef.current) {
        stageCommandRef.current.classList.remove("hidden");
        stageCommandRef.current.style.opacity = "1";
      }

      await wait(1400);
      if (cancelledRef.current) return;

      // ---------------------------------------------------------
      // 02 — THE COMMAND
      // ---------------------------------------------------------
      if (cmdPrefixRef.current) {
        cmdPrefixRef.current.style.opacity = "1";
      }
      await wait(600);
      if (cancelledRef.current) return;

      const command = "zypercode";
      if (cmdCursorRef.current) {
        cmdCursorRef.current.classList.remove("animate-blink");
        cmdCursorRef.current.classList.add("cursor-static");
      }

      for (const char of command) {
        if (cancelledRef.current) return;
        if (cmdTextRef.current) {
          cmdTextRef.current.innerHTML += char;
        }
        await wait(Math.random() * 60 + 50);
      }

      await wait(250);
      if (cmdCursorRef.current) {
        cmdCursorRef.current.classList.remove("cursor-static");
        cmdCursorRef.current.classList.add("animate-blink");
      }

      await wait(800);
      if (cmdSubtextRef.current) {
        cmdSubtextRef.current.style.opacity = "0.5";
      }

      await wait(1800);
      if (cancelledRef.current) return;

      // Fade out Stage 1 smoothly
      if (stageCommandRef.current) {
        stageCommandRef.current.style.opacity = "0";
      }
      await wait(800);
      if (cancelledRef.current) return;
      if (stageCommandRef.current) {
        stageCommandRef.current.classList.add("hidden");
      }

      // ---------------------------------------------------------
      // 03 — WAKE
      // ---------------------------------------------------------
      if (stageWakeRef.current) {
        stageWakeRef.current.classList.remove("hidden");
        stageWakeRef.current.style.opacity = "1";
      }

      await wait(400);
      if (wakeLineRef.current) {
        wakeLineRef.current.style.transform = "scaleX(1)";
      }

      await wait(900);
      if (wakeZyRef.current) {
        wakeZyRef.current.style.opacity = "1";
        wakeZyRef.current.style.transform = "translateX(0)";
      }
      if (wakeAiRef.current) {
        wakeAiRef.current.style.opacity = "1";
        wakeAiRef.current.style.transform = "translateX(0)";
      }

      await wait(1800);
      if (cancelledRef.current) return;

      if (stageWakeRef.current) {
        stageWakeRef.current.style.transition = "opacity 1.2s ease-out";
        stageWakeRef.current.style.opacity = "0";
      }
      await wait(1200);
      if (cancelledRef.current) return;
      if (stageWakeRef.current) {
        stageWakeRef.current.classList.add("hidden");
      }

      // ---------------------------------------------------------
      // 04 — CODE
      // ---------------------------------------------------------
      const codeContainer = codeContentRef.current;
      if (codeContainer) {
        // Convert to individual span typewriter
        const walker = document.createTreeWalker(
          codeContainer,
          NodeFilter.SHOW_TEXT,
          null,
        );
        const textNodes: Text[] = [];
        let node: Node | null;
        while ((node = walker.nextNode())) {
          textNodes.push(node as Text);
        }

        for (const textNode of textNodes) {
          const text = textNode.nodeValue || "";
          const frag = document.createDocumentFragment();
          for (let i = 0; i < text.length; i++) {
            const char = text[i];
            if (char === "\n") {
              frag.appendChild(document.createTextNode("\n"));
            } else if (char === " ") {
              const span = document.createElement("span");
              span.innerHTML = "&nbsp;";
              span.className = "typer-char whitespace-pre opacity-0 inline-block";
              frag.appendChild(span);
            } else {
              const span = document.createElement("span");
              span.textContent = char;
              span.className = "typer-char opacity-0 inline-block";
              frag.appendChild(span);
            }
          }
          textNode.parentNode?.replaceChild(frag, textNode);
        }
      }

      if (stageCodeRef.current) {
        stageCodeRef.current.classList.remove("hidden");
      }
      await wait(100);
      if (cancelledRef.current) return;

      if (editorFrameRef.current) {
        editorFrameRef.current.style.opacity = "1";
        editorFrameRef.current.style.transform = "translateY(0)";
      }

      const codeCursor = document.createElement("span");
      codeCursor.className =
        "inline-block w-[7px] h-[15px] bg-zinc-300 translate-y-[2px] ml-[1px] transition-opacity duration-75";
      if (codeContainer) {
        codeContainer.insertBefore(codeCursor, codeContainer.firstChild);
      }

      await wait(800);
      if (cancelledRef.current) return;

      const chars = codeContainer?.querySelectorAll<HTMLElement>(".typer-char");
      if (chars) {
        for (let i = 0; i < chars.length; i++) {
          if (cancelledRef.current) return;
          const char = chars[i];
          char.style.opacity = "1";
          char.parentNode?.insertBefore(codeCursor, char.nextSibling);

          let delay = Math.random() * 12 + 8;
          if (char.textContent === "\n") delay += 120;
          else if (["{", "}", ";"].includes(char.textContent || "")) delay += 60;
          else if (char.textContent === " ") delay += 4;

          await wait(delay);
        }
      }

      codeCursor.classList.add("animate-blink");

      // ---------------------------------------------------------
      // 05 — THE CINEMATIC MOMENT / COLLAPSE
      // ---------------------------------------------------------
      await wait(1800);
      if (cancelledRef.current) return;

      codeCursor.style.opacity = "0";
      codeCursor.classList.remove("animate-blink");
      await wait(300);

      if (codeContainer) {
        codeContainer.style.opacity = "0";
      }
      await wait(1000);
      if (cancelledRef.current) return;

      if (editorFrameRef.current) {
        editorFrameRef.current.style.transition =
          "all 1.2s cubic-bezier(0.87, 0, 0.13, 1)";
        editorFrameRef.current.style.clipPath = "inset(49.8% 0 49.8% 0)";
        editorFrameRef.current.style.transform = "scale(0.95)";
        editorFrameRef.current.style.background = "transparent";
        editorFrameRef.current.style.boxShadow = "none";
      }

      await wait(1100);
      if (cancelledRef.current) return;

      if (editorFrameRef.current) {
        editorFrameRef.current.style.transition =
          "all 0.6s cubic-bezier(0.9, 0, 0.1, 1)";
        editorFrameRef.current.style.clipPath =
          "inset(49.8% 50% 49.8% 50%)";
      }

      await wait(700);
      if (cancelledRef.current) return;

      if (stageCodeRef.current) {
        stageCodeRef.current.classList.add("hidden");
      }
      await wait(600);
      if (cancelledRef.current) return;

      // ---------------------------------------------------------
      // 06 — ZYPERCODE REVEAL
      // ---------------------------------------------------------
      if (stageRevealRef.current) {
        stageRevealRef.current.classList.remove("hidden");
      }
      await wait(50);
      if (stageRevealRef.current) {
        stageRevealRef.current.style.opacity = "1";
      }
      if (brandWordmarkRef.current) {
        brandWordmarkRef.current.style.opacity = "1";
        brandWordmarkRef.current.style.transform = "scale(1)";
      }

      await wait(1400);
      if (cancelledRef.current) return;

      if (brandSubtitleRef.current) {
        brandSubtitleRef.current.style.opacity = "1";
      }

      await wait(2400);
      if (cancelledRef.current) return;

      // ---------------------------------------------------------
      // 07 — FINAL BEAT & AUTO-OPEN IDE
      // ---------------------------------------------------------
      if (brandSubtitleRef.current) {
        brandSubtitleRef.current.style.opacity = "0";
      }

      await wait(1000);
      if (cancelledRef.current) return;

      if (finalCursorRef.current) {
        finalCursorRef.current.style.opacity = "1";
      }
      await wait(500);
      if (finalCursorRef.current) {
        finalCursorRef.current.style.opacity = "0";
      }
      await wait(500);
      if (finalCursorRef.current) {
        finalCursorRef.current.style.opacity = "1";
      }

      await wait(800);
      if (cancelledRef.current) return;

      // Smoothly fade out everything and open the IDE
      handleFinish();
    };

    void runSequence();

    return () => {
      cancelledRef.current = true;
    };
  }, [visible, handleFinish]);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[99999] flex items-center justify-center bg-[#030303] text-white select-none overflow-hidden transition-opacity duration-700 ease-out ${
        fadingOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      style={{
        fontFamily:
          'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* Embedded Styles for the Cinematic Experience */}
      <style>{`
        @keyframes intro-blink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
        .animate-blink {
          animation: intro-blink 1.2s step-end infinite;
        }
        .cursor-static {
          animation: none !important;
          opacity: 1 !important;
        }
        .ease-cinematic {
          transition-timing-function: cubic-bezier(0.87, 0, 0.13, 1);
        }
        .ease-slow-reveal {
          transition-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
        }
        .syn-keyword { color: #71717a; font-weight: 500; }
        .syn-variable { color: #e4e4e7; }
        .syn-operator { color: #52525b; }
        .syn-class { color: #ffffff; font-weight: 500; }
        .syn-punctuation { color: #52525b; }
        .syn-method { color: #a1a1aa; }
        .brand-text {
          font-weight: 300;
          letter-spacing: 0.4em;
        }
        #editor-frame-box {
          clip-path: inset(0 0 0 0);
          will-change: clip-path, opacity, transform;
          background: linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.005) 100%);
          box-shadow: 0 0 0 1px rgba(255,255,255,0.05), 0 20px 40px -10px rgba(0,0,0,0.8);
        }
      `}</style>

      {/* Skip button in corner */}
      <button
        type="button"
        onClick={handleFinish}
        className="absolute top-6 right-8 text-[11px] tracking-[0.25em] text-zinc-600 hover:text-zinc-300 transition-colors uppercase font-mono cursor-pointer z-50 px-3 py-1.5 rounded border border-zinc-800/40 hover:border-zinc-700 bg-black/40 backdrop-blur-sm"
        title="Skip Intro (Esc)"
      >
        Skip ❯
      </button>

      {/* Stage 1 & 2: The Command */}
      <div
        ref={stageCommandRef}
        className="absolute inset-0 flex flex-col items-center justify-center opacity-0 transition-opacity duration-1000 z-10"
      >
        <div className="relative font-mono text-[14px] text-gray-300 flex items-center tracking-widest">
          <span
            ref={cmdPrefixRef}
            className="opacity-0 mr-4 text-zinc-600 transition-opacity duration-700"
          >
            ❯
          </span>
          <span ref={cmdTextRef} className="text-zinc-200" />
          <span
            ref={cmdCursorRef}
            className="animate-blink font-light text-zinc-500 inline-block w-[8px] h-[16px] bg-zinc-400 translate-y-[2px] ml-[2px]"
          />
        </div>
        <div
          ref={cmdSubtextRef}
          className="absolute mt-16 text-[10px] tracking-[0.3em] text-zinc-600 opacity-0 transition-opacity duration-[2000ms] ease-out font-mono"
        >
          INITIALIZING...
        </div>
      </div>

      {/* Stage 3: Wake */}
      <div
        ref={stageWakeRef}
        className="absolute inset-0 flex flex-col items-center justify-center opacity-0 z-20 hidden"
      >
        <div className="relative w-[240px] h-12 flex items-center justify-center">
          <div
            ref={wakeLineRef}
            className="absolute left-0 right-0 h-[1px] bg-zinc-700 origin-center scale-x-0 transition-transform duration-[2000ms] ease-cinematic"
          />
          <div className="flex gap-[24px] z-10 brand-text text-[12px] text-zinc-300">
            <span
              ref={wakeZyRef}
              className="opacity-0 translate-x-[-20px] transition-all duration-[1500ms] ease-cinematic"
            >
              ZYPER
            </span>
            <span
              ref={wakeAiRef}
              className="opacity-0 translate-x-[20px] transition-all duration-[1500ms] ease-cinematic"
            >
              CORE
            </span>
          </div>
        </div>
      </div>

      {/* Stage 4 & 5: Code & Collapse */}
      <div
        ref={stageCodeRef}
        className="absolute inset-0 flex items-center justify-center hidden z-30"
      >
        <div
          id="editor-frame-box"
          ref={editorFrameRef}
          className="rounded-lg px-12 py-10 overflow-hidden flex flex-col justify-center items-start origin-center transform-gpu transition-all duration-1000 opacity-0 translate-y-4"
        >
          <pre
            ref={codeContentRef}
            className="text-[13px] leading-[2.4] text-left m-0 p-0 transition-opacity duration-1000 text-zinc-400 relative font-mono tracking-tight"
          >
            <span className="syn-keyword">import</span>{" "}
            <span className="syn-punctuation">{"{"}</span>{" "}
            <span className="syn-class">ZyperAgent</span>{" "}
            <span className="syn-punctuation">{"}"}</span>{" "}
            <span className="syn-keyword">from</span>{" "}
            <span className="syn-variable">&apos;@zypercode/core&apos;</span>
            <span className="syn-punctuation">;</span>
            {"\n\n"}
            <span className="syn-keyword">const</span>{" "}
            <span className="syn-variable">agent</span>{" "}
            <span className="syn-operator">=</span>{" "}
            <span className="syn-keyword">new</span>{" "}
            <span className="syn-class">ZyperAgent</span>
            <span className="syn-punctuation">({"{"}</span>
            {"\n  "}
            <span className="syn-variable">intelligence</span>
            <span className="syn-operator">:</span>{" "}
            <span className="syn-variable">&apos;maximum&apos;</span>
            <span className="syn-punctuation">,</span>
            {"\n  "}
            <span className="syn-variable">mode</span>
            <span className="syn-operator">:</span>{" "}
            <span className="syn-variable">&apos;autonomous&apos;</span>
            {"\n"}
            <span className="syn-punctuation">{"}"});</span>
            {"\n\n"}
            <span className="syn-keyword">await</span>{" "}
            <span className="syn-variable">agent</span>
            <span className="syn-punctuation">.</span>
            <span className="syn-method">execute</span>
            <span className="syn-punctuation">();</span>
          </pre>
        </div>
      </div>

      {/* Stage 6 & 7: Reveal */}
      <div
        ref={stageRevealRef}
        className="absolute inset-0 flex flex-col items-center justify-center opacity-0 hidden z-40"
      >
        <div className="relative flex flex-col items-center justify-center">
          <div
            ref={brandWordmarkRef}
            className="text-2xl sm:text-3xl brand-text font-light text-white opacity-0 scale-[0.98] transition-all duration-[2500ms] ease-slow-reveal ml-[0.4em] flex items-center"
          >
            ZYPERCODE
            <span
              ref={finalCursorRef}
              className="opacity-0 inline-block w-[12px] h-[24px] bg-zinc-300 ml-3 translate-y-[1px]"
            />
          </div>
          <div
            ref={brandSubtitleRef}
            className="absolute top-16 text-[9px] tracking-[0.6em] text-zinc-500 opacity-0 transition-opacity duration-[2000ms] ml-[0.6em] font-mono"
          >
            AI IDE
          </div>
        </div>
      </div>
    </div>
  );
}
