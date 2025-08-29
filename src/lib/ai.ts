import OpenAI from "openai";

export const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export const GRAPH_JSON_INSTRUCTIONS = `
Return JSON with shape { "nodes": [...], "edges": [...] }.
Each node: { "id": "string", "label": "string", "kind": "service|db|queue|page|step" }.
Each edge: { "id": "string", "source": "nodeId", "target": "nodeId", "label": "string?" }.
No prose. JSON only.
`;

export const STACK_RECOMMENDATION_PROMPT = `
You are a tech stack advisor. Based on the user's requirements, recommend the optimal tech stack.
Consider: project type, scale, team size, performance needs, deployment preferences.
Return JSON with shape: {
  "frontend": {"framework": "nextjs|react|vue|svelte", "styling": "tailwind|styled-components", "reasons": string[]},
  "backend": {"framework": "hono|fastapi|express", "database": "postgres|mysql|sqlite", "reasons": string[]},
  "auth": {"solution": "clerk|nextauth|supabase", "reasons": string[]},
  "deployment": {"platform": "vercel|cloudflare|aws", "reasons": string[]},
  "additional": {"tools": string[], "reasons": string[]}
}
`;

export const PROJECT_PLAN_PROMPT = `
You are a comprehensive project planner. Generate a detailed project plan with architecture, user stories, and file structure.
Return JSON with shape: {
  "title": string,
  "description": string,
  "architecture": {"nodes": [...], "edges": [...]},
  "userStories": [{"id": string, "title": string, "description": string, "acceptanceCriteria": string[], "priority": "High|Medium|Low", "estimate": "S|M|C", "assignees": string[]}],
  "fileStructure": [{"name": string, "type": "file|directory", "content"?: string, "children"?: [...]}],
  "techStack": {"frontend": string, "backend": string, "database": string, "deployment": string},
  "timeline": {"phases": [{"name": string, "duration": string, "tasks": string[]}]},
  "risks": string[],
  "considerations": string[]
}
`;

export const SCAFFOLD_GENERATION_PROMPT = `
Generate actual code files for the specified tech stack and requirements.
Return JSON with shape: {
  "files": [{"path": string, "content": string, "executable"?: boolean}],
  "commands": [{"description": string, "command": string}],
  "environment": {"variables": string[], "setup": string[]}
}
Include package.json, configuration files, basic components, and setup instructions.
`;

export async function generateStackRecommendation(requirements: string) {
  const completion = await client.chat.completions.create({
    model: "gpt-4",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: STACK_RECOMMENDATION_PROMPT },
      { role: "user", content: requirements }
    ]
  });
  return JSON.parse(completion.choices[0].message.content ?? "{}");
}

export async function generateProjectPlan(idea: string, stack?: any) {
  const stackContext = stack ? `\nRecommended stack: ${JSON.stringify(stack)}` : "";
  const completion = await client.chat.completions.create({
    model: "gpt-4",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: PROJECT_PLAN_PROMPT + stackContext },
      { role: "user", content: idea }
    ]
  });
  return JSON.parse(completion.choices[0].message.content ?? "{}");
}

export async function generateScaffold(plan: any, selectedStack: any) {
  const context = `Project: ${plan.title}\nStack: ${JSON.stringify(selectedStack)}\nRequirements: ${plan.description}`;
  const completion = await client.chat.completions.create({
    model: "gpt-4",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SCAFFOLD_GENERATION_PROMPT },
      { role: "user", content: context }
    ]
  });
  return JSON.parse(completion.choices[0].message.content ?? "{}");
}
