import { NextRequest } from "next/server";
import { generateProjectPlan } from "@/lib/ai";

export async function POST(req: NextRequest) {
  try {
    const { idea, stack } = await req.json();
    const plan = await generateProjectPlan(idea, stack);
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
