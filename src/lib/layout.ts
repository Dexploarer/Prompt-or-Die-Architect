import ELK from "elkjs";
import type { Graph } from "@/types/graph";

const elk = new ELK();

export async function layout(graph: Graph) {
  const g = {
    id: "root",
    layoutOptions: {
      "elk.algorithm": "layered",
      "elk.spacing.nodeNode": "40",
      "elk.layered.spacing.nodeNodeBetweenLayers": "60",
      "elk.direction": "RIGHT",
    },
    children: graph.nodes.map((n) => ({
      id: n.id,
      width: 200,
      height: 80,
    })),
    edges: graph.edges.map((e) => ({ id: e.id, sources: [e.source], targets: [e.target] })),
  } as const;

  const res = await elk.layout(g as any);
  const pos: Record<string, { x: number; y: number }> = {};
  res.children?.forEach((c: any) => {
    pos[c.id] = { x: c.x ?? 0, y: c.y ?? 0 };
  });
  return pos;
}


