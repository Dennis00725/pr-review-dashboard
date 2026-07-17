import React from 'react';
import useAsync from 'react-use/lib/useAsync';
import {
  Page,
  Header,
  Content,
  Progress,
  ResponseErrorPanel,
  ContentHeader,
} from '@backstage/core-components';
import { useApi, configApiRef } from '@backstage/core-plugin-api';
import { prReviewApiRef } from '../../api';
import { PullRequestTable } from './PullRequestTable';

/**
 * Standalone page listing open PRs across every repo configured under
 * `prReviewDashboard.repositories` in app-config.yaml. Intended for the
 * sidebar as an org/team-wide "what needs my review today" view.
 */
export const PrReviewDashboardPage = () => {
  const prReviewApi = useApi(prReviewApiRef);
  const configApi = useApi(configApiRef);

  const repos = configApi.getOptionalStringArray(
    'prReviewDashboard.repositories',
  ) ?? [];

  const { value, loading, error } = useAsync(
    () => prReviewApi.getReviewablePullRequests(repos),
    [repos],
  );

  return (
    <Page themeId="tool">
      <Header
        title="PR review dashboard"
        subtitle="Open pull requests waiting on a review, oldest first"
      />
      <Content>
        <ContentHeader title={`Tracking ${repos.length} repositories`} />
        {loading && <Progress />}
        {error && <ResponseErrorPanel error={error} />}
        {value && <PullRequestTable pullRequests={value} />}
      </Content>
    </Page>
  );
};
