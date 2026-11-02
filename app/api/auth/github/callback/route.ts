import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const saved = req.cookies.get("xiyu_oauth_state")?.value;
  const fail = (reason: string) => NextResponse.redirect(new URL(`/login?error=${reason}`, req.url));
  if (!code || !state || !saved || state !== saved) return fail("invalid_oauth_state");
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  if (!clientId || !clientSecret) return fail("oauth_not_configured");
  const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST", headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code })
  });
  const tokenData = await tokenResponse.json();
  if (!tokenResponse.ok || !tokenData.access_token) return fail("oauth_exchange_failed");
  const userResponse = await fetch("https://api.github.com/user", { headers: { Authorization: `Bearer ${tokenData.access_token}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" }, cache: "no-store" });
  if (!userResponse.ok) return fail("github_profile_failed");
  const user = await userResponse.json();
  const session = await getSession();
  session.accessToken = tokenData.access_token;
  session.login = user.login;
  session.avatarUrl = user.avatar_url;
  session.name = user.name;
  await session.save();
  const response = NextResponse.redirect(new URL("/dashboard", req.url));
  response.cookies.set("xiyu_oauth_state", "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 });
  return response;
}
