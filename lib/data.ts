import "server-only";
import { sql } from "./db";
import type { RatingKey } from "./constants";

export type Home = {
  id: string;
  citySlug: string;
  addressSlug: string;
  city: string;
  address: string;
  housesigmaUrl: string;
};

export type HomeSummary = Home & { commentCount: number; ratingCount: number; lastActivity: Date };

export type RatingValues = Record<RatingKey, number>;
export type RatingSummary = { count: number; averages: Record<RatingKey, number | null> };

export type Comment = {
  id: string;
  parentId: string | null;
  handle: string;
  body: string;
  tags: string[];
  createdAt: Date;
  votes: number;
  voted: boolean;
  reported: boolean;
};

const homeColumns = sql`
  h.id, h.city_slug as "citySlug", h.address_slug as "addressSlug",
  h.city, h.address, h.housesigma_url as "housesigmaUrl"
`;

export async function getHome(citySlug: string, addressSlug: string): Promise<Home | null> {
  const [home] = await sql<Home[]>`
    select ${homeColumns} from homes h
    where h.city_slug = ${citySlug} and h.address_slug = ${addressSlug}
  `;
  return home ?? null;
}

export async function listRecentHomes(limit = 20): Promise<HomeSummary[]> {
  return sql<HomeSummary[]>`
    select ${homeColumns},
      (select count(*)::int from comments c where c.home_id = h.id and not c.hidden) as "commentCount",
      (select count(*)::int from ratings r where r.home_id = h.id) as "ratingCount",
      greatest(
        h.created_at,
        (select max(c.created_at) from comments c where c.home_id = h.id and not c.hidden),
        (select max(r.updated_at) from ratings r where r.home_id = h.id)
      ) as "lastActivity"
    from homes h
    order by "lastActivity" desc
    limit ${limit}
  `;
}

export async function getRatingSummary(homeId: string): Promise<RatingSummary> {
  const [row] = await sql<
    { count: number; value: number | null; condition: number | null; location: number | null; quiet: number | null }[]
  >`
    select count(*)::int as count,
      avg(value)::float8 as value, avg(condition)::float8 as condition,
      avg(location)::float8 as location, avg(quiet)::float8 as quiet
    from ratings where home_id = ${homeId}
  `;
  const { count, ...averages } = row;
  return { count, averages };
}

export async function getMyRating(homeId: string, userId: string): Promise<RatingValues | null> {
  const [row] = await sql<RatingValues[]>`
    select value, condition, location, quiet from ratings
    where home_id = ${homeId} and user_id = ${userId}
  `;
  return row ?? null;
}

export async function listComments(homeId: string, userId: string): Promise<Comment[]> {
  return sql<Comment[]>`
    select c.id, c.parent_id as "parentId", u.handle, c.body, c.tags, c.created_at as "createdAt",
      (select count(*)::int from comment_votes v where v.comment_id = c.id) as votes,
      exists (select 1 from comment_votes v where v.comment_id = c.id and v.user_id = ${userId}) as voted,
      exists (select 1 from reports r where r.comment_id = c.id and r.user_id = ${userId}) as reported
    from comments c join users u on u.id = c.user_id
    where c.home_id = ${homeId} and not c.hidden
    order by c.created_at
  `;
}
