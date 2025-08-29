"use client";

import React, { useState } from "react";
import { DocViewer } from "./components/DocViewer";

export default function HomeRoot() {
  const [docJson, setDocJson] = useState<string>("");
  const [prompt, setPrompt] = useState("Ride Share Application Plan");

  async function generate() {
    const r = await fetch("/api/docs/generate", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, context: "" }),
    });
    const j = await r.text();
    setDocJson(j);
  }

  async function exportPdf() {
    const r = await fetch("/api/docs/export-pdf", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ json: docJson }),
    });
    const blob = await r.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "plan.json"; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="glass p-4 grid md:grid-cols-3 gap-3">
          <div className="md:col-span-2">
            <div className="text-xl font-bold">AI Plan Generator</div>
            <div className="text-xs opacity-70">Generate comprehensive plans with sections, backlog, risks.</div>
          </div>
          <div className="space-y-2">
            <input value={prompt} onChange={(e) => setPrompt(e.target.value)} className="w-full glass p-2 outline-none" placeholder="Prompt..." />
            <div className="grid grid-cols-2 gap-2">
              <button onClick={generate} className="w-full glass p-2">Generate</button>
              <button onClick={exportPdf} className="w-full glass p-2">Export</button>
            </div>
          </div>
        </div>
        <DocViewer json={docJson} />
      </div>
    </main>
  );
}

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
  const [docPrompt, setDocPrompt] = useState("Ride Share Application Plan");
  const [docJson, setDocJson] = useState<string>("");
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

  async function generateDoc() {
    setBusy(true);
    const r = await fetch("/api/docs/generate", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: docPrompt, context: "" }),
    });
    const j = await r.text();
    setDocJson(j);
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
          <h1 className="text-2xl font-bold">Glass AI Diagrams</h1>
          <textarea value={idea} onChange={(e) => setIdea(e.target.value)}
            className="w-full h-28 glass p-3 outline-none" placeholder="Paste idea or spec..." />
          <button onClick={fromText} disabled={busy} className="w-full glass p-3">Generate from text</button>
          <textarea value={goal} onChange={(e) => setGoal(e.target.value)}
            className="w-full h-24 glass p-3 outline-none" placeholder="Goal or constraint for suggestions..." />
          <button onClick={suggest} disabled={busy} className="w-full glass p-3">Suggest improvements</button>
          <button onClick={exportPng} className="w-full glass p-3">Export PNG</button>
          <div className="glass p-3 space-y-2">
            <div className="text-sm font-semibold">Doc Generator</div>
            <input value={docPrompt} onChange={(e) => setDocPrompt(e.target.value)}
              className="w-full glass p-2 outline-none" placeholder="Document prompt..." />
            <button onClick={generateDoc} disabled={busy} className="w-full glass p-3">Generate Plan JSON</button>
            <textarea value={docJson} readOnly className="w-full h-40 glass p-2 text-xs" />
          </div>
          <div className="text-xs opacity-70">
            Tip: drag nodes, right click edges in React Flow UI. Use Suggest to grow the graph.
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


