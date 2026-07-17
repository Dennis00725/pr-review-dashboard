import React from 'react';
import useAsync from 'react-use/lib/useAsync';
import { InfoCard, Progress, ResponseErrorPanel } from '@backstage/core-components';
import { useApi } from '@backstage/core-plugin-api';
import { useEntity } from '@backstage/plugin-catalog-react';
import { prReviewApiRef } from '../../api';
import { PullRequestTable } from './PullRequestTable';

const GITHUB_REPO_ANNOTATION = 'github.com/project-slug';

/**
 * Reads the linked repo off the entity's `github.com/project-slug`
 * annotation (the same annotation the built-in GitHub Actions and
 * GitHub Insights plugins use) so it drops into an existing entity page
 * with zero extra config.
 */
export const EntityPrReviewCard = () => {
  const { entity } = useEntity();
  const prReviewApi = useApi(prReviewApiRef);

  const repoSlug = entity.metadata.annotations?.[GITHUB_REPO_ANNOTATION];

  const { value, loading, error } = useAsync(
    () => prReviewApi.getReviewablePullRequests(repoSlug ? [repoSlug] : []),
    [repoSlug],
  );

  if (!repoSlug) {
    return (
      <InfoCard title="Pull requests awaiting review">
        No <code>{GITHUB_REPO_ANNOTATION}</code> annotation set on this
        entity.
      </InfoCard>
    );
  }

  return (
    <InfoCard title="Pull requests awaiting review">
      {loading && <Progress />}
      {error && <ResponseErrorPanel error={error} />}
      {value && <PullRequestTable pullRequests={value} title={undefined} />}
    </InfoCard>
  );
};
