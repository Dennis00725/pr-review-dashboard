import {
  createApiFactory,
  createComponentExtension,
  createPlugin,
  createRoutableExtension,
  githubAuthApiRef,
} from '@backstage/core-plugin-api';
import { prReviewApiRef, GithubPrReviewApi } from './api';
import { rootRouteRef } from './routes';

export const prReviewDashboardPlugin = createPlugin({
  id: 'pr-review-dashboard',
  apis: [
    createApiFactory({
      api: prReviewApiRef,
      deps: { githubAuthApi: githubAuthApiRef },
      factory: ({ githubAuthApi }) =>
        new GithubPrReviewApi({ githubAuthApi }),
    }),
  ],
  routes: {
    root: rootRouteRef,
  },
});

/**
 * Full standalone page, mounted in the app sidebar — e.g. at /pr-reviews.
 */
export const PrReviewDashboardPage = prReviewDashboardPlugin.provide(
  createRoutableExtension({
    name: 'PrReviewDashboardPage',
    component: () =>
      import('./components/PRReviewDashboard').then(
        m => m.PrReviewDashboardPage,
      ),
    mountPoint: rootRouteRef,
  }),
);

/**
 * Compact card variant for embedding on a catalog entity's overview page,
 * scoped to the repositories declared on that entity's annotations.
 */
export const EntityPrReviewCard = prReviewDashboardPlugin.provide(
  createComponentExtension({
    name: 'EntityPrReviewCard',
    component: {
      lazy: () =>
        import('./components/PRReviewDashboard').then(
          m => m.EntityPrReviewCard,
        ),
    },
  }),
);
