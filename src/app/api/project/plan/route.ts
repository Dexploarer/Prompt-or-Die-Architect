import { NextRequest } from "next/server";
import { generateProjectPlan } from "@/lib/ai";
import { z } from "zod";
import { StackConfigSchema } from "@/types/schemas";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const schema = z.object({ idea: z.string().min(10), stack: StackConfigSchema.optional() });
    const parsed = schema.parse(body);
    const plan = await generateProjectPlan(parsed.idea, parsed.stack);
    return new Response(JSON.stringify(plan), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed to generate project plan" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
