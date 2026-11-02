import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";

export type UserSession = {
  accessToken?: string;
  login?: string;
  avatarUrl?: string;
  name?: string | null;
};

const password = process.env.SESSION_PASSWORD;
if (!password || password.length < 32) {
  // Build can run without secrets; routes fail closed until env is configured.
}
export const sessionOptions: SessionOptions = {
  cookieName: "xiyu_github_session",
  password: password && password.length >= 32 ? password : "build-only-not-a-real-session-password-change-me",
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  }
};
export async function getSession() {
  return getIronSession<UserSession>(await cookies(), sessionOptions);
}
