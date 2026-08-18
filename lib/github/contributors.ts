/**
 * Fetch GitHub repository contributors
 * Fetches up to 100 contributors
 */

import { githubFetch } from "./client";
import { GitHubContributor } from "./types";

interface GitHubContributorResponse {
  login: string;
  name?: string | null;
  avatar_url: string;
  contributions: number;
}

export async function getContributors(
  owner: string,
  repo: string
): Promise<GitHubContributor[]> {
  const response = await githubFetch<GitHubContributorResponse[]>(
    `/repos/${owner}/${repo}/contributors?per_page=100&page=1`
  );

  return response.map((contributor) => ({
    login: contributor.login,
    name: contributor.name || null,
    avatarUrl: contributor.avatar_url,
    contributions: contributor.contributions,
  }));
}
