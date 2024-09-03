// src/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { AuthOptions } from 'next-auth';

// Extend Session type to include accessToken
interface ExtendedSession {
  accessToken?: string;
}

// Your auth options configuration
export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      authorization: {
        params: {
          scope: 'openid profile email https://www.googleapis.com/auth/gmail.readonly',
        },
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      (session as ExtendedSession).accessToken = token.accessToken as string;
      return session;
    },
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
        // Ensure id_token is included if necessary
        token.idToken = account.id_token;
      }
      return token;
    },
  },
};

// Create handlers for GET and POST requests
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
