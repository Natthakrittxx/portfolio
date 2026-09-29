import { readFile } from "node:fs/promises";
import { join } from "node:path";

// Serves the project README (which holds the revision log) at /README.md as plain text,
// built once at build time, so the footer link never points off-site.
export const dynamic = "force-static";

export async function GET() {
  const text = await readFile(join(process.cwd(), "README.md"), "utf8");
  return new Response(text, { headers: { "content-type": "text/plain; charset=utf-8" } });
}
