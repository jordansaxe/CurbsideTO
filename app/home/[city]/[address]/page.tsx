import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { hideComment, reportComment, toggleVote } from "@/app/actions";
import { CommentForm, RatingForm } from "@/components/forms";
import { type User, requireMember } from "@/lib/auth";
import { RATING_FIELDS, TAG_LABELS } from "@/lib/constants";
import { type Comment, getHome, getMyRating, getRatingSummary, listComments } from "@/lib/data";
import { plural, timeAgo } from "@/lib/format";

type Props = PageProps<"/home/[city]/[address]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  await requireMember();
  const { city, address } = await params;
  const home = await getHome(city, address);
  return { title: home ? `${home.address}, ${home.city}` : "Home not found" };
}

export default async function HomeDetailPage({ params }: Props) {
  const user = await requireMember();
  const { city, address } = await params;
  const home = await getHome(city, address);
  if (!home) notFound();

  const [summary, mine, comments] = await Promise.all([
    getRatingSummary(home.id),
    getMyRating(home.id, user.id),
    listComments(home.id, user.id),
  ]);

  const repliesByParent = Map.groupBy(
    comments.filter((comment) => comment.parentId),
    (comment) => comment.parentId,
  );
  // Most helpful first; ties keep the oldest on top.
  const topLevel = comments.filter((comment) => !comment.parentId).sort((a, b) => b.votes - a.votes);

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <Link href="/" className="text-sm text-muted hover:text-ink">
          ← All homes
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">{home.address}</h1>
            <p className="text-muted">{home.city}, Ontario</p>
          </div>
          <a
            href={home.housesigmaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-line bg-white px-3 py-2 text-sm font-medium hover:border-brand hover:text-brand-dark"
          >
            View listing on HouseSigma ↗
          </a>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-4 rounded-xl border border-line bg-white p-4">
          <h2 className="font-semibold">
            Community rating <span className="font-normal text-muted">· {plural(summary.count, "rating")}</span>
          </h2>
          {summary.count === 0 ? (
            <p className="text-sm text-muted">No ratings yet. Be the first.</p>
          ) : (
            <dl className="space-y-3">
              {RATING_FIELDS.map(({ key, label }) => {
                const average = summary.averages[key] ?? 0;
                return (
                  <div key={key} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <dt>{label}</dt>
                      <dd className="font-medium tabular-nums">{average.toFixed(1)}</dd>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-brand-soft" aria-hidden>
                      <div className="h-full rounded-full bg-brand" style={{ width: `${(average / 5) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </dl>
          )}
        </div>

        <div className="space-y-4 rounded-xl border border-line bg-white p-4">
          <h2 className="font-semibold">Your rating</h2>
          <RatingForm homeId={home.id} mine={mine} />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-semibold">
          Comments <span className="font-normal text-muted">· {comments.length}</span>
        </h2>
        <div className="rounded-xl border border-line bg-white p-4">
          <CommentForm homeId={home.id} />
        </div>

        {topLevel.length === 0 ? (
          <p className="text-sm text-muted">Nobody has commented on this home yet.</p>
        ) : (
          <ul className="space-y-3">
            {topLevel.map((comment) => (
              <li key={comment.id} className="space-y-3 rounded-xl border border-line bg-white p-4">
                <CommentBody comment={comment} user={user} />
                {(repliesByParent.get(comment.id) ?? []).map((reply) => (
                  <div key={reply.id} className="ml-4 border-l-2 border-line pl-4">
                    <CommentBody comment={reply} user={user} />
                  </div>
                ))}
                <details className="ml-4">
                  <summary className="cursor-pointer text-sm text-muted hover:text-ink">Reply</summary>
                  <div className="mt-2">
                    <CommentForm homeId={home.id} parentId={comment.id} />
                  </div>
                </details>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function CommentBody({ comment, user }: { comment: Comment; user: User }) {
  const linkButton = "cursor-pointer text-xs text-muted hover:text-ink hover:underline";

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
        <span className="font-medium">@{comment.handle}</span>
        <span className="text-muted">{timeAgo(comment.createdAt)}</span>
        {comment.tags.map((tag) => (
          <span key={tag} className="rounded-full bg-brand-soft px-2 py-0.5 text-xs font-medium text-brand-dark">
            {TAG_LABELS[tag] ?? tag}
          </span>
        ))}
      </div>
      <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">{comment.body}</p>
      <div className="flex items-center gap-4">
        <form action={toggleVote.bind(null, comment.id)}>
          <button
            aria-pressed={comment.voted}
            className={`cursor-pointer rounded-full border px-2.5 py-0.5 text-xs font-medium ${
              comment.voted
                ? "border-brand bg-brand-soft text-brand-dark"
                : "border-line text-muted hover:border-brand hover:text-brand-dark"
            }`}
          >
            ▲ Helpful · {comment.votes}
          </button>
        </form>
        {comment.reported ? (
          <span className="text-xs text-muted">Reported</span>
        ) : (
          <form action={reportComment.bind(null, comment.id)}>
            <button className={linkButton}>Report</button>
          </form>
        )}
        {user.isAdmin && (
          <form action={hideComment.bind(null, comment.id)}>
            <button className={linkButton}>Hide</button>
          </form>
        )}
      </div>
    </div>
  );
}
