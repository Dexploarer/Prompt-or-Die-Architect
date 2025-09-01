import { NextRequest } from "next/server";
import { client, GRAPH_JSON_INSTRUCTIONS, USER_FLOW_JSON_INSTRUCTIONS } from "@/lib/ai";

export async function POST(req: NextRequest) {
  const { text, type } = await req.json();

  const systemPrompt = type === "user-flow" ? USER_FLOW_JSON_INSTRUCTIONS : GRAPH_JSON_INSTRUCTIONS;
  const userPrompt = type === "user-flow"
    ? `Turn this idea into a user flow graph. ${text}`
    : `Turn this idea into a system graph. ${text}`;

  const completion = await client.chat.completions.create({
    model: "gpt-4.1-mini",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  const json = completion.choices[0].message.content ?? "{}";
  return new Response(json, { headers: { "Content-Type": "application/json" } });
}


