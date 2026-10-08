import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

/** Only Google accounts on this domain may sign in. */
const ALLOWED_DOMAIN = "navina.ai";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      authorization: {
        params: {
          // drive.file only reaches files this app creates, so a brief can
          // become a Doc in the user's own Drive without reading anything else.
          scope: "openid email profile https://www.googleapis.com/auth/drive.file",
          // Offline + consent is what makes Google hand back a refresh token.
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  // JWT sessions (no database adapter) keep this edge-compatible so the
  // session can be checked in proxy.ts.
  session: { strategy: "jwt" },
  trustHost: true,
  pages: { signIn: "/signin", error: "/signin" },
  callbacks: {
    // Kept in the encrypted session cookie, not in `session`: the session is
    // served to the browser, and these tokens must stay server-side. Routes
    // read them with getToken (see src/lib/google-doc.ts).
    jwt({ token, account }) {
      if (account?.access_token) {
        token.googleAccessToken = account.access_token;
        token.googleExpiresAt = account.expires_at;
        if (account.refresh_token) token.googleRefreshToken = account.refresh_token;
      }
      return token;
    },
    signIn({ profile }) {
      // email_verified must be checked too: without it, the domain suffix
      // alone could be satisfied by an address Google has not confirmed.
      if (!profile?.email_verified) return false;
      const email = profile.email?.toLowerCase() ?? "";
      return email.endsWith(`@${ALLOWED_DOMAIN}`);
    },
  },
});
