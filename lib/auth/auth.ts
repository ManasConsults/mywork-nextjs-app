import CredentialsProvider from 'next-auth/providers/credentials';
import GitHubProvider from 'next-auth/providers/github';
import GoogleProvider from 'next-auth/providers/google';
import FacebookProvider from 'next-auth/providers/facebook';
import type { NextAuthOptions, User } from 'next-auth';

import { prisma } from '@/lib/db/prisma';
import { verifyPassword } from '@/lib/auth/passwords';
import { loginSchema } from '@/lib/schemas/auth.schema';
import { sendRegistrationPendingEmail } from '@/lib/email/notifications';

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },

  pages: {
    signIn: '/login',
    error: '/login',
  },

  providers: [
    CredentialsProvider({
      name: 'Email',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials): Promise<User | null> {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        });

        if (!user || !user.isActive || !user.passwordHash) return null;

        const valid = await verifyPassword(parsed.data.password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,
          image: user.image ?? undefined,
          role: user.role,
          moduleWork: user.moduleWork,
          moduleFinance: user.moduleFinance,
          employmentType: user.employmentType,
        };
      },
    }),

    GitHubProvider({
      clientId: process.env.GITHUB_ID ?? '',
      clientSecret: process.env.GITHUB_SECRET ?? '',
    }),

    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    }),

    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID ?? '',
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET ?? '',
    }),
  ],

  callbacks: {
    async jwt({ token, user, account }) {
      // On first sign-in `user` is populated — persist extra fields to token.
      if (user) {
        if (account?.provider !== 'credentials' && user.email) {
          // OAuth: look up DB record to get our UUID and custom fields.
          const dbUser = await prisma.user.findUnique({ where: { email: user.email } });
          token.id = dbUser?.id ?? user.id;
          token.role = dbUser?.role ?? 'MEMBER';
          token.moduleWork = dbUser?.moduleWork ?? true;
          token.moduleFinance = dbUser?.moduleFinance ?? true;
          token.employmentType = dbUser?.employmentType ?? 'EMPLOYED';
        } else {
          token.id = user.id;
          token.role = (user as User & { role?: string }).role ?? 'MEMBER';
          token.moduleWork = (user as User & { moduleWork?: boolean }).moduleWork ?? true;
          token.moduleFinance = (user as User & { moduleFinance?: boolean }).moduleFinance ?? true;
          token.employmentType = (user as User & { employmentType?: string }).employmentType ?? 'EMPLOYED';
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.moduleWork = token.moduleWork as boolean;
        session.user.moduleFinance = token.moduleFinance as boolean;
        session.user.employmentType = token.employmentType as string;
      }
      return session;
    },
    async signIn({ user, account }) {
      // For OAuth providers: sync user to DB and enforce admin-approval gate
      if (account?.provider !== 'credentials' && user.email) {
        let dbUser = await prisma.user.findUnique({ where: { email: user.email } });

        if (!dbUser) {
          // New OAuth user — create pending, then notify
          dbUser = await prisma.user.create({
            data: {
              email: user.email,
              name: user.name ?? null,
              image: user.image ?? null,
              role: 'MEMBER',
              isActive: false,
            },
          });
          try {
            await sendRegistrationPendingEmail(user.email, user.name ?? null);
          } catch { /* email failure is non-fatal */ }
        } else {
          // Returning OAuth user — keep profile in sync
          await prisma.user.update({
            where: { email: user.email },
            data: { name: user.name ?? undefined, image: user.image ?? undefined },
          });
        }

        if (!dbUser.isActive) return false;
      }
      return true;
    },
  },
};
