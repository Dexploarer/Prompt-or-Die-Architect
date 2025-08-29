import { NextRequest } from "next/server";
import { generateDocsFromPlan } from "@/lib/ai";

export async function POST(req: NextRequest) {
  try {
    const { plan } = await req.json();
    if (!plan) return new Response(JSON.stringify({ error: "Missing 'plan'" }), { status: 400 });
    const md = await generateDocsFromPlan(plan);
    return new Response(JSON.stringify({ markdown: md }), { headers: { "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: "Failed to generate docs" }), { status: 500 });
  }
}


