import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import { signOut } from "@/app/actions";
import { getCurrentUser } from "@/lib/auth";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "CurbsideTO", template: "%s · CurbsideTO" },
  description: "Honest ratings and comments on GTA homes, from people who've actually seen them.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser();

  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <header className="border-b border-line bg-white">
          <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-3">
            <Link href="/" className="text-lg font-semibold tracking-tight">
              Curbside<span className="text-brand">TO</span>
            </Link>
            {user ? (
              <form action={signOut} className="flex items-center gap-3 text-sm">
                {user.handle && <span className="text-muted">@{user.handle}</span>}
                <button className="cursor-pointer text-muted underline-offset-2 hover:text-ink hover:underline">
                  Sign out
                </button>
              </form>
            ) : (
              <Link href="/login" className="text-sm font-medium text-brand hover:text-brand-dark">
                Sign in
              </Link>
            )}
          </div>
        </header>

        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">{children}</main>

        <footer className="border-t border-line">
          <div className="mx-auto w-full max-w-3xl space-y-1 px-4 py-5 text-xs text-muted">
            <p>
              CurbsideTO is an independent community site. It is not affiliated with, endorsed by, or connected to
              HouseSigma. Comments are members&apos; personal opinions.
            </p>
            <p>
              <Link href="/guidelines" className="underline underline-offset-2 hover:text-ink">
                Community guidelines
              </Link>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
