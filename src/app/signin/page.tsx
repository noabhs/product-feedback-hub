import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";

const ERRORS: Record<string, string> = {
  AccessDenied: "That account isn't a Navina account. Sign in with your @navina.ai email.",
  Configuration: "Sign-in isn't configured correctly. Check the Google credentials.",
  Verification: "That sign-in link has expired. Try again.",
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const { callbackUrl, error } = await searchParams;

  const session = await auth();
  if (session) redirect(callbackUrl || "/home");

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-app p-6">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-lg border border-[rgba(50,43,95,0.08)] shadow-sm p-8">
          <h1 className="text-[22px] font-extrabold text-brand-primary mb-1">Navina Insights Hub</h1>
          <p className="text-[14px] text-brand-primary mb-6" style={{ opacity: 0.6 }}>
            Sign in with your Navina Google account to continue.
          </p>

          {error && (
            <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-3 py-2.5">
              <p className="text-[13px] text-red-700">{ERRORS[error] ?? "Couldn't sign you in. Please try again."}</p>
            </div>
          )}

          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: callbackUrl || "/home" });
            }}
          >
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2.5 rounded-md border border-[rgba(50,43,95,0.15)] bg-white px-4 py-2.5 text-[14px] font-medium text-brand-primary transition-colors hover:bg-[rgba(50,43,95,0.03)]"
            >
              <GoogleMark />
              Continue with Google
            </button>
          </form>

          <p className="mt-6 text-[12px] text-brand-primary" style={{ opacity: 0.4 }}>
            Access is restricted to @navina.ai accounts.
          </p>
        </div>
      </div>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg width="17" height="17" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.91c1.7-1.57 2.69-3.88 2.69-6.62Z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.91-2.26c-.81.54-1.84.86-3.05.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.34A8.99 8.99 0 0 0 9 18Z" />
      <path fill="#FBBC05" d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.94H.96a8.99 8.99 0 0 0 0 8.12l3.01-2.34Z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A8.99 8.99 0 0 0 .96 4.94l3.01 2.34C4.68 5.16 6.66 3.58 9 3.58Z" />
    </svg>
  );
}
