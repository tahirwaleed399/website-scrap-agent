"use client";

import { useState, useRef, useCallback, useEffect } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ScrapeEvent {
  step: string;
  message: string;
  pageIndex?: number;
  total?: number;
  title?: string;
  currentUrl?: string;
  links?: string[];
  pages?: ScrapedPage[];
}

interface ScrapedPage {
  url: string;
  title: string;
  markdown: string;
}

interface LogEntry {
  id: number;
  type: "info" | "success" | "error" | "warning";
  message: string;
  time: string;
}

interface AgentRecord {
  agentId: string;
  agentName: string;
  voiceId: string;
  createdAt: string | null;
}

type FlowState = "idle" | "scraping" | "scraped" | "structuring" | "structured" | "deploying" | "deployed" | "error";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function nowStr() {
  return new Date().toLocaleTimeString("en-US", { hour12: false });
}

// ─── Dashboard page ───────────────────────────────────────────────────────────

export default function Home() {
  const [agents, setAgents] = useState<AgentRecord[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [callingAgent, setCallingAgent] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchAgents = useCallback(async () => {
    setLoadingAgents(true);
    try {
      const res = await fetch("/api/agents");
      const data = await res.json();
      setAgents(data.agents ?? []);
    } catch {
      setAgents([]);
    } finally {
      setLoadingAgents(false);
    }
  }, []);

  useEffect(() => { fetchAgents(); }, [fetchAgents]);

  async function deleteAgent(agentId: string) {
    setDeletingId(agentId);
    try {
      await fetch("/api/delete-agent", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId }),
      });
      setAgents((prev) => prev.filter((a) => a.agentId !== agentId));
    } finally {
      setDeletingId(null);
    }
  }

  function onAgentCreated(agent: AgentRecord) {
    setAgents((prev) => [agent, ...prev]);
    setShowCreate(false);
  }

  return (
    <div className="min-h-screen bg-clinic-canvas text-clinic-ink">
      {/* Header */}
      <header className="border-b border-clinic-olive-soft/30 bg-clinic-paper sticky top-0 z-10">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-lg bg-clinic-olive">
              <span className="text-clinic-acid text-sm font-black">PV</span>
            </div>
            <div>
              <h1 className="font-bold text-clinic-ink leading-none">PageToVoice</h1>
              <p className="text-xs text-clinic-muted mt-0.5">Turn your business landing page into a voice agent</p>
            </div>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-clinic-orange px-5 py-2.5 text-sm font-bold text-white hover:opacity-90 transition-opacity shadow-sm"
          >
            <span className="text-lg leading-none">+</span> Create Agent
          </button>
        </div>
      </header>

      {/* Hero / value prop */}
      <div className="border-b border-clinic-olive-soft/20 bg-clinic-paper">
        <div className="mx-auto max-w-6xl px-6 py-12 text-center">
          <span className="inline-block rounded-full bg-clinic-acid/40 px-3 py-1 text-xs font-bold text-clinic-ink mb-4">
            Business Landing Page → Voice, in minutes
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-normal tracking-[-0.03em] text-clinic-ink max-w-2xl mx-auto">
            Give every visitor a voice agent that knows your entire business
          </h2>
          <p className="mt-4 text-sm sm:text-base text-clinic-muted max-w-xl mx-auto leading-relaxed">
            Paste your landing page URL. We scrape it, structure every detail with AI, and deploy
            a phone-ready voice agent that can answer questions about your services, pricing, hours,
            and more — no scripting, no manual setup.
          </p>
          <div className="mt-7 flex items-center justify-center gap-8 text-xs font-bold text-clinic-muted">
            <span className="flex items-center gap-1.5"><span className="text-clinic-orange">1</span> Scrape your page</span>
            <span className="text-clinic-olive-soft">→</span>
            <span className="flex items-center gap-1.5"><span className="text-clinic-orange">2</span> AI structures it</span>
            <span className="text-clinic-olive-soft">→</span>
            <span className="flex items-center gap-1.5"><span className="text-clinic-orange">3</span> Voice agent goes live</span>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-6 py-10">
        {/* Agents grid */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-clinic-ink">Your Voice Agents</h2>
            <p className="text-sm text-clinic-muted mt-0.5">Each agent represents one business landing page, ready to talk to customers</p>
          </div>
          <button
            onClick={fetchAgents}
            disabled={loadingAgents}
            className="text-xs font-semibold text-clinic-muted hover:text-clinic-ink transition-colors disabled:opacity-40"
          >
            {loadingAgents ? "Refreshing…" : "↻ Refresh"}
          </button>
        </div>

        {loadingAgents ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 rounded-xl border border-clinic-olive-soft/20 bg-clinic-paper animate-pulse" />
            ))}
          </div>
        ) : agents.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-clinic-olive-soft/30 bg-clinic-paper py-20 text-center">
            <div className="grid size-16 place-items-center rounded-full bg-clinic-olive/10 mb-4">
              <span className="text-3xl">🤖</span>
            </div>
            <h3 className="font-bold text-clinic-ink text-lg">No voice agents yet</h3>
            <p className="text-sm text-clinic-muted mt-2 max-w-xs">
              Turn your business landing page into a voice agent your customers can talk to —
              paste a URL to get started.
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-clinic-orange px-6 py-3 text-sm font-bold text-white hover:opacity-90 transition-opacity"
            >
              <span>+</span> Create Your First Voice Agent
            </button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {agents.map((agent) => (
              <AgentCard
                key={agent.agentId}
                agent={agent}
                isCalling={callingAgent === agent.agentId}
                onCallStart={() => setCallingAgent(agent.agentId)}
                onCallEnd={() => setCallingAgent(null)}
                isDeleting={deletingId === agent.agentId}
                onDelete={() => deleteAgent(agent.agentId)}
              />
            ))}

            {/* Add more button */}
            <button
              onClick={() => setShowCreate(true)}
              className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-clinic-olive-soft/30 bg-clinic-paper py-10 hover:border-clinic-orange/40 hover:bg-clinic-orange/5 transition-colors group"
            >
              <div className="grid size-10 place-items-center rounded-full border-2 border-clinic-olive-soft/30 group-hover:border-clinic-orange/40 transition-colors">
                <span className="text-xl text-clinic-muted group-hover:text-clinic-orange transition-colors">+</span>
              </div>
              <span className="text-sm font-semibold text-clinic-muted group-hover:text-clinic-orange transition-colors">Create Agent</span>
            </button>
          </div>
        )}
      </main>

      {/* Create Agent Drawer */}
      {showCreate && (
        <CreateAgentDrawer
          onClose={() => setShowCreate(false)}
          onCreated={onAgentCreated}
        />
      )}
    </div>
  );
}

// ─── Agent Card ───────────────────────────────────────────────────────────────

function AgentCard({ agent, isCalling, onCallStart, onCallEnd, isDeleting, onDelete }: {
  agent: AgentRecord;
  isCalling: boolean;
  onCallStart: () => void;
  onCallEnd: () => void;
  isDeleting: boolean;
  onDelete: () => void;
}) {
  const businessName = agent.agentName.replace(" Voice Agent", "");
  const initials = businessName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="flex flex-col rounded-xl border border-clinic-olive-soft/30 bg-clinic-paper p-5 shadow-sm">
      {/* Top row */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="grid size-11 shrink-0 place-items-center rounded-full bg-clinic-olive text-clinic-acid font-black text-sm">
            {initials}
          </div>
          <div>
            <h3 className="font-bold text-clinic-ink text-sm leading-tight">{businessName}</h3>
            <p className="text-xs text-clinic-muted mt-0.5">Voice: {agent.voiceId}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="size-2 rounded-full bg-green-500" />
          <span className="text-xs font-semibold text-green-700">Live</span>
        </div>
      </div>

      {/* Agent ID */}
      <p className="text-xs font-mono text-clinic-muted/70 bg-clinic-canvas rounded px-2 py-1 truncate mb-4">
        {agent.agentId}
      </p>

      {/* Actions */}
      <div className="mt-auto flex gap-2">
        <RetellCallButton
          agentId={agent.agentId}
          isCalling={isCalling}
          onCallStart={onCallStart}
          onCallEnd={onCallEnd}
        />
        <button
          onClick={onDelete}
          disabled={isDeleting}
          title="Delete agent"
          className="rounded-lg border border-clinic-olive-soft/30 px-3 py-2 text-xs font-bold text-clinic-muted hover:border-red-300 hover:text-red-500 transition-colors disabled:opacity-40"
        >
          {isDeleting ? "…" : "Delete"}
        </button>
      </div>
    </div>
  );
}

// ─── Retell Call Button ───────────────────────────────────────────────────────

function RetellCallButton({ agentId, isCalling, onCallStart, onCallEnd }: {
  agentId: string;
  isCalling: boolean;
  onCallStart: () => void;
  onCallEnd: () => void;
}) {
  const [status, setStatus] = useState<"idle" | "connecting" | "connected" | "ended">("idle");
  const [error, setError] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const callRef = useRef<any>(null);

  async function startCall() {
    setStatus("connecting");
    setError(null);
    onCallStart();
    try {
      const { RetellWebClient } = await import("retell-client-js-sdk");
      const client = new RetellWebClient();
      callRef.current = client;

      const tokenRes = await fetch("/api/retell-web-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId }),
      });
      const tokenData = await tokenRes.json();
      if (!tokenRes.ok) throw new Error(tokenData.error ?? "Failed to get call token");

      client.on("call_started", () => setStatus("connected"));
      client.on("call_ended", () => { setStatus("ended"); callRef.current = null; onCallEnd(); });
      client.on("error", (e: Error) => { setError(e.message); setStatus("idle"); onCallEnd(); });

      await client.startCall({ accessToken: tokenData.accessToken });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start call");
      setStatus("idle");
      onCallEnd();
    }
  }

  async function endCall() {
    if (callRef.current) { callRef.current.stopCall(); callRef.current = null; }
    setStatus("ended");
    onCallEnd();
  }

  if (status === "idle" || status === "ended") {
    return (
      <button
        onClick={startCall}
        disabled={isCalling && status === "idle"}
        className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-clinic-olive px-4 py-2 text-xs font-bold text-clinic-acid hover:opacity-90 transition-opacity disabled:opacity-40"
      >
        📞 {status === "ended" ? "Call Again" : "Talk to Agent"}
      </button>
    );
  }

  if (status === "connecting") {
    return (
      <div className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-clinic-canvas px-4 py-2 text-xs text-clinic-muted">
        <div className="size-3 border border-clinic-orange border-t-transparent rounded-full animate-spin" />
        Connecting…
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center gap-2">
      <div className="flex items-center gap-1.5 text-xs font-bold text-green-700 flex-1">
        <span className="size-2 rounded-full bg-green-500 animate-pulse" />
        Live
      </div>
      <button
        onClick={endCall}
        className="rounded-lg bg-red-500 px-3 py-2 text-xs font-bold text-white hover:bg-red-600 transition-colors"
      >
        End
      </button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

// ─── Create Agent Drawer ──────────────────────────────────────────────────────

function CreateAgentDrawer({ onClose, onCreated }: {
  onClose: () => void;
  onCreated: (agent: AgentRecord) => void;
}) {
  const [url, setUrl] = useState("");
  const [flowState, setFlowState] = useState<FlowState>("idle");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [scrapedPages, setScrapedPages] = useState<ScrapedPage[]>([]);
  const [structured, setStructured] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const logIdRef = useRef(0);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const addLog = useCallback((message: string, type: LogEntry["type"] = "info") => {
    setLogs((prev) => {
      const entry: LogEntry = { id: ++logIdRef.current, type, message, time: nowStr() };
      const next = [...prev, entry];
      setTimeout(() => logsEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
      return next;
    });
  }, []);

  // ── Step 1: Scrape ──────────────────────────────────────────────────────────
  async function runScrape() {
    if (!url.trim()) return;
    setFlowState("scraping");
    setError(null);
    setLogs([]);
    setScrapedPages([]);
    setStructured(null);
    addLog(`Starting scrape for ${url}`, "info");

    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let finalPages: ScrapedPage[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event: ScrapeEvent = JSON.parse(line.slice(6));
            if (event.step === "error") { addLog(event.message, "error"); }
            else if (event.step === "scraped") { addLog(`✓ ${event.message}`, "success"); }
            else if (event.step === "done" && event.pages) { finalPages = event.pages; }
            else { addLog(event.message, "info"); }
          } catch { /* skip */ }
        }
      }

      if (finalPages.length === 0) throw new Error("No pages returned from scraper");
      setScrapedPages(finalPages);
      setFlowState("scraped");
      addLog(`Done — ${finalPages.length} page(s) ready.`, "success");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(msg);
      setFlowState("error");
      addLog(`Failed: ${msg}`, "error");
    }
  }

  // ── Step 2: Structure ───────────────────────────────────────────────────────
  async function runStructure() {
    setFlowState("structuring");
    addLog("Sending to OpenAI GPT-4o for structuring…", "info");
    try {
      const res = await fetch("/api/structure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pages: scrapedPages }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Structuring failed");
      addLog(`Structured — ${data.tokensUsed?.toLocaleString() ?? "?"} tokens used`, "success");
      setStructured(data.structured);
      setFlowState("structured");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(msg);
      setFlowState("error");
      addLog(`Failed: ${msg}`, "error");
    }
  }

  // ── Step 3: Deploy ──────────────────────────────────────────────────────────
  async function runDeploy() {
    setFlowState("deploying");
    addLog("Creating Retell AI LLM + voice agent…", "info");
    try {
      const res = await fetch("/api/deploy-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ structured, websiteUrl: url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Deploy failed");
      addLog(`Agent deployed! ID: ${data.agentId}`, "success");
      setFlowState("deployed");
      onCreated({
        agentId: data.agentId,
        agentName: data.agentName,
        voiceId: data.voiceId,
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(msg);
      setFlowState("error");
      addLog(`Failed: ${msg}`, "error");
    }
  }

  const isLoading = flowState === "scraping" || flowState === "structuring" || flowState === "deploying";

  const steps: { key: FlowState; label: string; done: FlowState[] }[] = [
    { key: "scraping", label: "Scrape", done: ["scraped", "structuring", "structured", "deploying", "deployed"] },
    { key: "structuring", label: "Structure", done: ["structured", "deploying", "deployed"] },
    { key: "deploying", label: "Deploy", done: ["deployed"] },
  ];

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-20 bg-clinic-ink/40 backdrop-blur-sm" onClick={!isLoading ? onClose : undefined} />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-30 w-full max-w-xl bg-clinic-paper shadow-2xl flex flex-col">
        {/* Drawer header */}
        <div className="flex items-center justify-between border-b border-clinic-olive-soft/20 px-6 py-4">
          <div>
            <h2 className="font-bold text-clinic-ink text-lg">Turn a Landing Page Into a Voice Agent</h2>
            <p className="text-xs text-clinic-muted mt-0.5">Scrape your page → AI structures it → Voice agent goes live</p>
          </div>
          {!isLoading && (
            <button onClick={onClose} className="text-clinic-muted hover:text-clinic-ink transition-colors text-xl leading-none">✕</button>
          )}
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-0 border-b border-clinic-olive-soft/20 px-6 py-3">
          {steps.map((step, i) => {
            const isDone = step.done.includes(flowState);
            const isActive = flowState === step.key || (step.key === "scraping" && flowState === "scraped");
            return (
              <div key={step.key} className="flex items-center">
                <div className={`flex items-center gap-1.5 text-xs font-bold px-2 py-1 rounded-full transition-colors ${isDone ? "bg-clinic-olive text-clinic-acid" : isActive ? "bg-clinic-orange text-white" : "text-clinic-muted"}`}>
                  <span className="size-4 grid place-items-center rounded-full border border-current text-[10px]">
                    {isDone ? "✓" : i + 1}
                  </span>
                  {step.label}
                </div>
                {i < steps.length - 1 && <span className="text-clinic-olive-soft/50 mx-1">→</span>}
              </div>
            );
          })}
        </div>

        {/* Drawer body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* URL Input */}
          <div>
            <label className="text-xs font-bold text-clinic-muted uppercase tracking-wider mb-2 block">Your Business Landing Page URL</label>
            <div className="flex gap-2">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && flowState === "idle" && runScrape()}
                placeholder="https://yourbusiness.com"
                disabled={isLoading || flowState !== "idle"}
                className="flex-1 rounded-lg border border-clinic-olive-soft/40 bg-clinic-canvas px-3 py-2.5 text-sm text-clinic-ink placeholder:text-clinic-muted focus:outline-none focus:ring-2 focus:ring-clinic-orange/40 disabled:opacity-50"
              />
              {flowState === "idle" && (
                <button
                  onClick={runScrape}
                  disabled={!url.trim()}
                  className="rounded-lg bg-clinic-olive px-4 py-2.5 text-sm font-bold text-clinic-acid disabled:opacity-40 hover:opacity-90 transition-opacity"
                >
                  Scrape
                </button>
              )}
            </div>
          </div>

          {/* Action buttons */}
          {flowState === "scraped" && (
            <button onClick={runStructure} className="w-full rounded-lg bg-clinic-orange py-3 text-sm font-bold text-white hover:opacity-90 transition-opacity">
              Structure with OpenAI →
            </button>
          )}
          {flowState === "structured" && (
            <button onClick={runDeploy} className="w-full rounded-lg bg-clinic-olive py-3 text-sm font-bold text-clinic-acid hover:opacity-90 transition-opacity">
              Deploy to Retell AI →
            </button>
          )}
          {(flowState === "error") && (
            <button onClick={() => { setFlowState("idle"); setError(null); setLogs([]); setUrl(""); }} className="w-full rounded-lg border border-clinic-olive-soft/30 py-3 text-sm font-bold text-clinic-muted hover:bg-clinic-canvas transition-colors">
              ↺ Start Over
            </button>
          )}

          {/* Loading spinner */}
          {isLoading && (
            <div className="flex items-center gap-3 text-sm text-clinic-muted">
              <div className="size-4 border-2 border-clinic-orange border-t-transparent rounded-full animate-spin shrink-0" />
              <span>
                {flowState === "scraping" && "Scraping with Firecrawl stealth mode…"}
                {flowState === "structuring" && "GPT-4o is extracting all business details…"}
                {flowState === "deploying" && "Creating LLM config and voice agent on Retell…"}
              </span>
            </div>
          )}

          {/* Log console */}
          {logs.length > 0 && (
            <div className="rounded-lg bg-clinic-canvas border border-clinic-olive-soft/20 p-4 max-h-56 overflow-y-auto space-y-1.5">
              {logs.map((entry) => (
                <div key={entry.id} className={`flex items-start gap-2 text-xs font-mono ${entry.type === "success" ? "text-green-700" : entry.type === "error" ? "text-red-600" : entry.type === "warning" ? "text-clinic-orange" : "text-clinic-muted"}`}>
                  <span className="shrink-0">{entry.type === "success" ? "✓" : entry.type === "error" ? "✕" : entry.type === "warning" ? "⚠" : "›"}</span>
                  <span className="text-clinic-olive-soft shrink-0">{entry.time}</span>
                  <span>{entry.message}</span>
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          )}

          {/* Scraped pages summary */}
          {scrapedPages.length > 0 && (
            <div className="rounded-lg border border-clinic-olive-soft/20 bg-clinic-canvas p-4">
              <p className="text-xs font-bold text-clinic-muted uppercase tracking-wider mb-2">Scraped Content</p>
              {scrapedPages.map((p, i) => (
                <div key={i} className="flex items-center gap-2 text-sm py-1">
                  <span className="size-5 grid place-items-center rounded-full bg-clinic-olive text-clinic-acid text-[10px] font-bold shrink-0">{i + 1}</span>
                  <span className="text-clinic-ink font-medium truncate">{p.title || p.url}</span>
                  <span className="text-xs text-clinic-muted ml-auto shrink-0">{p.markdown.length.toLocaleString()}c</span>
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700 font-mono">
              {error}
            </div>
          )}

          {/* Structured data preview */}
          {structured && (
            <div className="rounded-lg border border-clinic-olive-soft/20 bg-clinic-canvas p-4">
              <p className="text-xs font-bold text-clinic-muted uppercase tracking-wider mb-2">Extracted Data Preview</p>
              <div className="space-y-1.5">
                {Object.entries(structured).map(([key, val]) => {
                  if (!val || (Array.isArray(val) && val.length === 0)) return null;
                  const display = typeof val === "string" ? val.slice(0, 80) : Array.isArray(val) ? `${val.length} items` : typeof val === "object" ? JSON.stringify(val).slice(0, 80) : String(val);
                  return (
                    <div key={key} className="flex gap-2 text-xs">
                      <span className="text-clinic-muted font-semibold shrink-0 capitalize">{key.replace(/([A-Z])/g, " $1")}:</span>
                      <span className="text-clinic-ink truncate">{display}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
