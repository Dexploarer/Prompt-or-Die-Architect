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
import { AuthStatus } from "./components/AuthStatus";

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
  const [diagramType, setDiagramType] = useState<"system" | "user-flow">("system");
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
    try {
      const r = await fetch("/api/graph/from-text", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: idea, type: diagramType }),
      });
      if (!r.ok) {
        throw new Error(`HTTP error! status: ${r.status}`);
      }
      const g = (await r.json()) as Graph;
      await toRF(g);
    } catch (error) {
      console.error("Error generating graph from text:", error);
      alert("Failed to generate diagram. Please check the console for details.");
    } finally {
      setBusy(false);
    }
  }

  async function generateDoc() {
    setBusy(true);
    try {
      const r = await fetch("/api/docs/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: docPrompt, context: "" }),
      });
      if (!r.ok) {
        throw new Error(`HTTP error! status: ${r.status}`);
      }
      const j = await r.text();
      setDocJson(j);
    } catch (error) {
      console.error("Error generating document:", error);
      alert("Failed to generate document. Please check the console for details.");
    } finally {
      setBusy(false);
    }
  }

  async function suggest() {
    setBusy(true);
    try {
      const graph: Graph = {
        nodes: rfNodes.map((n) => ({ id: n.id, label: (n.data as any).label, kind: (n.data as any).kind })),
        edges: rfEdges.map((e) => ({ id: e.id, source: e.source, target: e.target, label: e.label })),
      };
      const r = await fetch("/api/graph/suggest", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ graph, goal }),
      });
      if (!r.ok) {
        throw new Error(`HTTP error! status: ${r.status}`);
      }
      const g = (await r.json()) as Graph;
      await toRF(g);
    } catch (error) {
      console.error("Error suggesting improvements:", error);
      alert("Failed to suggest improvements. Please check the console for details.");
    } finally {
      setBusy(false);
    }
  }

  const onConnect = useCallback((c: Connection) => setEdges((eds) => addEdge({ ...c, animated: true }, eds)), [setEdges]);

  async function exportPng() {
    if (!ref.current) return;
    setBusy(true);
    try {
      const dataUrl = await htmlToImage.toPng(ref.current, { pixelRatio: 2 });
      const a = document.createElement("a");
      a.href = dataUrl; a.download = "diagram.png"; a.click();
    } catch (error) {
      console.error("Error exporting PNG:", error);
      alert("Failed to export PNG. Please check the console for details.");
    } finally {
      setBusy(false);
    }
  }

  async function exportPdf() {
    setBusy(true);
    try {
      const r = await fetch("/api/docs/export-pdf", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ json: docJson }),
      });
      if (!r.ok) {
        throw new Error(`HTTP error! status: ${r.status}`);
      }
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "plan.pdf"; a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting PDF:", error);
      alert("Failed to export PDF. Please check the console for details.");
    } finally {
      setBusy(false);
    }
  }

  async function saveData() {
    setBusy(true);
    try {
      const graph = {
        nodes: rfNodes.map((n) => ({ id: n.id, label: (n.data as any).label, kind: (n.data as any).kind })),
        edges: rfEdges.map((e) => ({ id: e.id, source: e.source, target: e.target, label: e.label })),
      };
      const r = await fetch("/api/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ graph, doc: docJson }),
      });
      if (!r.ok) {
        throw new Error(`HTTP error! status: ${r.status}`);
      }
      const { id } = await r.json();
      alert(`Saved successfully with ID: ${id}`);
    } catch (error) {
      console.error("Error saving data:", error);
      alert("Failed to save data. Please check the console for details.");
    } finally {
      setBusy(false);
    }
  }

  async function loadData() {
    const id = prompt("Enter the ID of the data to load:");
    if (!id) return;

    setBusy(true);
    try {
      const r = await fetch(`/api/load/${id}`);
      if (!r.ok) {
        throw new Error(`HTTP error! status: ${r.status}`);
      }
      const data = await r.json();
      if (data.graph) {
        await toRF(data.graph);
      }
      if (data.doc) {
        setDocJson(data.doc);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      alert("Failed to load data. Please check the console for details.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-6xl mx-auto grid gap-4 md:grid-cols-3">
        <section className="md:col-span-1 space-y-3">
          <AuthStatus />
          <h1 className="text-2xl font-bold">Glass AI Diagrams</h1>
          <div className="glass p-3 space-y-2">
            <label htmlFor="diagram-type" className="text-sm font-semibold">Diagram Type</label>
            <select id="diagram-type" value={diagramType} onChange={(e) => setDiagramType(e.target.value as any)}
              className="w-full glass p-2 outline-none">
              <option value="system">System Architecture</option>
              <option value="user-flow">User Flow</option>
            </select>
          </div>
          <textarea value={idea} onChange={(e) => setIdea(e.target.value)}
            className="w-full h-28 glass p-3 outline-none" placeholder="Paste idea or spec..." />
          <button onClick={fromText} disabled={busy} className="w-full glass p-3">Generate from text</button>
          <textarea value={goal} onChange={(e) => setGoal(e.target.value)}
            className="w-full h-24 glass p-3 outline-none" placeholder="Goal or constraint for suggestions..." />
          <button onClick={suggest} disabled={busy} className="w-full glass p-3">Suggest improvements</button>
          <div className="grid grid-cols-3 gap-2">
            <button onClick={exportPng} className="w-full glass p-3">Export PNG</button>
            <button onClick={saveData} disabled={busy} className="w-full glass p-3">Save</button>
            <button onClick={loadData} disabled={busy} className="w-full glass p-3">Load</button>
          </div>
          <div className="glass p-3 space-y-2">
            <div className="text-sm font-semibold">Doc Generator</div>
            <input value={docPrompt} onChange={(e) => setDocPrompt(e.target.value)}
              className="w-full glass p-2 outline-none" placeholder="Document prompt..." />
            <div className="grid grid-cols-2 gap-2">
              <button onClick={generateDoc} disabled={busy} className="w-full glass p-3">Generate Plan JSON</button>
              <button onClick={exportPdf} disabled={busy || !docJson} className="w-full glass p-3">Export PDF</button>
            </div>
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


