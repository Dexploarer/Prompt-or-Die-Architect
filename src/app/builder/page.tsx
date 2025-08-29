"use client";

import React, { useState } from "react";
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
  const [busy, setBusy] = useState(false);

  async function getRecommendation() {
    setBusy(true);
    const r = await fetch("/api/stack/recommend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requirements }),
    });
    const rec = await r.json();
    setRecommendation(rec);
    setBusy(false);
  }

  async function generatePlan() {
    setBusy(true);
    const r = await fetch("/api/project/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idea: requirements, stack: config }),
    });
    const p = await r.json();
    setPlan(p);
    setBusy(false);
  }

  async function generateScaffold() {
    setBusy(true);
    const r = await fetch("/api/scaffold/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan, stack: config }),
    });
    const s = await r.json();
    setScaffold(s);
    setBusy(false);
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Stack Builder</h1>
          <p className="text-neutral-400 mt-2">Configure your tech stack and generate a complete project</p>
        </div>

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

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button onClick={generatePlan} disabled={busy} className="glass px-6 py-3">
            {busy ? "Planning..." : "Generate Project Plan"}
          </button>
          {plan && (
            <button onClick={generateScaffold} disabled={busy} className="glass px-6 py-3">
              {busy ? "Scaffolding..." : "Generate Code"}
            </button>
          )}
        </div>

        {/* Plan Display */}
        {plan && (
          <div className="glass p-6">
            <h2 className="text-xl font-semibold mb-4">Project Plan</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">{plan.title}</h3>
                <p className="text-sm text-neutral-300">{plan.description}</p>
              </div>
              
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
