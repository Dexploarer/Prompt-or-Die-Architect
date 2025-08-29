import { z } from "zod";

export const GraphNodeSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  group: z.string().optional(),
  kind: z.enum(["service", "db", "queue", "page", "step"]).optional(),
  data: z.record(z.unknown()).optional(),
});

export const GraphEdgeSchema = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  target: z.string().min(1),
  label: z.string().optional(),
  directed: z.boolean().optional(),
});

export const GraphSchema = z.object({
  nodes: z.array(GraphNodeSchema),
  edges: z.array(GraphEdgeSchema),
});

export const StackTypeSchema = z.enum(["web", "mobile", "backend", "blockchain", "ai"]);
export const FrameworkSchema = z.enum([
  "nextjs",
  "react",
  "vue",
  "svelte",
  "solid",
  "flutter",
  "react-native",
  "fastapi",
  "hono",
  "express",
  "hardhat",
  "anchor",
  "langchain",
]);

export const StackConfigSchema = z.object({
  type: StackTypeSchema,
  framework: FrameworkSchema,
  features: z.array(z.string()).default([]),
  database: z.enum(["postgres", "mysql", "sqlite", "mongodb"]).optional(),
  auth: z.enum(["clerk", "nextauth", "supabase-auth"]).optional(),
  styling: z.enum(["tailwind", "styled-components", "emotion"]).optional(),
});

export const UserStorySchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  acceptanceCriteria: z.array(z.string()),
  priority: z.enum(["High", "Medium", "Low"]),
  estimate: z.enum(["S", "M", "C"]),
  assignees: z.array(z.string()),
});

export const FileNodeSchema = z.lazy(() => z.object({
  name: z.string(),
  type: z.enum(["file", "directory"]),
  content: z.string().optional(),
  children: z.array(FileNodeSchema).optional(),
}));

export const ProjectPlanSchema = z.object({
  title: z.string(),
  description: z.string(),
  stack: StackConfigSchema,
  architecture: GraphSchema,
  userStories: z.array(UserStorySchema),
  fileStructure: z.array(FileNodeSchema),
});

export type GraphInput = z.infer<typeof GraphSchema>;
export type StackConfigInput = z.infer<typeof StackConfigSchema>;
export type ProjectPlanInput = z.infer<typeof ProjectPlanSchema>;


