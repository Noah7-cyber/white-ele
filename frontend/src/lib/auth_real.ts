/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // Authenticate with backend
        const res = await fetch(`${process.env.API_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(credentials),
        });

        if (!res.ok) return null;
        const user = await res.json();

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          accessToken: user.accessToken,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.role = user.role;
        token.accessToken = (user as { accessToken: string | number }).accessToken;
      }

      if (trigger === 'update' && session?.role) {
        token.role = session.role;
      }

      // Periodic refresh (every 5 mins)
      const now = Date.now();
      const shouldRefresh =
        !token.roleCheckedAt || now - (token.roleCheckedAt as number) > 5 * 60 * 1000;

      if (shouldRefresh && token.accessToken) {
        try {
          const res = await fetch(`${process.env.API_URL}/me`, {
            headers: { Authorization: `Bearer ${token.accessToken}` },
          });

          if (res.ok) {
            const data = await res.json();
            token.role = data.role;
            token.roleCheckedAt = now;
          }
        } catch (err) {
          console.error('Failed to refresh role:', err);
        }
      }

      return token;
    },

    // Runs whenever a session is checked or created
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string;
        (session.user as any).accessToken = token.accessToken;
      }
      return session;
    },
  },

  session: {
    strategy: 'jwt',
    maxAge: 60 * 60, // 1 hour
  },
};
