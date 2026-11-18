import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { verifyLogin } from "@/app/actions";

export const metadata: Metadata = { title: "Finish signing in" };

// The link lands on a confirm button rather than signing in directly, so email
// scanners that pre-open links can't use up the one-time token.
export default async function VerifyPage({ searchParams }: PageProps<"/auth/verify">) {
  const { token } = await searchParams;
  if (typeof token !== "string" || !token) redirect("/login?error=link");

  return (
    <div className="mx-auto max-w-sm space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Finish signing in</h1>
      <form action={verifyLogin}>
        <input type="hidden" name="token" value={token} />
        <button className="cursor-pointer rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark">
          Sign in to CurbsideTO
        </button>
      </form>
    </div>
  );
}
