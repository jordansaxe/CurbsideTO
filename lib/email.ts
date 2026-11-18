import "server-only";

export async function sendLoginEmail(email: string, link: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("RESEND_API_KEY is not set, so sign-in emails cannot be sent");
    }
    console.log(`\n[dev] Sign-in link for ${email}:\n${link}\n`);
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: "Your CurbsideTO sign-in link",
      text: `Sign in to CurbsideTO:\n\n${link}\n\nThis link works once and expires in 15 minutes. If you didn't ask for it, you can ignore this email.`,
    }),
  });
  if (!response.ok) {
    throw new Error(`Sign-in email failed to send (${response.status})`);
  }
}
