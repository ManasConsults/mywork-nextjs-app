import { LEGAL_VERSION } from './constants';
import { hasAcceptedCurrentTerms } from './consent';

describe('hasAcceptedCurrentTerms', () => {
  it('is false when never accepted', () => {
    expect(hasAcceptedCurrentTerms({ termsAcceptedAt: null, termsVersion: null })).toBe(false);
  });

  it('is false when the version is stale', () => {
    expect(hasAcceptedCurrentTerms({ termsAcceptedAt: new Date(), termsVersion: '2020-01-01' })).toBe(false);
  });

  it('is false when a version is stored without a timestamp', () => {
    expect(hasAcceptedCurrentTerms({ termsAcceptedAt: null, termsVersion: LEGAL_VERSION })).toBe(false);
  });

  it('is true for the current version', () => {
    expect(hasAcceptedCurrentTerms({ termsAcceptedAt: new Date(), termsVersion: LEGAL_VERSION })).toBe(true);
  });
});
