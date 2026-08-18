/**
 * Fetch GitHub repository pull requests
 * Fetches up to 100 recent pull requests, sorted by creation date
 */

import { githubFetch } from "./client";
import { GitHubPullRequest } from "./types";

interface GitHubPullRequestResponse {
  number: number;
  title: string;
  state: "open" | "closed";
  user?: {
    login: string;
  };
  created_at: string;
  merged_at: string | null;
  requested_reviewers?: Array<{
    login: string;
  }>;
}

export async function getPullRequests(
  owner: string,
  repo: string
): Promise<GitHubPullRequest[]> {
  const response = await githubFetch<GitHubPullRequestResponse[]>(
    `/repos/${owner}/${repo}/pulls?state=all&per_page=100&page=1&sort=created&direction=desc`
  );

  return response.map((pr) => ({
    number: pr.number,
    title: pr.title,
    state: pr.state,
    author: pr.user?.login || null,
    createdAt: pr.created_at,
    mergedAt: pr.merged_at,
    reviewers: pr.requested_reviewers?.map((r) => r.login) || [],
  }));
}
