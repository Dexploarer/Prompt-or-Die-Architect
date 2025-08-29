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

export type StackType = "web" | "mobile" | "backend" | "blockchain" | "ai";
export type Framework = "nextjs" | "react" | "vue" | "svelte" | "solid" | "flutter" | "react-native" | "fastapi" | "hono" | "express" | "hardhat" | "anchor" | "langchain";

export type StackConfig = {
  type: StackType;
  framework: Framework;
  features: string[];
  database?: "postgres" | "mysql" | "sqlite" | "mongodb";
  auth?: "clerk" | "nextauth" | "supabase-auth";
  styling?: "tailwind" | "styled-components" | "emotion";
};

export type ProjectPlan = {
  title: string;
  description: string;
  stack: StackConfig;
  architecture: Graph;
  userStories: UserStory[];
  fileStructure: FileNode[];
};

export type UserStory = {
  id: string;
  title: string;
  description: string;
  acceptanceCriteria: string[];
  priority: "High" | "Medium" | "Low";
  estimate: "S" | "M" | "C";
  assignees: string[];
};

export type FileNode = {
  name: string;
  type: "file" | "directory";
  content?: string;
  children?: FileNode[];
};
