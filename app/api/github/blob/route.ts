import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { githubFetch } from "@/lib/github";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session.accessToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }); }
  const owner = String(body.owner || "");
  const repo = String(body.repo || "");
  const contentBase64 = String(body.contentBase64 || "");
  const path = String(body.path || "");

  if (!/^[A-Za-z0-9-]+$/.test(owner) || !/^[A-Za-z0-9._-]+$/.test(repo) ||
      !path || path.startsWith("/") || path.split("/").includes("..")) {
    return NextResponse.json({ error: "Invalid file path or repository." }, { status: 400 });
  }

  // GitHub rejects individual Git blobs larger than 100 MiB. The UI applies
  // the stricter Pack2Git-compatible 12 MiB per-file limit.
  if (contentBase64.length > 16 * 1024 * 1024) {
    return NextResponse.json({ error: `${path} is too large for the current server upload route. The 12 MB per-file UI limit applies, but large request bodies require a storage-backed transfer worker.` }, { status: 413 });
  }

  try {
    const result = await githubFetch<any>(session.accessToken, `/repos/${owner}/${repo}/git/blobs`, {
      method: "POST",
      body: JSON.stringify({ content: contentBase64, encoding: "base64" })
    });
    return NextResponse.json({ path, sha: result.sha });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : `Failed to upload ${path}` }, { status: 502 });
  }
}
