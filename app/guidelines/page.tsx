import type { Metadata } from "next";

export const metadata: Metadata = { title: "Community guidelines" };

const RULES = [
  ["Talk about the property, not the people.", "No names, photos or personal details of owners, tenants or neighbours."],
  ["Share what you saw or know first-hand.", "Say so when something is a guess or second-hand."],
  ["Be honest about who you are.", "If you're the owner, the listing agent or otherwise have a stake in the sale, say it in your comment."],
  ["Don't paste listing data.", "No MLS photos, descriptions or sold prices. Link to HouseSigma instead."],
  ["Keep it civil.", "No harassment, discrimination or comments about who 'should' live in a neighbourhood."],
];

export default function GuidelinesPage() {
  return (
    <article className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Community guidelines</h1>
      <p className="text-sm text-muted">
        These are real homes that real people live in. A few rules keep CurbsideTO useful and fair.
      </p>
      <ol className="space-y-4">
        {RULES.map(([title, detail], index) => (
          <li key={title} className="flex gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-soft text-sm font-semibold text-brand-dark">
              {index + 1}
            </span>
            <div>
              <p className="font-medium">{title}</p>
              <p className="text-sm text-muted">{detail}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="text-sm text-muted">
        See something that breaks these? Use the Report link on the comment and it will be reviewed.
      </p>
    </article>
  );
}
