import { AuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        if (!user) {
          return null;
        }

        // Add check for isActive status
        if (!user.isActive) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

        if (!isPasswordValid) {
          return null;
        }
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      }
    })
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
    signOut: '/login',
    error: '/login',
  },
  events: {
    async signIn(message) {
      if (message.isNewUser) {
        await prisma.log.create({
          data: {
            actorId: message.user.id!,
            actorName: message.user.name!,
            action: 'USER_CREATED',
            targetId: message.user.id!,
          }
        });
      } else {
        await prisma.log.create({
          data: {
            actorId: message.user.id!,
            actorName: message.user.name!,
            action: 'USER_LOGIN',
            targetId: message.user.id!,
            details: { message: 'Utilizador iniciou sessão com sucesso' }
          }
        });
      }
    },
    async signOut(message) {
      await prisma.log.create({
        data: {
          actorId: message.token.sub!,
          actorName: message.token.name!,
          action: 'USER_LOGOUT',
          targetId: message.token.sub!,
          details: { message: 'Utilizador terminou sessão com sucesso' }
        }
      });
    }
  }
};