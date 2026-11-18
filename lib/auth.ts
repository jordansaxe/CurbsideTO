import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { sql } from "./db";

const SESSION_COOKIE = "curbside_session";
const SESSION_DAYS = 30;
export const LOGIN_TOKEN_MINUTES = 15;

export type User = { id: string; email: string; handle: string | null; isAdmin: boolean };

export function newToken(): string {
  return randomBytes(32).toString("base64url");
}

// Only hashes are stored, so a database leak does not expose usable tokens.
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function isAdmin(email: string): boolean {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean)
    .includes(email);
}

export const getCurrentUser = cache(async (): Promise<User | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const [row] = await sql<{ id: string; email: string; handle: string | null }[]>`
    select u.id, u.email, u.handle
    from sessions s join users u on u.id = s.user_id
    where s.token_hash = ${hashToken(token)} and s.expires_at > now()
  `;
  return row ? { ...row, isAdmin: isAdmin(row.email) } : null;
});

/** Signed-in member with a handle; otherwise sends them to sign in or pick one. */
export async function requireMember(): Promise<User & { handle: string }> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.handle) redirect("/welcome");
  return user as User & { handle: string };
}

export async function startSession(userId: string): Promise<void> {
  const token = newToken();
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await sql`
    insert into sessions (token_hash, user_id, expires_at)
    values (${hashToken(token)}, ${userId}, ${expires})
  `;
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires,
  });
}

export async function endSession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) await sql`delete from sessions where token_hash = ${hashToken(token)}`;
  store.delete(SESSION_COOKIE);
}
