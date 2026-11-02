import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { githubFetch } from "@/lib/github";
export async function POST(req: Request) {
  const s = await getSession();
  if (!s.accessToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const name = String(body.name || "").trim();
  if (!/^[A-Za-z0-9._-]{1,100}$/.test(name)) return NextResponse.json({ error: "Repository name is invalid." }, { status: 400 });
  try {
    const repo = await githubFetch<any>(s.accessToken, "/user/repos", { method: "POST", body: JSON.stringify({ name, description: String(body.description || "").slice(0, 350), private: Boolean(body.private), auto_init: false }) });
    return NextResponse.json({ fullName: repo.full_name, htmlUrl: repo.html_url, defaultBranch: repo.default_branch || "main" });
  } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : "Could not create repository" }, { status: 502 }); }
}
