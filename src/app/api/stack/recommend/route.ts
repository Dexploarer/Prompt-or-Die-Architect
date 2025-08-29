import { NextRequest } from "next/server";
import { generateStackRecommendation } from "@/lib/ai";
import { z } from "zod";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const schema = z.object({ requirements: z.string().min(10) });
    const parsed = schema.parse(body);
    const recommendation = await generateStackRecommendation(parsed.requirements);
    return new Response(JSON.stringify(recommendation), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed to generate stack recommendation" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
