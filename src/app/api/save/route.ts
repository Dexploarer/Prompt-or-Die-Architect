import { NextRequest } from "next/server";
import { v4 as uuidv4 } from "uuid";
import fs from "fs/promises";
import path from "path";
import { getServerSession } from "next-auth/next";
import { handler } from "../auth/[...nextauth]/route";

function sanitizeEmail(email: string): string {
  return email.replace(/[^a-zA-Z0-9.-]/g, "_");
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(handler);
  if (!session?.user?.email) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  try {
    const { graph, doc } = await req.json();
    const id = uuidv4();
    const data = {
      id,
      graph,
      doc,
      createdAt: new Date().toISOString(),
    };

    const userDir = sanitizeEmail(session.user.email);
    const dataDir = path.join(process.cwd(), "data", userDir);
    await fs.mkdir(dataDir, { recursive: true });
    const filePath = path.join(dataDir, `${id}.json`);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));

    return new Response(JSON.stringify({ id }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error saving data:", error);
    return new Response(JSON.stringify({ error: "Failed to save data" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
