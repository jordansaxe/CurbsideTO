import Link from "next/link";
import { PasteLinkForm } from "@/components/forms";
import { requireMember } from "@/lib/auth";
import { listRecentHomes } from "@/lib/data";
import { plural, timeAgo } from "@/lib/format";

export default async function HomePage() {
  await requireMember();
  const homes = await listRecentHomes();

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">What&apos;s that house really like?</h1>
          <p className="text-muted">
            Paste a HouseSigma listing link to rate the home and see what other house hunters think.
          </p>
        </div>
        <PasteLinkForm />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold tracking-wide text-muted uppercase">Recently discussed</h2>
        {homes.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line px-4 py-8 text-center text-sm text-muted">
            No homes yet. Paste a link above to start the first conversation.
          </p>
        ) : (
          <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-white">
            {homes.map((home) => (
              <li key={home.id}>
                <Link
                  href={`/home/${home.citySlug}/${home.addressSlug}`}
                  className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-brand-soft/40"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{home.address}</p>
                    <p className="text-sm text-muted">{home.city}</p>
                  </div>
                  <div className="shrink-0 text-right text-xs text-muted">
                    <p>
                      {plural(home.commentCount, "comment")} · {plural(home.ratingCount, "rating")}
                    </p>
                    <p>{timeAgo(home.lastActivity)}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
