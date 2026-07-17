import { OAuthApi } from '@backstage/core-plugin-api';
import { PrReviewApi, ReviewablePullRequest } from './types';

const STALE_THRESHOLD_HOURS = 48;

type GithubPullRequest = {
  id: number;
  number: number;
  title: string;
  html_url: string;
  draft: boolean;
  created_at: string;
  updated_at: string;
  user: { login: string; avatar_url?: string } | null;
  requested_reviewers?: { login: string }[];
  labels?: { name: string }[];
};

type Options = {
  githubAuthApi: OAuthApi;
  baseUrl?: string;
};

/**
 * Fetches open, non-draft pull requests from the GitHub REST API for a set
 * of "owner/repo" strings and normalises them into ReviewablePullRequest
 * objects the dashboard component can render, sorted oldest-first so the
 * PRs that have been waiting longest surface at the top.
 */
export class GithubPrReviewApi implements PrReviewApi {
  private readonly githubAuthApi: OAuthApi;
  private readonly baseUrl: string;

  constructor(options: Options) {
    this.githubAuthApi = options.githubAuthApi;
    this.baseUrl = options.baseUrl ?? 'https://api.github.com';
  }

  async getReviewablePullRequests(
    repos: string[],
  ): Promise<ReviewablePullRequest[]> {
    const token = await this.githubAuthApi.getAccessToken(['repo']);

    const results = await Promise.all(
      repos.map(repo => this.fetchOpenPullRequests(repo, token)),
    );

    return results
      .flat()
      .filter(pr => !pr.isDraft)
      .sort((a, b) => b.ageInHours - a.ageInHours);
  }

  private async fetchOpenPullRequests(
    repoFullName: string,
    token: string,
  ): Promise<ReviewablePullRequest[]> {
    const response = await fetch(
      `${this.baseUrl}/repos/${repoFullName}/pulls?state=open&per_page=50`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
        },
      },
    );

    if (!response.ok) {
      throw new Error(
        `Failed to fetch pull requests for ${repoFullName}: ${response.status} ${response.statusText}`,
      );
    }

    const pulls: GithubPullRequest[] = await response.json();

    return pulls.map(pr => this.toReviewablePullRequest(pr, repoFullName));
  }

  private toReviewablePullRequest(
    pr: GithubPullRequest,
    repoFullName: string,
  ): ReviewablePullRequest {
    const ageInHours =
      (Date.now() - new Date(pr.created_at).getTime()) / (1000 * 60 * 60);

    return {
      id: pr.id,
      number: pr.number,
      title: pr.title,
      url: pr.html_url,
      repoFullName,
      author: pr.user?.login ?? 'unknown',
      authorAvatarUrl: pr.user?.avatar_url,
      createdAt: pr.created_at,
      updatedAt: pr.updated_at,
      ageInHours: Math.round(ageInHours),
      isDraft: pr.draft,
      isStale: ageInHours >= STALE_THRESHOLD_HOURS,
      reviewers: (pr.requested_reviewers ?? []).map(r => r.login),
      labels: (pr.labels ?? []).map(l => l.name),
    };
  }
}
