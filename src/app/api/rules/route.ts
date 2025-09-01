import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

async function getFiles(dir: string): Promise<string[]> {
  const dirents = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    dirents.map((dirent) => {
      const res = path.resolve(dir, dirent.name);
      return dirent.isDirectory() ? getFiles(res) : res;
    })
  );
  return Array.prototype.concat(...files);
}

export async function GET(req: NextRequest) {
  try {
    const rulesDir = path.join(process.cwd(), ".cursor", "rules");
    const files = await getFiles(rulesDir);
    const mdcFiles = files.filter(
      (file) => file.endsWith(".mdc") || file.endsWith(".md")
    );

    const rules = await Promise.all(
      mdcFiles.map(async (file) => {
        const content = await fs.readFile(file, "utf-8");
        return {
          fileName: path.basename(file),
          content,
        };
      })
    );

    return NextResponse.json(rules);
  } catch (error) {
    console.error("Error reading rules:", error);
    return new NextResponse("Error reading rules", { status: 500 });
  }
}
