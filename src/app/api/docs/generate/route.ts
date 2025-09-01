import { NextRequest } from "next/server";
import { client, DOC_JSON_INSTRUCTIONS } from "@/lib/ai";
import { rideShareContext } from "@/app/api/docs/templates/ride-share";

export async function POST(req: NextRequest) {
  try {
    const { prompt, context } = await req.json();
    if (!prompt) {
      return new Response(JSON.stringify({ error: "Missing 'prompt'" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

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
  } catch (e: unknown) {
    let errorMessage = "Failed to generate docs";
    if (e instanceof Error) {
      errorMessage = e.message;
    }
    console.error(e);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
