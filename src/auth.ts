import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

/** Only Google accounts on this domain may sign in. */
const ALLOWED_DOMAIN = "navina.ai";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  // JWT sessions (no database adapter) keep this edge-compatible so the
  // session can be checked in proxy.ts.
  session: { strategy: "jwt" },
  trustHost: true,
  pages: { signIn: "/signin", error: "/signin" },
  callbacks: {
    signIn({ profile }) {
      // email_verified must be checked too: without it, the domain suffix
      // alone could be satisfied by an address Google has not confirmed.
      if (!profile?.email_verified) return false;
      const email = profile.email?.toLowerCase() ?? "";
      return email.endsWith(`@${ALLOWED_DOMAIN}`);
    },
  },
});
