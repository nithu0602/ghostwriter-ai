/**
 * Fetch GitHub repository metadata
 */

import { githubFetch } from "./client";
import { RepositoryMetadata } from "./types";

interface GitHubRepoResponse {
  owner: {
    login: string;
  };
  name: string;
  full_name: string;
  description: string | null;
  default_branch: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  created_at: string;
  updated_at: string;
}

export async function getRepository(
  owner: string,
  repo: string
): Promise<RepositoryMetadata> {
  const response = await githubFetch<GitHubRepoResponse>(
    `/repos/${owner}/${repo}`
  );

  return {
    owner: response.owner.login,
    name: response.name,
    fullName: response.full_name,
    description: response.description,
    defaultBranch: response.default_branch,
    language: response.language,
    stars: response.stargazers_count,
    forks: response.forks_count,
    openIssues: response.open_issues_count,
    createdAt: response.created_at,
    updatedAt: response.updated_at,
  };
}
