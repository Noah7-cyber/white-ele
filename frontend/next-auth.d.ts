import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
      accessToken?: string;
    };
  }

  interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    accessToken?: string;
  }

  interface JWT {
    role?: string;
    roleCheckedAt?: number;
    accessToken?: string;
  }
}
