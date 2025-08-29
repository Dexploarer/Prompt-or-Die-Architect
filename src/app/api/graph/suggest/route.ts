import { NextRequest } from "next/server";
import { client, GRAPH_JSON_INSTRUCTIONS } from "@/lib/ai";
import { GraphSchema } from "@/types/schemas";

export async function POST(req: NextRequest) {
  const { graph, goal } = await req.json();
  const parsed = GraphSchema.safeParse(graph);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: "Invalid graph payload", details: parsed.error.flatten() }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const messages = [
    { role: "system", content: GRAPH_JSON_INSTRUCTIONS },
    {
      role: "user",
      content: `You are an architect. Improve this graph toward the goal.
Current graph JSON:\n${JSON.stringify(graph)}\nGoal:\n${goal}\nReturn only JSON.`,
    },
  ];

  const completion = await client.chat.completions.create({
    model: "gpt-4",
    response_format: { type: "json_object" },
    messages,
  });

  const json = completion.choices[0].message.content ?? "{}";
  return new Response(json, { headers: { "Content-Type": "application/json" } });
}
