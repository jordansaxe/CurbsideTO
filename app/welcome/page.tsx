import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { HandleForm } from "@/components/forms";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Pick a handle" };

export default async function WelcomePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.handle) redirect("/");

  return (
    <div className="mx-auto max-w-sm space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Pick a handle</h1>
        <p className="text-sm text-muted">
          This is the name shown on your ratings and comments. Your email is never displayed. Handles can&apos;t be
          changed later, so skip your real name if you&apos;d like to stay anonymous.
        </p>
      </div>
      <HandleForm />
    </div>
  );
}
