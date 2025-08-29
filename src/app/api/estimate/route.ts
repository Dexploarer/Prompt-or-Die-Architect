import { NextRequest } from "next/server";
import { estimateCostTime } from "@/lib/ai";

export async function POST(req: NextRequest) {
  try {
    const { plan } = await req.json();
    if (!plan) return new Response(JSON.stringify({ error: "Missing 'plan'" }), { status: 400 });
    const out = await estimateCostTime(plan);
    return new Response(JSON.stringify(out), { headers: { "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: "Failed to estimate" }), { status: 500 });
  }
}


