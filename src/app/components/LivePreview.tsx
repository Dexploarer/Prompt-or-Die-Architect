"use client";

import ReactFlow, { Background, Edge, Node } from "reactflow";
import "reactflow/dist/style.css";

export function LivePreview({ plan }: { plan: any }) {
  const nodesIn: Node[] = (plan?.architecture?.nodes || []).slice(0, 12).map((n: any, i: number) => ({
    id: n.id || String(i),
    data: { label: n.label },
    position: { x: (i % 4) * 150, y: Math.floor(i / 4) * 80 },
    style: { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.2)", color: "white" },
  }));
  const edgesIn: Edge[] = (plan?.architecture?.edges || []).slice(0, 12) as any;
  return (
    <div className="glass p-4 rounded-xl">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-semibold">Live Preview</div>
        <div className="text-xs opacity-70">Nodes: {nodesIn.length} • Edges: {edgesIn.length}</div>
      </div>
      <div className="h-64 rounded overflow-hidden">
        <ReactFlow nodes={nodesIn} edges={edgesIn} fitView>
          <Background />
        </ReactFlow>
      </div>
    </div>
  );
}


