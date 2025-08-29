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
import * as htmlToImage from "html-to-image";
import { Tldraw } from "@tldraw/tldraw";
import "@tldraw/tldraw/tldraw.css";

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

export default function Diagram() {
  const [rfNodes, setNodes, onNodesChange] = useNodesState<Node[]>([
    { id: "a", type: "glass", position: { x: 0, y: 0 }, data: { label: "Service A", kind: "service" } },
    { id: "b", type: "glass", position: { x: 300, y: 150 }, data: { label: "DB B", kind: "db" } },
  ]);
  const [rfEdges, setEdges, onEdgesChange] = useEdgesState<Edge[]>([
    { id: "e1", source: "a", target: "b", animated: true },
  ]);
  const ref = useRef<HTMLDivElement>(null);
  const [showDraw, setShowDraw] = useState(false);

  const onConnect = useCallback((c: Connection) => setEdges((eds) => addEdge({ ...c, animated: true }, eds)), [setEdges]);

  async function exportPng() {
    if (!ref.current) return;
    const dataUrl = await htmlToImage.toPng(ref.current, { pixelRatio: 2 });
    const a = document.createElement("a");
    a.href = dataUrl; a.download = "diagram.png"; a.click();
  }

  async function exportSvg() {
    if (!ref.current) return;
    const svg = await htmlToImage.toSvg(ref.current);
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "diagram.svg"; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-6xl mx-auto grid gap-4 md:grid-cols-3">
        <section className="md:col-span-1 space-y-3">
          <h1 className="text-2xl font-bold">Diagram</h1>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={exportPng} className="w-full glass p-3">Export PNG</button>
            <button onClick={exportSvg} className="w-full glass p-3">Export SVG</button>
            <button onClick={() => setShowDraw(true)} className="w-full glass p-3 col-span-2">Open tldraw overlay</button>
          </div>
          <div className="text-xs opacity-70">Drag nodes, connect to create edges.</div>
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
          {showDraw ? (
            <div className="absolute inset-0 bg-neutral-900/80">
              <div className="absolute top-2 right-2 z-50">
                <button onClick={() => setShowDraw(false)} className="glass px-3 py-1">Close overlay</button>
              </div>
              <Tldraw persistenceKey="diagram-overlay" />
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}


