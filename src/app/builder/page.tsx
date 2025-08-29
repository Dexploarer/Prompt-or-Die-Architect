"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MarkdownView } from "../components/MarkdownView";
import { AgentPanel } from "../components/AgentPanel";
import { LivePreview } from "../components/LivePreview";
import { DocActions } from "../components/DocActions";
import { StackConfig } from "@/types/graph";

const frameworks = {
  web: ["nextjs", "react", "vue", "svelte", "solid"],
  mobile: ["react-native", "flutter", "ionic"],
  backend: ["hono", "fastapi", "express", "elysia", "gin"],
  blockchain: ["hardhat", "anchor", "foundry"],
  ai: ["langchain", "autogen", "llamaindex"]
};

const databases = ["postgres", "mysql", "sqlite", "mongodb", "supabase", "planetscale"];
const auth = ["clerk", "nextauth", "supabase-auth", "better-auth"];
const styling = ["tailwind", "styled-components", "emotion", "chakra"];

export default function StackBuilder() {
  const [config, setConfig] = useState<Partial<StackConfig>>({
    type: "web",
    framework: "nextjs" as any,
  });
  const [requirements, setRequirements] = useState("");
  const [recommendation, setRecommendation] = useState<any>(null);
  const [plan, setPlan] = useState<any>(null);
  const [scaffold, setScaffold] = useState<any>(null);
  const [docs, setDocs] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const params = useSearchParams();
  useEffect(() => {
    const idea = params?.get("idea");
    if (idea) setRequirements(idea);
  }, [params]);

  async function getRecommendation() {
    try {
      setError(null);
      setBusy(true);
      const r = await fetch("/api/stack/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requirements }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const rec = await r.json();
      setRecommendation(rec);
    } catch (e: any) {
      setError(e?.message || "Failed to get recommendation");
    } finally {
      setBusy(false);
    }
  }

  async function generatePlan() {
    try {
      setError(null);
      setBusy(true);
      const r = await fetch("/api/project/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea: requirements, stack: config }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const p = await r.json();
      setPlan(p);
    } catch (e: any) {
      setError(e?.message || "Failed to generate plan");
    } finally {
      setBusy(false);
    }
  }

  async function generateScaffold() {
    try {
      setError(null);
      setBusy(true);
      const r = await fetch("/api/scaffold/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, stack: config }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const s = await r.json();
      setScaffold(s);
    } catch (e: any) {
      setError(e?.message || "Failed to generate scaffold");
    } finally {
      setBusy(false);
    }
  }

  async function exportJson() {
    const data = { config, recommendation, plan, scaffold };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${(plan?.title || 'project')}-bundle.json`; a.click();
    URL.revokeObjectURL(url);
  }

  async function generateDocs() {
    setBusy(true);
    const r = await fetch("/api/docs/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    const d = await r.json();
    setDocs(d.markdown || "");
    setBusy(false);
  }

  async function exportDocsPdf() {
    const r = await fetch("/api/docs/export-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan, markdown: docs })
    });
    if (!r.ok) return alert("Failed to export PDF");
    const blob = await r.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${(plan?.title || 'docs').replace(/\s+/g, '-')}.pdf`; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Stack Builder</h1>
          <p className="text-neutral-400 mt-2">Configure your tech stack and generate a complete project</p>
        </div>

        {error && (
          <div className="glass p-3 text-sm text-red-300">{error}</div>
        )}
        {/* Requirements Input */}
        <div className="glass p-6">
          <h2 className="text-xl font-semibold mb-4">Project Requirements</h2>
          <textarea
            value={requirements}
            onChange={(e) => setRequirements(e.target.value)}
            className="w-full h-32 glass p-4 outline-none"
            placeholder="Describe your project idea, requirements, scale, team size, etc..."
          />
          <button onClick={getRecommendation} disabled={busy} className="mt-4 glass px-6 py-2">
            {busy ? "Analyzing..." : "Get Stack Recommendation"}
          </button>
        </div>

        {/* Stack Selection */}
        <div className="glass p-6">
          <h2 className="text-xl font-semibold mb-4">Tech Stack Configuration</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Project Type</label>
              <select
                value={config.type}
                onChange={(e) => setConfig({ ...config, type: e.target.value as any })}
                className="w-full glass p-2 outline-none"
              >
                <option value="web">Web Application</option>
                <option value="mobile">Mobile App</option>
                <option value="backend">Backend API</option>
                <option value="blockchain">Blockchain</option>
                <option value="ai">AI/ML</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Framework</label>
              <select
                value={config.framework}
                onChange={(e) => setConfig({ ...config, framework: e.target.value as any })}
                className="w-full glass p-2 outline-none"
              >
                {frameworks[config.type || "web"]?.map((fw) => (
                  <option key={fw} value={fw}>{fw}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Database</label>
              <select
                value={config.database || ""}
                onChange={(e) => setConfig({ ...config, database: e.target.value as any })}
                className="w-full glass p-2 outline-none"
              >
                <option value="">None</option>
                {databases.map((db) => (
                  <option key={db} value={db}>{db}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Authentication</label>
              <select
                value={config.auth || ""}
                onChange={(e) => setConfig({ ...config, auth: e.target.value as any })}
                className="w-full glass p-2 outline-none"
              >
                <option value="">None</option>
                {auth.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Styling</label>
              <select
                value={config.styling || ""}
                onChange={(e) => setConfig({ ...config, styling: e.target.value as any })}
                className="w-full glass p-2 outline-none"
              >
                <option value="">None</option>
                {styling.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* AI Recommendation */}
        {recommendation && (
          <div className="glass p-6">
            <h2 className="text-xl font-semibold mb-4">AI Recommendation</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium">Frontend</h3>
                <p className="text-sm text-neutral-300">{recommendation.frontend?.framework}</p>
                <ul className="text-xs text-neutral-400 mt-1">
                  {recommendation.frontend?.reasons?.map((r: string, i: number) => (
                    <li key={i}>• {r}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-medium">Backend</h3>
                <p className="text-sm text-neutral-300">{recommendation.backend?.framework}</p>
                <ul className="text-xs text-neutral-400 mt-1">
                  {recommendation.backend?.reasons?.map((r: string, i: number) => (
                    <li key={i}>• {r}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Action Bar */}
        <div className="flex flex-wrap gap-4 items-center">
          <button onClick={generatePlan} disabled={busy} className="glass px-6 py-3">
            {busy ? "Planning..." : "Generate Project Plan"}
          </button>
          {plan && (
            <button onClick={generateScaffold} disabled={busy} className="glass px-6 py-3">
              {busy ? "Scaffolding..." : "Generate Code"}
            </button>
          )}
          {plan && (
            <>
              <button onClick={generateDocs} disabled={busy} className="glass px-6 py-3">{busy ? "Drafting..." : "Generate Docs"}</button>
              <button onClick={exportJson} className="glass px-6 py-3">Export JSON</button>
            </>
          )}
        </div>

        <div className="grid md:grid-cols-4 gap-6">
          <div className="md:col-span-1 order-last md:order-first space-y-4">
            <AgentPanel
              sections={[
                { name: "Tech Stack", progress: recommendation ? 100 : 30 },
                { name: "User Flow", progress: plan?.userFlows?.length ? 100 : 20 },
                { name: "User Stories", progress: plan?.userStories?.length ? 100 : 20 },
                { name: "Frontend Map", progress: scaffold?.files ? 50 : 10 },
                { name: "Backend Map", progress: scaffold?.files ? 40 : 10 },
                { name: "Sub Tasks", progress: plan ? 60 : 10 },
              ]}
            />
          </div>
          <div className="md:col-span-3 space-y-6">
        {/* Plan Display */}
        {plan && (
          <div className="glass p-6">
            <h2 className="text-xl font-semibold mb-4">Project Plan</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">{plan.title}</h3>
                <p className="text-sm text-neutral-300">{plan.description}</p>
              </div>
              <DocActions plan={plan} />

              {plan.userFlows?.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">User Flows</h3>
                  <div className="grid md:grid-cols-2 gap-3">
                    {plan.userFlows.slice(0, 6).map((f: any, i: number) => (
                      <div key={i} className="glass p-3 flex items-center justify-between">
                        <div>
                          <div className="text-sm font-semibold">{f.name}</div>
                          <div className="text-xs opacity-80 mt-1">{f.steps?.length || 0} steps</div>
                        </div>
                        <div className="text-[10px] px-2 py-1 rounded-full bg-white/10">$ {Math.max(1, (f.steps?.length || 1)) * 70}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {plan.userStories?.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">Story Completeness</h3>
                  <div className="text-xs opacity-80 mb-2">{plan.userStories.length} total stories</div>
                  <div className="grid md:grid-cols-3 gap-3">
                    {plan.userStories.slice(0, 9).map((s: any, i: number) => (
                      <div key={i} className="glass p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium truncate">{s.title}</span>
                          <span className="text-xs px-2 py-0.5 bg-white/10 rounded">{s.priority}</span>
                        </div>
                        <div className="mt-2 h-1.5 bg-white/10 rounded">
                          <div className="h-1.5 bg-white/60 rounded" style={{ width: `${Math.min(100, (s.acceptanceCriteria?.length || 0) * 20)}%` }} />
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <div className="text-[10px] opacity-70">AC: {s.acceptanceCriteria?.length || 0}</div>
                          <div className="text-[10px] px-2 py-0.5 rounded-full bg-white/10">~{s.estimate}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {plan.userStories?.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">User Stories</h3>
                  <div className="space-y-2">
                    {plan.userStories.slice(0, 5).map((story: any, i: number) => (
                      <div key={i} className="glass p-3">
                        <div className="flex justify-between items-start">
                          <span className="text-sm font-medium">{story.title}</span>
                          <span className="text-xs px-2 py-1 bg-blue-500/20 rounded">{story.priority}</span>
                        </div>
                        <p className="text-xs text-neutral-400 mt-1">{story.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Docs Display */}
        {docs && (
          <div className="glass p-6">
            <h2 className="text-xl font-semibold mb-4">Generated Docs</h2>
            <div className="mb-3">
              <button onClick={exportDocsPdf} className="glass px-4 py-2 rounded-lg">Export PDF from Docs</button>
            </div>
            <MarkdownView markdown={docs} />
            <div className="mt-4 flex items-center justify-end gap-3 text-xs opacity-80">
              <span className="px-2 py-1 rounded-full bg-white/10">$ {plan?.userStories?.length ? plan.userStories.length * 120 : 3200}</span>
              <span className="px-2 py-1 rounded-full bg-white/10">Est. {plan?.userStories?.length ? Math.ceil(plan.userStories.length / 3) : 12}d</span>
              <span className="px-2 py-1 rounded-full bg-white/10">Analytics</span>
            </div>
          </div>
        )}
            {plan && (
              <LivePreview plan={plan} />
            )}
          </div>
        </div>

        {/* Scaffold Display */}
        {scaffold && (
          <div className="glass p-6">
            <h2 className="text-xl font-semibold mb-4">Generated Code</h2>
            <div className="space-y-4">
              {scaffold.files?.slice(0, 10).map((file: any, i: number) => (
                <div key={i} className="glass p-3">
                  <div className="font-medium text-sm">{file.path}</div>
                  <pre className="text-xs text-neutral-400 mt-2 overflow-x-auto">
                    {file.content.substring(0, 200)}...
                  </pre>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
