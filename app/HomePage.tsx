"use client";

import { useState, useEffect, useRef } from "react";

type LogEntry = {
  time: string;
  context: string;
  level: string;
  message: string;
  data?: Record<string, unknown>;
};

export default function HomePage({ isDemo: isDemoMode }: { isDemo: boolean }) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [callId, setCallId] = useState("");
  const logsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logsContainerRef.current) {
      logsContainerRef.current.scrollTop =
        logsContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const runWorkflow = async () => {
    if (!isDemoMode && !callId.trim()) return;

    setLogs([]);
    setIsRunning(true);

    const timeout = setTimeout(() => setIsRunning(false), 120000);

    try {
      const body = isDemoMode
        ? {}
        : { callData: { metaData: { id: callId.trim(), title: "Test Call" } } };

      const res = await fetch("/api/gong-webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify(body),
      });

      const reader = res.body?.getReader();
      if (!reader) {
        setIsRunning(false);
        return;
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (value) buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === '"[DONE]"' || data === "[DONE]") {
              setIsRunning(false);
              continue;
            }
            try {
              const log = JSON.parse(data) as LogEntry;
              setLogs((prev) => [...prev, log]);

              if (
                log.context === "workflow" &&
                log.message === "Workflow complete"
              ) {
                setIsRunning(false);
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }

        if (done) break;
      }
    } catch (err) {
      console.error("Stream error:", err);
    } finally {
      clearTimeout(timeout);
      setIsRunning(false);
    }
  };

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("en-US", { hour12: false });

  const contextColorClasses = (context: string) => {
    switch (context) {
      case "workflow":
        return "bg-[#2e1065] text-[#c4b5fd]";
      case "agent":
        return "bg-[#022c22] text-[#6ee7b7]";
      case "bash":
        return "bg-[#1c1917] text-[#a8a29e]";
      case "bash-output":
        return "bg-[#1c1917] text-[#78716c]";
      case "sandbox":
        return "bg-[#172554] text-[#93c5fd]";
      case "transcript":
        return "bg-[#3f3f46] text-[#a1a1aa]";
      case "result":
        return "bg-[#365314] text-[#bef264]";
      default:
        return "bg-[#27272a] text-[#a1a1aa]";
    }
  };

  const levelIcon = (level: string) => {
    switch (level) {
      case "error":
        return "✕";
      case "warn":
        return "!";
      default:
        return null;
    }
  };

  const levelColorClass = (level: string) => {
    switch (level) {
      case "error":
        return "text-red-400";
      case "warn":
        return "text-amber-400";
      default:
        return "text-neutral-600";
    }
  };

  const messageColorClass = (level: string) => {
    switch (level) {
      case "error":
        return "text-red-400";
      case "warn":
        return "text-amber-400";
      default:
        return "text-neutral-300";
    }
  };

  return (
    <main className="h-screen box-border flex flex-col py-8 px-10 bg-gradient-to-b from-black to-[#0a0a0a] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-center gap-3 mb-6 shrink-0">
        <svg
          width="24"
          height="24"
          viewBox="0 0 76 65"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" fill="#fff" />
        </svg>
        <h1 className="text-2xl font-medium m-0 tracking-tight text-[#fafafa]">
          Sales Call Summary Agent
        </h1>
        <span className="bg-[#2e1065] text-[#c4b5fd] py-1 px-2.5 rounded-full text-[0.7rem] font-medium tracking-wide uppercase">
          Demo
        </span>
      </div>

      {/* Main Content */}
      <div className="max-w-[900px] w-full mx-auto flex-1 flex flex-col min-h-0">
        {/* Info Cards Row */}
        <div className="grid grid-cols-3 gap-3 mb-4 shrink-0">
          {/* Overview */}
          <div className="bg-[#111] rounded-[10px] border border-[#1f1f1f] py-3.5 px-4">
            <p className="text-[0.65rem] text-[#555] m-0 mb-1.5 uppercase tracking-[0.08em] font-semibold">
              Overview
            </p>
            <p className="text-[0.8rem] text-[#888] m-0 leading-relaxed">
              An AI agent that analyzes sales call transcripts and generates
              actionable insights. Built with{" "}
              <a
                href="https://sdk.vercel.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#888] underline underline-offset-2"
              >
                AI SDK
              </a>{" "}
              and{" "}
              <a
                href="https://vercel.com/docs/workflow"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#888] underline underline-offset-2"
              >
                Workflow
              </a>
              .
            </p>
          </div>

          {/* How it works */}
          <div className="bg-[#111] rounded-[10px] border border-[#1f1f1f] py-3.5 px-4">
            <p className="text-[0.65rem] text-[#555] m-0 mb-1.5 uppercase tracking-[0.08em] font-semibold">
              How it works
            </p>
            <p className="text-[0.8rem] text-[#888] m-0 leading-relaxed">
              Spins up an isolated{" "}
              <a
                href="https://vercel.com/docs/vercel-sandbox"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#888] underline underline-offset-2"
              >
                sandbox
              </a>{" "}
              with call data, then uses bash to explore transcripts, grep for
              key moments, and analyze context.
            </p>
          </div>

          {/* Agent Objective */}
          <div className="bg-[#111] rounded-[10px] border border-[#1f1f1f] py-3.5 px-4">
            <p className="text-[0.65rem] text-[#555] m-0 mb-1.5 uppercase tracking-[0.08em] font-semibold">
              Agent Objective
            </p>
            <p className="text-[0.8rem] text-[#888] m-0 leading-relaxed">
              Extract a structured summary, follow-up tasks with owners, and
              customer objections with handling scores.
            </p>
          </div>
        </div>

        {/* Terminal */}
        <div className="bg-[#0a0a0a] rounded-xl border border-[#1f1f1f] overflow-hidden flex flex-col flex-1 min-h-[200px] max-h-[800px]">
          {/* Terminal Header */}
          <div className="py-3 px-4 border-b border-[#1f1f1f] flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#333]" />
                <div className="w-3 h-3 rounded-full bg-[#333]" />
                <div className="w-3 h-3 rounded-full bg-[#333]" />
              </div>
              <span className="text-[0.8rem] text-[#666] ml-2">Agent Logs</span>
            </div>
            <div className="shrink-0">
              {isDemoMode === false ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter Gong Call ID"
                    value={callId}
                    onChange={(e) => setCallId(e.target.value)}
                    disabled={isRunning}
                    className="py-2.5 px-3.5 text-sm rounded-lg border border-[#333] bg-[#0a0a0a] text-[#ededed] w-[220px] outline-none transition-colors duration-150 focus:border-[#666]"
                  />
                  <button
                    onClick={runWorkflow}
                    disabled={isRunning || !callId.trim()}
                    className={`border-none rounded-lg py-1.5 px-3 text-sm font-medium transition-all duration-150 flex items-center gap-2 ${
                      isRunning || !callId.trim()
                        ? "bg-[#333] text-[#666] cursor-not-allowed"
                        : "bg-white text-black cursor-pointer"
                    }`}
                  >
                    {isRunning && (
                      <span className="inline-block w-3 h-3 border-2 border-[#666] border-t-transparent rounded-full animate-spin" />
                    )}
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    {isRunning ? "Running" : "Run"}
                  </button>
                </div>
              ) : (
                <button
                  onClick={runWorkflow}
                  disabled={isRunning || isDemoMode === null}
                  className={`border-none rounded-lg py-2.5 px-5 text-sm font-medium transition-all duration-150 flex items-center gap-2 ${
                    isRunning
                      ? "bg-[#333] text-[#666] cursor-not-allowed"
                      : "bg-white text-black cursor-pointer"
                  }`}
                >
                  {isRunning && (
                    <span className="inline-block w-3 h-3 border-2 border-[#666] border-t-transparent rounded-full animate-spin" />
                  )}
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  {isRunning ? "Running" : "Run Demo"}
                </button>
              )}
            </div>
          </div>

          {/* Terminal Content */}
          <div
            ref={logsContainerRef}
            className="p-4 flex-1 overflow-y-auto font-mono text-[0.85rem] leading-[1.7]"
          >
            {logs.length === 0 ? (
              <div className="text-[#444] text-center pt-[130px] text-[0.85rem]">
                {isDemoMode === false
                  ? 'Enter a Gong Call ID and click "Run" to start'
                  : 'Click "Run Demo" to start the agent'}
              </div>
            ) : (
              <>
                {logs.map((log, i) => (
                  <div
                    key={i}
                    className="mb-1.5 flex items-start gap-2.5 animate-fadeIn"
                  >
                    {levelIcon(log.level) && (
                      <span
                        className={`${levelColorClass(log.level)} font-medium w-3 shrink-0`}
                      >
                        {levelIcon(log.level)}
                      </span>
                    )}
                    <span className="text-[#555] shrink-0">
                      {formatTime(log.time)}
                    </span>
                    <span
                      className={`${contextColorClasses(log.context)} py-0.5 px-2 rounded text-xs font-medium shrink-0`}
                    >
                      {log.context}
                    </span>
                    <span
                      className={`${messageColorClass(log.level)} whitespace-pre-wrap break-words`}
                    >
                      {log.message}
                    </span>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="shrink-0 pt-6 pb-2 flex flex-col items-center gap-5">
        {/* Footer Links */}
        <div className="flex items-center gap-0">
          <a
            href="https://github.com/vercel-labs/call-summary-agent-with-sandbox"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#a1a1aa] text-[0.9rem] font-medium no-underline flex items-center gap-2.5 py-2 px-5 transition-colors duration-150 hover:text-[#fafafa]"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            GitHub Repository
          </a>

          <span className="text-[#333] text-xl">|</span>

          <a
            href="https://github.com/vercel-labs/call-summary-agent-with-sandbox/tree/main?tab=readme-ov-file#sales-call-summary-agent"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#a1a1aa] text-[0.9rem] font-medium no-underline flex items-center gap-2.5 py-2 px-5 transition-colors duration-150 hover:text-[#fafafa]"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            Documentation
          </a>

          <span className="text-[#333] text-xl">|</span>

          <a
            href="https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvercel-labs%2Fcall-summary-agent-with-sandbox"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#a1a1aa] text-[0.9rem] font-medium no-underline flex items-center gap-2.5 py-2 px-5 transition-colors duration-150 hover:text-[#fafafa]"
          >
            <svg width="16" height="16" viewBox="0 0 76 65" fill="currentColor">
              <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" />
            </svg>
            Deploy to Vercel
          </a>
        </div>

        {/* Copyright */}
        <p className="text-[#52525b] text-[0.85rem] m-0">
          © {new Date().getFullYear()} Vercel, Inc. All rights reserved.
        </p>
      </footer>
    </main>
  );
}
