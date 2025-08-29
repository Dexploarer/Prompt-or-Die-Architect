import OpenAI from "openai";

export const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export const GRAPH_JSON_INSTRUCTIONS = `
Return JSON with shape { "nodes": [...], "edges": [...] }.
Each node: { "id": "string", "label": "string", "kind": "service|db|queue|page|step" }.
Each edge: { "id": "string", "source": "nodeId", "target": "nodeId", "label": "string?" }.
No prose. JSON only.
`;

export const DOC_JSON_INSTRUCTIONS = `
You are a planner. Produce a comprehensive, deeply structured plan document matching the user's domain.
Return JSON ONLY with shape: {
  "title": string,
  "summary": string,
  "sections": Array<{
    "heading": string,
    "content": string,
    "bullets"?: string[]
  }>,
  "backlog": Array<{
    "id": string,
    "title": string,
    "priority": "High"|"Medium"|"Low",
    "assignees"?: string[],
    "est": "S"|"M"|"C"
  }>,
  "risks": string[],
  "open_questions": string[]
}
No markdown. JSON only.
`;


