import { NextRequest } from "next/server";
import { generateStackRecommendation } from "@/lib/ai";

export async function POST(req: NextRequest) {
  try {
    const { requirements } = await req.json();
    const recommendation = await generateStackRecommendation(requirements);
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
