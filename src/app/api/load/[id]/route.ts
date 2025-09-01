import { NextRequest } from "next/server";
import fs from "fs/promises";
import path from "path";
import { getServerSession } from "next-auth/next";
import { handler } from "../../auth/[...nextauth]/route";

function sanitizeEmail(email: string): string {
  return email.replace(/[^a-zA-Z0-9.-]/g, "_");
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(handler);
  if (!session?.user?.email) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  try {
    const { id } = params;
    const userDir = sanitizeEmail(session.user.email);
    const dataDir = path.join(process.cwd(), "data", userDir);
    const filePath = path.join(dataDir, `${id}.json`);

    const fileContent = await fs.readFile(filePath, "utf-8");
    const data = JSON.parse(fileContent);

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error loading data:", error);
    return new Response(JSON.stringify({ error: "Failed to load data" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
