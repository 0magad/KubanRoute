import NextAuth from "next-auth"
import YandexProvider from "next-auth/providers/yandex"
import GoogleProvider from "next-auth/providers/google"
import { createUserProfileIfNotExists } from "@/lib/user"
 
export const { handlers, auth, signIn, signOut } = NextAuth({
  debug: true,
  trustHost: true,
  providers: [
    YandexProvider({
      clientId: (process.env.YANDEX_CLIENT_ID || "").trim(),
      clientSecret: (process.env.YANDEX_CLIENT_SECRET || "").trim(),
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (!user.id) return false;
      
      await createUserProfileIfNotExists({
        id: user.id,
        email: user.email || "",
        name: user.name || "User",
        avatar_url: user.image || "",
        oauth_provider: account?.provider || "unknown",
      });
      return true;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
  pages: { signIn: '/auth/signin' },
});
