"use client";

import React, { useCallback, useRef, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  Connection,
  Edge,
  Node,
  useNodesState,
  useEdgesState,
} from "reactflow";
import "reactflow/dist/style.css";
import { layout } from "@/lib/layout";
import { Graph } from "@/types/graph";
import { v4 as uuid } from "uuid";
import * as htmlToImage from "html-to-image";

type Kind = "service" | "db" | "queue" | "page" | "step";

function GlassNode({ data }: { data: { label: string; kind: Kind } }) {
  const badge = { service: "🔧", db: "🗄️", queue: "📮", page: "📄", step: "⚙️" }[data.kind];
  return (
    <div className="glass px-4 py-3 min-w-[180px]">
      <div className="text-xs opacity-80">{badge} {data.kind}</div>
      <div className="text-sm font-semibold">{data.label}</div>
    </div>
  );
}

const nodeTypes = { glass: GlassNode };

export default function Home() {
  const [idea, setIdea] = useState("An AI planning app that turns text into graphs and suggests architecture.");
  const [goal, setGoal] = useState("Make it multi-tenant, add audit log service, add cache.");
  const [rfNodes, setNodes, onNodesChange] = useNodesState<Node[]>([]);
  const [rfEdges, setEdges, onEdgesChange] = useEdgesState<Edge[]>([]);
  const ref = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);

  const toRF = useCallback(async (g: Graph) => {
    const pos = await layout(g);
    const nodes: Node[] = g.nodes.map((n) => ({
      id: n.id,
      type: "glass",
      data: { label: n.label, kind: (n.kind ?? "service") as Kind },
      position: pos[n.id] ?? { x: 0, y: 0 },
    }));
    const edges: Edge[] = g.edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      label: e.label,
      animated: true,
    }));
    setNodes(nodes);
    setEdges(edges);
  }, [setNodes, setEdges]);

  async function fromText() {
    setBusy(true);
    const r = await fetch("/api/graph/from-text", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: idea }),
    });
    const g = (await r.json()) as Graph;
    await toRF(g);
    setBusy(false);
  }

  async function suggest() {
    setBusy(true);
    const graph: Graph = {
      nodes: rfNodes.map((n) => ({ id: n.id, label: (n.data as any).label, kind: (n.data as any).kind })),
      edges: rfEdges.map((e) => ({ id: e.id, source: e.source, target: e.target, label: e.label })),
    };
    const r = await fetch("/api/graph/suggest", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ graph, goal }),
    });
    const g = (await r.json()) as Graph;
    await toRF(g);
    setBusy(false);
  }

  const onConnect = useCallback((c: Connection) => setEdges((eds) => addEdge({ ...c, animated: true }, eds)), [setEdges]);

  async function exportPng() {
    if (!ref.current) return;
    const dataUrl = await htmlToImage.toPng(ref.current, { pixelRatio: 2 });
    const a = document.createElement("a");
    a.href = dataUrl; a.download = "diagram.png"; a.click();
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-6xl mx-auto grid gap-4 md:grid-cols-3">
        <section className="md:col-span-1 space-y-3">
          <h1 className="text-2xl font-bold">Prompt or Die: The Architect</h1>
          <div className="text-xs opacity-70 mb-4">
            AI-powered project planning and code generation
          </div>
          
          <textarea value={idea} onChange={(e) => setIdea(e.target.value)}
            className="w-full h-28 glass p-3 outline-none" placeholder="Paste idea or spec..." />
          <button onClick={fromText} disabled={busy} className="w-full glass p-3">
            {busy ? "Generating..." : "Generate Architecture"}
          </button>
          
          <textarea value={goal} onChange={(e) => setGoal(e.target.value)}
            className="w-full h-24 glass p-3 outline-none" placeholder="Goal or constraint for suggestions..." />
          <button onClick={suggest} disabled={busy} className="w-full glass p-3">
            {busy ? "Suggesting..." : "Suggest Improvements"}
          </button>
          
          <button onClick={exportPng} className="w-full glass p-3">Export PNG</button>
          
          <div className="glass p-3">
            <div className="text-sm font-semibold mb-2">Quick Prompts</div>
            <div className="space-y-1 text-xs">
              <button 
                onClick={() => setIdea("Create a step by step user journey for a SaaS onboarding, include auth, email verify, profile setup, paywall, dashboard, usage tracking. Label edges with actions.")}
                className="w-full text-left p-1 hover:bg-white/10 rounded"
              >
                📊 SaaS Onboarding Flow
              </button>
              <button 
                onClick={() => setIdea("Design a scalable web architecture for multi tenant AI content platform. Include Next.js web, Hono API, worker queue, Redis cache, Postgres, object storage, vector DB, analytics, feature flags.")}
                className="w-full text-left p-1 hover:bg-white/10 rounded"
              >
                🏗️ Multi-tenant AI Platform
              </button>
              <button 
                onClick={() => setIdea("Solana app with Anchor program for staking, a webhook listener, an indexer, and a web client. Include program accounts, client SDK, RPC provider, and dashboards.")}
                className="w-full text-left p-1 hover:bg-white/10 rounded"
              >
                ⛓️ Solana Staking App
              </button>
            </div>
          </div>
          
          <div className="text-xs opacity-70">
            Tip: drag nodes, connect edges. Use Suggest to evolve the architecture.
          </div>
        </section>

        <section className="md:col-span-2 h-[80vh] glass relative">
          <div ref={ref} className="absolute inset-0">
            <ReactFlow
              nodeTypes={nodeTypes}
              nodes={rfNodes}
              edges={rfEdges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              fitView
            >
              <Background />
              <MiniMap />
              <Controls />
            </ReactFlow>
          </div>
        </section>
      </div>
    </main>
  );
}
