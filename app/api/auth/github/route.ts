import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
export async function GET() {
  const id = process.env.GITHUB_CLIENT_ID;
  const callback = process.env.GITHUB_CALLBACK_URL;
  if (!id || !callback) return NextResponse.redirect(new URL("/login?error=oauth_not_configured", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"));
  const state = randomBytes(24).toString("hex");
  const url = new URL("https://github.com/login/oauth/authorize");
  url.searchParams.set("client_id", id);
  url.searchParams.set("redirect_uri", callback);
  url.searchParams.set("scope", "repo read:user user:email");
  url.searchParams.set("state", state);
  const response = NextResponse.redirect(url);
  response.cookies.set("xiyu_oauth_state", state, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 600 });
  return response;
}
