import { Resend } from 'resend';

// Only instantiate when the key is present — new Resend(undefined) throws.
export const resend: Resend | null = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;
