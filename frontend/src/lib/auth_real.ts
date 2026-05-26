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

        // Decode the JWT access token to extract isVerified and schoolId
        let isVerified = true;
        let schoolId = null;
        if (user.accessToken) {
          try {
            const base64Url = user.accessToken.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(
              atob(base64)
                .split('')
                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
            );
            const decoded = JSON.parse(jsonPayload);
            isVerified = decoded.isVerified ?? true;
            schoolId = decoded.schoolId ?? null;
          } catch (e) {
            console.error('Failed to decode token', e);
          }
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          accessToken: user.accessToken,
          isVerified,
          schoolId,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.role = user.role;
        token.accessToken = (user as { accessToken: string | number }).accessToken;
        token.isVerified = (user as any).isVerified;
        token.schoolId = (user as any).schoolId;
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
        (session.user as any).isVerified = token.isVerified;
        (session.user as any).schoolId = token.schoolId;
      }
      return session;
    },
  },

  session: {
    strategy: 'jwt',
    maxAge: 60 * 60, // 1 hour
  },
};
