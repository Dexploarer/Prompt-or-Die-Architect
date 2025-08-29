export type GraphNode = {
  id: string;
  label: string;
  group?: string;
  kind?: "service" | "db" | "queue" | "page" | "step";
  data?: Record<string, unknown>;
};

export type GraphEdge = {
  id: string;
  source: string;
  target: string;
  label?: string;
  directed?: boolean;
};

export type Graph = { nodes: GraphNode[]; edges: GraphEdge[] };


