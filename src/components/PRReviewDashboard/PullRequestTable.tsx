import React from 'react';
import { Table, TableColumn, Link, StatusWarning, StatusOK } from '@backstage/core-components';
import Avatar from '@material-ui/core/Avatar';
import Chip from '@material-ui/core/Chip';
import Box from '@material-ui/core/Box';
import { ReviewablePullRequest } from '../../api';

function formatAge(hours: number): string {
  if (hours < 1) return '<1h';
  if (hours < 48) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
}

const columns: TableColumn<ReviewablePullRequest>[] = [
  {
    title: 'Pull request',
    field: 'title',
    render: row => (
      <Link to={row.url}>
        #{row.number} {row.title}
      </Link>
    ),
  },
  {
    title: 'Repository',
    field: 'repoFullName',
  },
  {
    title: 'Author',
    field: 'author',
    render: row => (
      <Box display="flex" alignItems="center" gridGap={8}>
        <Avatar
          src={row.authorAvatarUrl}
          alt={row.author}
          style={{ width: 24, height: 24 }}
        />
        {row.author}
      </Box>
    ),
  },
  {
    title: 'Waiting',
    field: 'ageInHours',
    render: row =>
      row.isStale ? (
        <StatusWarning>{formatAge(row.ageInHours)}</StatusWarning>
      ) : (
        <StatusOK>{formatAge(row.ageInHours)}</StatusOK>
      ),
  },
  {
    title: 'Reviewers',
    field: 'reviewers',
    render: row =>
      row.reviewers.length
        ? row.reviewers.map(r => (
            <Chip key={r} label={r} size="small" style={{ marginRight: 4 }} />
          ))
        : '—',
  },
];

type Props = {
  pullRequests: ReviewablePullRequest[];
  title?: string;
};

export const PullRequestTable = ({ pullRequests, title }: Props) => (
  <Table
    title={title ?? `Awaiting review (${pullRequests.length})`}
    options={{ search: true, paging: pullRequests.length > 10, padding: 'dense' }}
    columns={columns}
    data={pullRequests}
  />
);
