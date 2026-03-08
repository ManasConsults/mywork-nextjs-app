import type { DefaultSession, DefaultUser } from 'next-auth';
import type { DefaultJWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: string;
      moduleWork: boolean;
      moduleFinance: boolean;
      employmentType: string;
      currency: string;
    } & DefaultSession['user'];
  }

  interface User extends DefaultUser {
    role: string;
    moduleWork: boolean;
    moduleFinance: boolean;
    employmentType: string;
    currency?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string;
    role: string;
    moduleWork: boolean;
    moduleFinance: boolean;
    employmentType: string;
    currency: string;
  }
}
