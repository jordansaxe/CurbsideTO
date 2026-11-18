"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  LOGIN_TOKEN_MINUTES,
  endSession,
  getCurrentUser,
  hashToken,
  newToken,
  requireMember,
  startSession,
} from "@/lib/auth";
import { COMMENTS_PER_HOUR, COMMENT_TAGS, MAX_COMMENT_LENGTH, RATING_FIELDS } from "@/lib/constants";
import { sql } from "@/lib/db";
import { sendLoginEmail } from "@/lib/email";
import { parseHouseSigmaUrl } from "@/lib/housesigma";

export type FormState = { error?: string; message?: string; values?: Record<string, string> } | null;

const HOME_PAGE = "/home/[city]/[address]";

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

// Forms clear themselves after submitting, so errors hand back what was typed.
function fail(error: string, formData: FormData, ...keep: string[]): FormState {
  return { error, values: Object.fromEntries(keep.map((name) => [name, field(formData, name)])) };
}

// ---------- Sign-in ----------

export async function requestLogin(_: FormState, formData: FormData): Promise<FormState> {
  const email = field(formData, "email").toLowerCase();
  const inviteCode = field(formData, "invite").toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return fail("Enter a valid email address.", formData, "email", "invite");
  }

  const [existing] = await sql`select 1 from users where email = ${email}`;
  if (!existing) {
    if (!inviteCode) {
      return fail("CurbsideTO is invite-only for now. Enter your invite code to join.", formData, "email", "invite");
    }
    const [invite] = await sql`select 1 from invites where code = ${inviteCode} and uses < max_uses`;
    if (!invite) return fail("That invite code isn't valid or has already been used.", formData, "email", "invite");
  }

  const [{ pending }] = await sql<{ pending: number }[]>`
    select count(*)::int as pending from login_tokens
    where email = ${email} and used_at is null and expires_at > now()
  `;
  if (pending >= 3) {
    return fail("We've already sent you a few links. Check your inbox, or try again in a few minutes.", formData, "email", "invite");
  }

  const token = newToken();
  await sql`
    insert into login_tokens (token_hash, email, invite_code, expires_at)
    values (${hashToken(token)}, ${email}, ${existing ? null : inviteCode},
            now() + make_interval(mins => ${LOGIN_TOKEN_MINUTES}))
  `;
  const base = (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  await sendLoginEmail(email, `${base}/auth/verify?token=${token}`);

  return { message: `Check ${email} for a sign-in link. It expires in ${LOGIN_TOKEN_MINUTES} minutes.` };
}

export async function verifyLogin(formData: FormData): Promise<void> {
  const token = field(formData, "token");

  const userId = await sql.begin(async (tx) => {
    const [login] = await tx<{ email: string; invite_code: string | null }[]>`
      update login_tokens set used_at = now()
      where token_hash = ${hashToken(token)} and used_at is null and expires_at > now()
      returning email, invite_code
    `;
    if (!login) return null;

    const [user] = await tx<{ id: string }[]>`select id from users where email = ${login.email}`;
    if (user) return user.id;

    // New member: claim one use of the invite. The guard keeps a code from being over-used.
    const [claimed] = await tx`
      update invites set uses = uses + 1
      where code = ${login.invite_code} and uses < max_uses
      returning code
    `;
    if (!claimed) return null;

    const [created] = await tx<{ id: string }[]>`
      insert into users (email) values (${login.email}) returning id
    `;
    return created.id;
  });

  if (!userId) redirect("/login?error=link");
  await startSession(userId);
  redirect("/");
}

export async function signOut(): Promise<void> {
  await endSession();
  redirect("/login");
}

export async function chooseHandle(_: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.handle) redirect("/");

  const handle = field(formData, "handle").toLowerCase();
  if (!/^[a-z0-9_]{3,20}$/.test(handle)) {
    return fail("Use 3–20 characters: letters, numbers and underscores.", formData, "handle");
  }

  try {
    await sql`update users set handle = ${handle} where id = ${user.id} and handle is null`;
  } catch (error) {
    if ((error as { code?: string }).code === "23505") return fail("That handle is taken. Try another.", formData, "handle");
    throw error;
  }
  // The header shows the handle, so the shared layout has to re-render too.
  revalidatePath("/", "layout");
  redirect("/");
}

// ---------- Homes ----------

export async function openHome(_: FormState, formData: FormData): Promise<FormState> {
  const user = await requireMember();
  const listing = parseHouseSigmaUrl(field(formData, "url"));
  if (!listing) {
    return fail("That doesn't look like a HouseSigma home link. Open the listing on HouseSigma, tap Share, and paste the link here.", formData, "url");
  }

  await sql`
    insert into homes (city_slug, address_slug, city, address, housesigma_url, created_by)
    values (${listing.citySlug}, ${listing.addressSlug}, ${listing.city}, ${listing.address}, ${listing.url}, ${user.id})
    on conflict (city_slug, address_slug) do nothing
  `;
  redirect(`/home/${listing.citySlug}/${listing.addressSlug}`);
}

export async function saveRating(homeId: string, _: FormState, formData: FormData): Promise<FormState> {
  const user = await requireMember();

  const scores = RATING_FIELDS.map(({ key }) => Number(field(formData, key)));
  if (scores.some((score) => !Number.isInteger(score) || score < 1 || score > 5)) {
    return { error: "Pick a score from 1 to 5 for each row." };
  }
  const [value, condition, location, quiet] = scores;

  const [home] = await sql`select 1 from homes where id = ${homeId}`;
  if (!home) return { error: "This home no longer exists." };

  await sql`
    insert into ratings (home_id, user_id, value, condition, location, quiet)
    values (${homeId}, ${user.id}, ${value}, ${condition}, ${location}, ${quiet})
    on conflict (home_id, user_id) do update
      set value = excluded.value, condition = excluded.condition,
          location = excluded.location, quiet = excluded.quiet, updated_at = now()
  `;
  revalidatePath(HOME_PAGE, "page");
  return { message: "Rating saved." };
}

// ---------- Comments ----------

export async function addComment(homeId: string, _: FormState, formData: FormData): Promise<FormState> {
  const user = await requireMember();

  const body = field(formData, "body");
  if (!body) return fail("Write something first.", formData, "body");
  if (body.length > MAX_COMMENT_LENGTH) {
    return fail(`Comments can be up to ${MAX_COMMENT_LENGTH} characters.`, formData, "body");
  }

  const parentId = field(formData, "parentId") || null;
  const allowedTags: string[] = COMMENT_TAGS.map((tag) => tag.key);
  const tags = parentId ? [] : formData.getAll("tags").filter((tag): tag is string => allowedTags.includes(tag as string));

  const [home] = await sql`select 1 from homes where id = ${homeId}`;
  if (!home) return fail("This home no longer exists.", formData, "body");

  if (parentId) {
    // Replies go one level deep, and only under a visible comment on the same home.
    const [parent] = await sql`
      select 1 from comments
      where id = ${parentId} and home_id = ${homeId} and parent_id is null and not hidden
    `;
    if (!parent) return fail("The comment you're replying to is no longer available.", formData, "body");
  }

  const [{ recent }] = await sql<{ recent: number }[]>`
    select count(*)::int as recent from comments
    where user_id = ${user.id} and created_at > now() - interval '1 hour'
  `;
  if (recent >= COMMENTS_PER_HOUR) {
    return fail("You're posting a lot. Take a short break and try again later.", formData, "body");
  }

  await sql`
    insert into comments (home_id, user_id, parent_id, body, tags)
    values (${homeId}, ${user.id}, ${parentId}, ${body}, ${tags})
  `;
  revalidatePath(HOME_PAGE, "page");
  return { message: "Posted." };
}

export async function toggleVote(commentId: string): Promise<void> {
  const user = await requireMember();
  const removed = await sql`
    delete from comment_votes where comment_id = ${commentId} and user_id = ${user.id} returning 1
  `;
  if (removed.length === 0) {
    await sql`
      insert into comment_votes (comment_id, user_id)
      select id, ${user.id} from comments where id = ${commentId} and not hidden
      on conflict do nothing
    `;
  }
  revalidatePath(HOME_PAGE, "page");
}

export async function reportComment(commentId: string): Promise<void> {
  const user = await requireMember();
  await sql`
    insert into reports (comment_id, user_id)
    select id, ${user.id} from comments where id = ${commentId}
    on conflict do nothing
  `;
  revalidatePath(HOME_PAGE, "page");
}

export async function hideComment(commentId: string): Promise<void> {
  const user = await requireMember();
  if (!user.isAdmin) throw new Error("Not allowed");
  await sql`update comments set hidden = true where id = ${commentId}`;
  revalidatePath(HOME_PAGE, "page");
}
