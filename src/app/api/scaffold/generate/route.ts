import { NextRequest } from "next/server";
import { generateScaffold } from "@/lib/ai";
import { ProjectPlanSchema, StackConfigSchema } from "@/types/schemas";
import { z } from "zod";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const schema = z.object({ plan: ProjectPlanSchema, stack: StackConfigSchema });
    const parsed = schema.parse(body);
    const scaffold = await generateScaffold(parsed.plan, parsed.stack);
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
