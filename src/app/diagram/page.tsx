"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import ReactFlow, { Background, Controls, MiniMap, Node, Edge, useEdgesState, useNodesState } from "reactflow";
import "reactflow/dist/style.css";
import { layout } from "@/lib/layout";
import { Graph } from "@/types/graph";
import * as htmlToImage from "html-to-image";
import dynamic from "next/dynamic";

const Tldraw = dynamic(() => import("@tldraw/tldraw").then((m) => m.Tldraw), { ssr: false });

export default function Diagram() {
  const [rfNodes, setNodes, onNodesChange] = useNodesState<Node[]>([]);
  const [rfEdges, setEdges, onEdgesChange] = useEdgesState<Edge[]>([]);
  const [showGrid, setShowGrid] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const [showDraw, setShowDraw] = useState(false);

  const toRF = useCallback(async (g: Graph) => {
    const pos = await layout(g);
    const nodes: Node[] = g.nodes.map((n) => ({
      id: n.id,
      type: "default",
      data: { label: n.label },
      position: pos[n.id] ?? { x: 0, y: 0 },
    }));
    const edges: Edge[] = g.edges.map((e) => ({ id: e.id, source: e.source, target: e.target, label: e.label, animated: true }));
    setNodes(nodes);
    setEdges(edges);
  }, [setNodes, setEdges]);

  async function exportSvg() {
    if (!ref.current) return;
    const svgData = await htmlToImage.toSvg(ref.current);
    const a = document.createElement("a");
    a.href = svgData; a.download = "diagram.svg"; a.click();
  }

  useEffect(() => {
    function onDock(e: any) {
      const action = e.detail?.type;
      if (action === "export-svg") exportSvg();
      if (action === "toggle-grid") setShowGrid((v) => !v);
      if (action === "toggle-draw") setShowDraw((v) => !v);
    }
    window.addEventListener("tool-dock", onDock as any);
    return () => window.removeEventListener("tool-dock", onDock as any);
  }, []);

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-6xl mx-auto space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Diagram</h1>
          <div className="text-xs opacity-70">Use the floating toolbar to export SVG or toggle grid</div>
        </div>
        <section className="h-[80vh] glass relative">
          <div ref={ref} className="absolute inset-0">
            <ReactFlow nodes={rfNodes} edges={rfEdges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} fitView>
              {showGrid && <Background />}
              <MiniMap />
              <Controls />
            </ReactFlow>
            {showDraw && (
              <div className="absolute inset-0 pointer-events-auto">
                <Tldraw persistenceKey="diagram-overlay" />
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}


