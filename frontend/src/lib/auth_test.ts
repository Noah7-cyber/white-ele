/* eslint-disable @typescript-eslint/no-explicit-any */
// This is a mock authentication setup for development and testing purposes.

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
        if (!credentials?.email) return null;

        // Simulate random role for testing
        // const roles = ['admin', 'staff', 'parent'];
        // const randomRole = roles[Math.floor(Math.random() * roles.length)];

        return {
          id: '1',
          name: 'Test User',
          email: credentials.email,
          role: 'admin',
          accessToken: 'test-token',
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      // Assign role and token on login
      if (user) {
        token.role = user.role;
        token.accessToken = user.accessToken;
        token.roleCheckedAt = Date.now();
      }
      return token;
    },

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
    maxAge: 60 * 60, // 1 hour for testing role switching
  },

  secret: 'test-secret-for-dev', // prevents NO_SECRET warning
};
