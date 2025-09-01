import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function GET(req: NextRequest) {
  try {
    const cookbookDir = path.join(process.cwd(), ".cursor", "cookbook");
    const files = await fs.readdir(cookbookDir);
    const mdFiles = files.filter((file) => file.endsWith(".md"));

    const guides = await Promise.all(
      mdFiles.map(async (file) => {
        const filePath = path.join(cookbookDir, file);
        const content = await fs.readFile(filePath, "utf-8");
        return {
          fileName: file,
          content,
        };
      })
    );

    return NextResponse.json(guides);
  } catch (error) {
    console.error("Error reading cookbook guides:", error);
    return new NextResponse("Error reading cookbook guides", { status: 500 });
  }
}
