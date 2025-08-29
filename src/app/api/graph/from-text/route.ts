import { NextRequest } from "next/server";
import { client, GRAPH_JSON_INSTRUCTIONS } from "@/lib/ai";

export async function POST(req: NextRequest) {
  const { text } = await req.json();

  const completion = await client.chat.completions.create({
    model: "gpt-4",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: GRAPH_JSON_INSTRUCTIONS },
      { role: "user", content: `Turn this idea into a system graph. ${text}` },
    ],
  });

  const json = completion.choices[0].message.content ?? "{}";
  return new Response(json, { headers: { "Content-Type": "application/json" } });
}
