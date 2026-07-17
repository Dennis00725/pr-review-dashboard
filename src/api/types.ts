/**
 * A single open pull request that is awaiting review, normalised from the
 * GitHub REST API response into the shape the UI components consume.
 */
export type ReviewablePullRequest = {
  id: number;
  title: string;
  url: string;
  number: number;
  repoFullName: string;
  author: string;
  authorAvatarUrl?: string;
  createdAt: string;
  updatedAt: string;
  /** Hours since the PR was opened, used for sorting and the "stale" flag. */
  ageInHours: number;
  isDraft: boolean;
  isStale: boolean;
  reviewers: string[];
  labels: string[];
};

/**
 * Client contract for fetching reviewable pull requests. Defined as an
 * interface (rather than a concrete class) so the real GitHub-backed
 * implementation can be swapped for a mock in tests and storybook-style
 * local development, per Backstage's standard ApiRef pattern.
 */
export interface PrReviewApi {
  getReviewablePullRequests(repos: string[]): Promise<ReviewablePullRequest[]>;
}
