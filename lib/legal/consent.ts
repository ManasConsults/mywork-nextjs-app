import { LEGAL_VERSION } from './constants';

export interface ConsentState {
  termsAcceptedAt: Date | null;
  termsVersion: string | null;
}

export function hasAcceptedCurrentTerms({ termsAcceptedAt, termsVersion }: ConsentState): boolean {
  return termsAcceptedAt !== null && termsVersion === LEGAL_VERSION;
}
