import { NextRequest } from "next/server";
import OpenAI from "openai";
import { rideShareContext } from "./templates/ride-share";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

const DOC_JSON_INSTRUCTIONS = `
Return JSON ONLY with shape: {
  "title": string,
  "summary": string,
  "sections": Array<{"heading": string,"content": string,"bullets"?: string[]}>,
  "backlog": Array<{"id": string,"title": string,"priority": "High"|"Medium"|"Low","assignees"?: string[],"est": "S"|"M"|"C"}>,
  "risks": string[],
  "open_questions": string[]
}
No markdown. JSON only.
`;

export async function POST(req: NextRequest) {
  const { prompt, context } = await req.json();
  const merged = [rideShareContext, context].filter(Boolean).join("\n\n");
  const sys = DOC_JSON_INSTRUCTIONS + `\nContext (for grounding, may include domain, roles, tech):\n${merged}`;

  const completion = await client.chat.completions.create({
    model: "gpt-4.1-mini",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: sys },
      { role: "user", content: `Generate a comprehensive plan document for: ${prompt}` },
    ],
  });

  const json = completion.choices[0].message.content ?? "{}";
  return new Response(json, { headers: { "Content-Type": "application/json" } });
}

import { NextRequest } from "next/server";
import { client, DOC_JSON_INSTRUCTIONS } from "@/lib/ai";
import { rideShareContext } from "@/app/api/docs/templates/ride-share";

export async function POST(req: NextRequest) {
  const { prompt, context } = await req.json();
  const merged = [rideShareContext, context].filter(Boolean).join("\n\n");
  const sys = DOC_JSON_INSTRUCTIONS + `\nContext (for grounding, may include domain, roles, tech):\n${merged}`;

  const completion = await client.chat.completions.create({
    model: "gpt-4.1-mini",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: sys },
      { role: "user", content: `Generate a comprehensive plan document for: ${prompt}` },
    ],
  });

  const json = completion.choices[0].message.content ?? "{}";
  return new Response(json, { headers: { "Content-Type": "application/json" } });
}


