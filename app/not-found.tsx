import Link from "next/link";

export default function NotFound() {
  return (
    <div className="space-y-3 py-10 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">We couldn&apos;t find that page</h1>
      <p className="text-sm text-muted">
        To open a home, paste its HouseSigma link on the{" "}
        <Link href="/" className="text-brand underline underline-offset-2">
          front page
        </Link>
        .
      </p>
    </div>
  );
}
