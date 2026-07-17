import { createApiRef } from '@backstage/core-plugin-api';
import { PrReviewApi } from './types';

/**
 * The ApiRef other plugins/components use to look up whichever
 * PrReviewApi implementation is registered in apis.ts (real GitHub client
 * in production, a fixture-backed stub in tests/dev).
 */
export const prReviewApiRef = createApiRef<PrReviewApi>({
  id: 'plugin.pr-review-dashboard.service',
});
