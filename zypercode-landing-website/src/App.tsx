import React, { useState, useEffect } from "react";
import { BeamsBackground } from "@/components/ui/beams-background";
import { BeamsBackgroundDemo } from "@/components/ui/demo";
import { 
  Terminal, 
  Bot, 
  Sparkles, 
  Cpu, 
  GitBranch, 
  ShieldCheck, 
  Eye, 
  Palette, 
  Layers, 
  Zap, 
  KeyRound, 
  Command,
  Download,
  Github,
  Play,
  ChevronDown,
  Copy,
  Check,
  ExternalLink,
  Laptop,
  CheckCircle2,
  Box,
  Code2
} from "lucide-react";

const typewriterWords = [
  "lightning speed.",
  "AI autonomous agents.",
  "keyboard masters.",
  "deep terminal flow."
];

export default function App() {
  const [showDemoOnly, setShowDemoOnly] = useState(false);
  const [copied, setCopied] = useState(false);
  const [typewriterIndex, setTypewriterIndex] = useState(0);
  const [typewriterText, setTypewriterText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [videoModalOpen, setVideoModalOpen] = useState(false);

  // Typewriter effect
  useEffect(() => {
    const currentWord = typewriterWords[typewriterIndex];
    const typingSpeed = isDeleting ? 40 : 80;

    const timer = setTimeout(() => {
      if (!isDeleting && typewriterText === currentWord) {
        setTimeout(() => setIsDeleting(true), 1500);
      } else if (isDeleting && typewriterText === "") {
        setIsDeleting(false);
        setTypewriterIndex((prev) => (prev + 1) % typewriterWords.length);
      } else {
        setTypewriterText(
          currentWord.substring(0, typewriterText.length + (isDeleting ? -1 : 1))
        );
      }
    }, typingSpeed);

    return () => clearTimeout(timer);
  }, [typewriterText, isDeleting, typewriterIndex]);

  const copyInstallCommand = () => {
    navigator.clipboard.writeText("git clone https://github.com/dvloperSarthak/ZyperCode.git");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (showDemoOnly) {
    return (
      <div className="relative">
        <div className="fixed top-6 right-6 z-50">
          <button
            onClick={() => setShowDemoOnly(false)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full bg-neutral-900/90 border border-neutral-700/80 text-white backdrop-blur shadow-2xl hover:border-amber-400 transition-colors"
          >
            ← Back to Full ZyperCode Website
          </button>
        </div>
        <BeamsBackgroundDemo />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 selection:bg-amber-400 selection:text-neutral-950 font-sans antialiased">
      {/* Top Notification Bar */}
      <div className="bg-neutral-900/80 border-b border-neutral-800 text-xs text-neutral-300 py-1.5 px-4 text-center flex items-center justify-center gap-2">
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-400/20 text-amber-300 border border-amber-400/30">
          NEW
        </span>
        <span>ZyperCode v1.0.1 is now officially released with standalone portable & installer editions!</span>
        <a href="#download" className="text-amber-400 font-medium hover:underline inline-flex items-center gap-1">
          Download now <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Floating Header */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-neutral-950/75 border-b border-neutral-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <a href="#" className="flex items-center gap-3">
            <img src="/assets/zypercode_icon.png" alt="ZyperCode Logo" className="w-8 h-8 rounded-lg shadow-sm" />
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-white">ZyperCode</span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-neutral-800/80 text-amber-400 border border-neutral-700">v1.0.1</span>
            </div>
          </a>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8 text-sm text-neutral-300">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#terminal" className="hover:text-white transition-colors">Ghostty Terminal</a>
            <a href="#toolkit" className="hover:text-white transition-colors">Toolkit</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
            <a href="#download" className="text-amber-400 hover:text-amber-300 font-medium transition-colors">Downloads</a>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowDemoOnly(true)}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-neutral-900 border border-neutral-700/60 text-neutral-300 hover:border-amber-400/80 hover:text-white transition-colors"
              title="View standalone Beams Background canvas animation"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Beams Demo</span>
            </button>

            <a
              href="https://github.com/dvloperSarthak/ZyperCode"
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-lg text-neutral-300 hover:text-white hover:bg-neutral-900 transition-colors"
              aria-label="GitHub Repository"
            >
              <Github className="w-5 h-5" />
            </a>

            <a
              href="#download"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-neutral-950 shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Download className="w-4 h-4" />
              <span>Get v1.0.1</span>
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section with Live BeamsBackground Canvas integration */}
      <section className="relative overflow-hidden min-h-[92vh] flex items-center justify-center">
        {/* Background Beams Layer */}
        <div className="absolute inset-0 z-0 opacity-80 pointer-events-none">
          <BeamsBackground intensity="strong" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center flex flex-col items-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-400/30 bg-amber-400/10 text-amber-300 text-xs font-medium mb-8 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>ZyperCode v1.0.1 Beta Released</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white max-w-4xl mb-6 leading-tight">
            Terminal-first AI-native dev workspace for{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500">
              {typewriterText}
            </span>
            <span className="animate-blink text-amber-400">|</span>
          </h1>

          <p className="text-lg sm:text-xl text-neutral-300 max-w-2xl mb-10 leading-relaxed">
            The next-generation open-source code environment engineered with Ghostty terminal acceleration, multi-agent AI pairs, and zero-leak Bring Your Own Key security.
          </p>

          {/* Hero CTAs */}
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto mb-10">
            <a
              href="#download"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-base font-bold bg-amber-400 hover:bg-amber-300 text-neutral-950 shadow-xl shadow-amber-400/25 transition-all hover:scale-105"
            >
              <Download className="w-5 h-5" />
              <span>Download ZyperCode for Windows</span>
            </a>

            <button
              onClick={() => setVideoModalOpen(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl text-base font-semibold bg-neutral-900/90 hover:bg-neutral-800 text-white border border-neutral-700/80 backdrop-blur transition-all"
            >
              <Play className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span>Watch Demo</span>
            </button>
          </div>

          {/* Quick install snippet */}
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-lg bg-neutral-900/80 border border-neutral-800 font-mono text-xs text-neutral-400 max-w-full overflow-x-auto backdrop-blur">
            <span className="text-amber-400">$</span>
            <span className="truncate">git clone https://github.com/dvloperSarthak/ZyperCode.git</span>
            <button 
              onClick={copyInstallCommand} 
              className="text-neutral-400 hover:text-white transition-colors"
              title="Copy to clipboard"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </section>

      {/* Metrics Section */}
      <section className="border-y border-neutral-800/80 bg-neutral-900/40 backdrop-blur py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl sm:text-4xl font-extrabold text-white font-mono">&lt; 15ms</div>
              <div className="text-xs sm:text-sm text-neutral-400 mt-1">Terminal Latency</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-extrabold text-amber-400 font-mono">100%</div>
              <div className="text-xs sm:text-sm text-neutral-400 mt-1">BYOK Security</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-extrabold text-white font-mono">10+</div>
              <div className="text-xs sm:text-sm text-neutral-400 mt-1">AI Providers Supported</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-extrabold text-white font-mono">Open Source</div>
              <div className="text-xs sm:text-sm text-neutral-400 mt-1">Apache-2.0 License</div>
            </div>
          </div>
        </div>
      </section>

      {/* Showcase: Terminal */}
      <section id="terminal" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-neutral-800 bg-neutral-900 text-xs font-mono text-amber-400 mb-4">
            <Terminal className="w-3.5 h-3.5" /> GHOSTTY ACCELERATION
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">GPU-Powered Native Terminal</h2>
          <p className="text-neutral-400 text-base sm:text-lg">
            Built on native GPU rendering with sub-frame input responsiveness, truecolor support, and full shell multiplexing.
          </p>
        </div>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-2 sm:p-4 shadow-2xl backdrop-blur-sm overflow-hidden group">
          <div className="flex items-center gap-2 px-4 py-2 border-b border-neutral-800/80 mb-2">
            <div className="w-3 h-3 rounded-full bg-rose-500/80" />
            <div className="w-3 h-3 rounded-full bg-amber-500/80" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
            <span className="text-xs text-neutral-500 font-mono ml-2">zypercode-ghostty-terminal</span>
          </div>
          <img 
            src="/assets/terminal.webp" 
            alt="ZyperCode Terminal Showcase" 
            className="w-full rounded-xl object-cover shadow-inner group-hover:scale-[1.01] transition-transform duration-500" 
          />
        </div>
      </section>

      {/* Showcase: Intelligent Editor & Multi-Panes */}
      <section id="features" className="py-24 bg-neutral-900/30 border-y border-neutral-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center mb-24">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-neutral-800 bg-neutral-900 text-xs font-mono text-amber-400 mb-4">
                <Code2 className="w-3.5 h-3.5" /> INTELLIGENT CODE ENGINE
              </div>
              <h3 className="text-3xl font-bold text-white mb-4">CodeMirror 6 with Deep LSP Integration</h3>
              <p className="text-neutral-400 leading-relaxed mb-6">
                Engineered for speed and responsiveness. Features real-time AST linting, multi-cursor editing, automatic bracket matching, and full Language Server Protocol support across TypeScript, Rust, Go, Python, and CSS.
              </p>
              <ul className="space-y-3 text-sm text-neutral-300">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  Instant symbol navigation and autocomplete
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  Vim mode keybindings built-in
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  Sub-5ms cursor response latency
                </li>
              </ul>
            </div>
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-2 sm:p-3 shadow-2xl">
              <img src="/assets/editor.webp" alt="ZyperCode Intelligent Editor" className="w-full rounded-xl" />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1 rounded-2xl border border-neutral-800 bg-neutral-900 p-2 sm:p-3 shadow-2xl">
              <img src="/assets/ai_workflow.webp" alt="ZyperCode AI Agent Workflow" className="w-full rounded-xl" />
            </div>
            <div className="order-1 md:order-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-neutral-800 bg-neutral-900 text-xs font-mono text-amber-400 mb-4">
                <Bot className="w-3.5 h-3.5" /> AUTONOMOUS AI AGENTS
              </div>
              <h3 className="text-3xl font-bold text-white mb-4">Pair Programming with Live Diff Inspection</h3>
              <p className="text-neutral-400 leading-relaxed mb-6">
                Execute complex multi-file refactors, automated test generation, and intelligent bug investigations. Review side-by-side diffs before applying any code modifications to your repository.
              </p>
              <ul className="space-y-3 text-sm text-neutral-300">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  Supports Anthropic, OpenAI, Gemini, Groq, Cerebras & Ollama
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  Zero telemetry key storage in Windows Credential Manager
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  Context-aware indexing of active files & terminal buffers
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Toolkit: 12-Card Grid */}
      <section id="toolkit" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-neutral-800 bg-neutral-900 text-xs font-mono text-amber-400 mb-4">
            <Layers className="w-3.5 h-3.5" /> COMPLETE ARSENAL
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Everything Modern Engineers Need</h2>
          <p className="text-neutral-400 text-base sm:text-lg">
            No bloat, no slow webviews. Built for developers who live in their terminal and demand peak fluidity.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: Terminal, title: "Ghostty Accelerated", desc: "Native GPU rendering with sub-frame response latency and crystal-clear glyphs." },
            { icon: Bot, title: "AI Pair Programmer", desc: "Autonomous agent execution with interactive side-by-side diff review." },
            { icon: KeyRound, title: "Bring Your Own Key", desc: "Your API keys never touch our servers. Stored natively in Windows Credential Manager." },
            { icon: GitBranch, title: "Visual Source Control", desc: "Stage hunks, inspect branch graphs, and resolve merge conflicts visually." },
            { icon: Eye, title: "Live Web Preview", desc: "Embedded browser preview with instant hot-reload and DOM inspection." },
            { icon: Palette, title: "Adaptive Themes", desc: "Curated dark palettes including Catppuccin, Tokyo Night, Gruvbox, and Amber." },
            { icon: Command, title: "Fuzzy Command Palette", desc: "Navigate symbols, files, commands, and settings without lifting your hands from the keys." },
            { icon: Cpu, title: "High-Performance LSP", desc: "Language intelligence powered by native background server daemon processes." },
            { icon: Layers, title: "Flexible Split Panes", desc: "Tile terminal panes, editor buffers, and preview windows dynamically." },
            { icon: ShieldCheck, title: "Privacy First", desc: "No telemetry tracking, no analytics pings, zero cloud lock-in." },
            { icon: Box, title: "Standalone Portable", desc: "Run directly from USB or local folder without requiring administrative install." },
            { icon: Zap, title: "Sub-Second Startup", desc: "Cold boot in under 400ms. ZyperCode is ready to edit the moment you click." },
          ].map((item, idx) => (
            <div 
              key={idx} 
              className="p-6 rounded-2xl border border-neutral-800/80 bg-neutral-900/40 hover:bg-neutral-900/80 hover:border-amber-400/30 transition-all duration-300 group"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400 mb-4 group-hover:scale-110 transition-transform">
                <item.icon className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
              <p className="text-sm text-neutral-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Downloads Section */}
      <section id="download" className="py-24 bg-gradient-to-b from-neutral-900/50 to-neutral-950 border-t border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-400/30 bg-amber-400/10 text-amber-300 text-xs font-semibold mb-4">
              <Download className="w-3.5 h-3.5" /> RELEASE V1.0.1
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white mb-4">Download ZyperCode</h2>
            <p className="text-neutral-400 text-base sm:text-lg">
              Get the latest release for Windows. Choose between standard setup or zero-install portable.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Installer Card */}
            <div className="relative rounded-2xl border-2 border-amber-400/60 bg-neutral-900/90 p-8 shadow-2xl flex flex-col justify-between">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[11px] font-bold bg-amber-400 text-neutral-950 uppercase tracking-wider">
                Recommended
              </div>
              <div>
                <div className="w-12 h-12 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center mb-6">
                  <Laptop className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-1">Windows Installer</h3>
                <p className="text-xs text-neutral-400 font-mono mb-4">zypercode-v1.0.1-beta-installer.exe</p>
                <p className="text-sm text-neutral-300 mb-6">
                  Standard Windows setup wizard with start menu integration, desktop shortcut, and context menu support.
                </p>
              </div>
              <a
                href="https://github.com/dvloperSarthak/ZyperCode/releases/download/v1.0.1/zypercode-v1.0.1-beta-installer.exe"
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-amber-400 hover:bg-amber-300 text-neutral-950 shadow-lg shadow-amber-400/20 transition-all hover:scale-[1.02]"
              >
                <Download className="w-4 h-4" />
                <span>Download .exe (~5 MB)</span>
              </a>
            </div>

            {/* Standalone Card */}
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-8 shadow-xl flex flex-col justify-between hover:border-neutral-700 transition-colors">
              <div>
                <div className="w-12 h-12 rounded-xl bg-neutral-800 text-white flex items-center justify-center mb-6">
                  <Box className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-1">Standalone Portable</h3>
                <p className="text-xs text-neutral-400 font-mono mb-4">zypercode-v1.0.1-beta-standalone.exe</p>
                <p className="text-sm text-neutral-300 mb-6">
                  Single binary execution. No administrator rights required. Ideal for flash drives or isolated test environments.
                </p>
              </div>
              <a
                href="https://github.com/dvloperSarthak/ZyperCode/releases/download/v1.0.1/zypercode-v1.0.1-beta-standalone.exe"
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm bg-neutral-800 hover:bg-neutral-700 text-white transition-all hover:scale-[1.02]"
              >
                <Download className="w-4 h-4" />
                <span>Download Standalone (~4.8 MB)</span>
              </a>
            </div>

            {/* GitHub Releases */}
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-8 shadow-xl flex flex-col justify-between hover:border-neutral-700 transition-colors">
              <div>
                <div className="w-12 h-12 rounded-xl bg-neutral-800 text-white flex items-center justify-center mb-6">
                  <Github className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-1">Source Code & Releases</h3>
                <p className="text-xs text-neutral-400 font-mono mb-4">github.com/dvloperSarthak/ZyperCode</p>
                <p className="text-sm text-neutral-300 mb-6">
                  Inspect the source code, verify release checksums, build locally from source with Tauri, or contribute.
                </p>
              </div>
              <a
                href="https://github.com/dvloperSarthak/ZyperCode/releases/tag/v1.0.1"
                target="_blank"
                rel="noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm bg-neutral-800 hover:bg-neutral-700 text-white transition-all hover:scale-[1.02]"
              >
                <ExternalLink className="w-4 h-4" />
                <span>View v1.0.1 on GitHub</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Frequently Asked Questions</h2>
          <p className="text-neutral-400">Everything you need to know about ZyperCode.</p>
        </div>

        <div className="space-y-4">
          {[
            {
              q: "How does Bring Your Own Key (BYOK) work?",
              a: "ZyperCode does not route your AI requests through any intermediary server. When you input your API key (Anthropic, OpenAI, Gemini, Groq, Cerebras), it is encrypted and saved directly in Windows Credential Manager via native OS security APIs. Requests are dispatched directly to the provider."
            },
            {
              q: "Is ZyperCode free and open source?",
              a: "Yes! ZyperCode is licensed under the Apache-2.0 open-source license. You can audit every line of code, contribute improvements, or fork it freely on GitHub."
            },
            {
              q: "What makes the Ghostty terminal in ZyperCode so fast?",
              a: "Ghostty utilizes native GPU rendering pipelines and bypasses standard webview DOM terminal emulators (like xterm.js). It renders glyphs using hardware acceleration, bringing input latency down to sub-15ms."
            },
            {
              q: "Does ZyperCode work offline?",
              a: "Yes. All local editor features, file management, git operations, and local Ollama model integrations function completely offline without an internet connection."
            },
            {
              q: "Can I run extensions in ZyperCode?",
              a: "Yes. ZyperCode includes an opt-in VS Code-style extension system accessible via Settings → Extensions. You can install formatters (Prettier), linters (ESLint), themes, and language servers on demand."
            }
          ].map((item, idx) => (
            <div 
              key={idx} 
              className="border border-neutral-800 rounded-xl bg-neutral-900/40 overflow-hidden"
            >
              <button
                onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                className="w-full flex items-center justify-between p-6 text-left font-semibold text-white hover:text-amber-400 transition-colors"
              >
                <span>{item.q}</span>
                <ChevronDown className={`w-5 h-5 text-neutral-400 transition-transform ${activeFaq === idx ? "rotate-180 text-amber-400" : ""}`} />
              </button>
              {activeFaq === idx && (
                <div className="px-6 pb-6 text-sm text-neutral-300 leading-relaxed border-t border-neutral-800/60 pt-4">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-800/80 bg-neutral-950 py-12 text-sm text-neutral-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img src="/assets/zypercode_icon.png" alt="ZyperCode" className="w-6 h-6 rounded" />
            <span className="font-semibold text-white">ZyperCode</span>
            <span className="text-xs text-neutral-500">© {new Date().getFullYear()} Sarthak & Contributors</span>
          </div>

          <div className="flex items-center gap-6 text-xs text-neutral-400">
            <a href="https://github.com/dvloperSarthak/ZyperCode" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">GitHub</a>
            <a href="https://github.com/dvloperSarthak/ZyperCode/releases" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Releases</a>
            <a href="https://github.com/dvloperSarthak/ZyperCode/blob/main/LICENSE" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">License</a>
          </div>
        </div>
      </footer>

      {/* Demo Video Modal */}
      {videoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-4xl bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white text-lg flex items-center gap-2">
                <Play className="w-4 h-4 text-amber-400 fill-amber-400" /> ZyperCode Walkthrough & Features
              </h3>
              <button 
                onClick={() => setVideoModalOpen(false)}
                className="text-neutral-400 hover:text-white font-mono text-sm px-2 py-1 rounded bg-neutral-800"
              >
                ✕ Close
              </button>
            </div>
            <div className="aspect-video bg-neutral-950 rounded-xl overflow-hidden flex items-center justify-center border border-neutral-800">
              <img src="/assets/terminal.webp" alt="Video preview" className="w-full h-full object-cover" />
            </div>
            <div className="mt-4 flex justify-end">
              <a
                href="#download"
                onClick={() => setVideoModalOpen(false)}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold bg-amber-400 hover:bg-amber-300 text-neutral-950 transition-colors"
              >
                <Download className="w-4 h-4" /> Download ZyperCode v1.0.1
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
