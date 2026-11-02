import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { githubFetch } from "@/lib/github";
export async function POST(req: Request) {
  const s = await getSession();
  if (!s.accessToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const b = await req.json();
  const owner = String(b.owner || ""), repo = String(b.repo || ""), branch = String(b.branch || "main").trim();
  const entries = Array.isArray(b.entries) ? b.entries : [];
  const message = String(b.message || "Upload project with XIYU GITHUB UPLOADER").slice(0, 200);
  if (!/^[A-Za-z0-9-]+$/.test(owner) || !/^[A-Za-z0-9._-]+$/.test(repo) || !/^[A-Za-z0-9._/-]{1,200}$/.test(branch) || !entries.length || entries.length > 1500) return NextResponse.json({ error: "Invalid commit data. Maximum 1,500 files." }, { status: 400 });
  if (entries.some((e: any) => typeof e.path !== "string" || typeof e.sha !== "string" || e.path.startsWith("/") || e.path.split("/").includes(".."))) return NextResponse.json({ error: "Invalid file entries." }, { status: 400 });
  try {
    // A newly-created empty repository has no branch ref yet. Bootstrap its first commit.
    const refPath = `/repos/${owner}/${repo}/git/ref/heads/${encodeURIComponent(branch).replaceAll("%2F", "/")}`;
    const refResponse = await fetch(`https://api.github.com${refPath}`, {
      headers: { Authorization: `Bearer ${s.accessToken}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" },
      cache: "no-store"
    });
    let parent: string | undefined;
    let baseTree: string | undefined;
    if (refResponse.ok) {
      const ref = await refResponse.json();
      parent = ref.object.sha;
      const parentCommit = await githubFetch<any>(s.accessToken, `/repos/${owner}/${repo}/git/commits/${parent}`);
      baseTree = parentCommit.tree.sha;
    } else if (refResponse.status !== 404) {
      const problem = await refResponse.json().catch(() => ({}));
      throw new Error(problem.message || `Could not read branch (${refResponse.status})`);
    }
    const treePayload: any = { tree: entries.map((e: any) => ({ path: e.path, mode: "100644", type: "blob", sha: e.sha })) };
    if (baseTree) treePayload.base_tree = baseTree;
    const tree = await githubFetch<any>(s.accessToken, `/repos/${owner}/${repo}/git/trees`, { method: "POST", body: JSON.stringify(treePayload) });
    const commitPayload: any = { message, tree: tree.sha };
    if (parent) commitPayload.parents = [parent];
    const commit = await githubFetch<any>(s.accessToken, `/repos/${owner}/${repo}/git/commits`, { method: "POST", body: JSON.stringify(commitPayload) });
    if (parent) {
      await githubFetch<any>(s.accessToken, `/repos/${owner}/${repo}/git/refs/heads/${encodeURIComponent(branch).replaceAll("%2F", "/")}`, { method: "PATCH", body: JSON.stringify({ sha: commit.sha }) });
    } else {
      await githubFetch<any>(s.accessToken, `/repos/${owner}/${repo}/git/refs`, { method: "POST", body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: commit.sha }) });
    }
    return NextResponse.json({ commitSha: commit.sha, htmlUrl: `https://github.com/${owner}/${repo}/commit/${commit.sha}`, repoUrl: `https://github.com/${owner}/${repo}`, fileCount: entries.length });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Commit failed. Ensure the branch exists and repository is ready." }, { status: 502 });
  }
}
