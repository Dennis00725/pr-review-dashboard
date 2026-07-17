import { GithubPrReviewApi } from './GithubPrReviewApi';
import { OAuthApi } from '@backstage/core-plugin-api';

const mockAuthApi: jest.Mocked<OAuthApi> = {
  getAccessToken: jest.fn().mockResolvedValue('fake-token'),
} as any;

function githubPr(overrides: Partial<Record<string, any>> = {}) {
  return {
    id: 1,
    number: 42,
    title: 'Fix flaky test',
    html_url: 'https://github.com/volvo-cars/example/pull/42',
    draft: false,
    created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3h ago
    updated_at: new Date().toISOString(),
    user: { login: 'octocat', avatar_url: 'https://example.com/a.png' },
    requested_reviewers: [{ login: 'reviewer1' }],
    labels: [{ name: 'bug' }],
    ...overrides,
  };
}

describe('GithubPrReviewApi', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it('normalises open pull requests and marks recent ones as not stale', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [githubPr()],
    }) as any;

    const api = new GithubPrReviewApi({ githubAuthApi: mockAuthApi });
    const result = await api.getReviewablePullRequests(['volvo-cars/example']);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      number: 42,
      author: 'octocat',
      repoFullName: 'volvo-cars/example',
      isStale: false,
      reviewers: ['reviewer1'],
    });
  });

  it('flags pull requests older than the stale threshold', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        githubPr({
          created_at: new Date(
            Date.now() - 72 * 60 * 60 * 1000,
          ).toISOString(), // 72h ago
        }),
      ],
    }) as any;

    const api = new GithubPrReviewApi({ githubAuthApi: mockAuthApi });
    const [pr] = await api.getReviewablePullRequests(['volvo-cars/example']);

    expect(pr.isStale).toBe(true);
  });

  it('excludes draft pull requests from the result', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [githubPr({ draft: true })],
    }) as any;

    const api = new GithubPrReviewApi({ githubAuthApi: mockAuthApi });
    const result = await api.getReviewablePullRequests(['volvo-cars/example']);

    expect(result).toHaveLength(0);
  });

  it('sorts pull requests oldest-first across multiple repos', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          githubPr({
            id: 1,
            number: 1,
            created_at: new Date(
              Date.now() - 5 * 60 * 60 * 1000,
            ).toISOString(),
          }),
        ],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          githubPr({
            id: 2,
            number: 2,
            created_at: new Date(
              Date.now() - 50 * 60 * 60 * 1000,
            ).toISOString(),
          }),
        ],
      }) as any;

    const api = new GithubPrReviewApi({ githubAuthApi: mockAuthApi });
    const result = await api.getReviewablePullRequests([
      'volvo-cars/repo-a',
      'volvo-cars/repo-b',
    ]);

    expect(result.map(pr => pr.number)).toEqual([2, 1]);
  });

  it('throws a descriptive error when the GitHub API responds with an error status', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 403,
      statusText: 'Forbidden',
    }) as any;

    const api = new GithubPrReviewApi({ githubAuthApi: mockAuthApi });

    await expect(
      api.getReviewablePullRequests(['volvo-cars/example']),
    ).rejects.toThrow(/403/);
  });
});
