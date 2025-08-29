import { NextRequest } from "next/server";
import { generateScaffold } from "@/lib/ai";

export async function POST(req: NextRequest) {
  try {
    const { plan, stack } = await req.json();
    const scaffold = await generateScaffold(plan, stack);
    return new Response(JSON.stringify(scaffold), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed to generate scaffold" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
