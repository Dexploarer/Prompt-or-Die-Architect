import { NextRequest } from "next/server";
import { client, GRAPH_JSON_INSTRUCTIONS } from "@/lib/ai";

export async function POST(req: NextRequest) {
  const { graph, goal } = await req.json();

  const messages = [
    { role: "system", content: GRAPH_JSON_INSTRUCTIONS },
    {
      role: "user",
      content: `You are an architect. Improve this graph toward the goal.
Current graph JSON:\n${JSON.stringify(graph)}\nGoal:\n${goal}\nReturn only JSON.`,
    },
  ];

  const completion = await client.chat.completions.create({
    model: "gpt-4.1-mini",
    response_format: { type: "json_object" },
    messages,
  });

  const json = completion.choices[0].message.content ?? "{}";
  return new Response(json, { headers: { "Content-Type": "application/json" } });
}


