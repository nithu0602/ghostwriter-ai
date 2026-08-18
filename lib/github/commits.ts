/**
 * Fetch GitHub repository commits
 * Fetches up to 100 recent commits from the default branch
 */

import { githubFetch } from "./client";
import { GitHubCommit, RepositoryMetadata } from "./types";

interface GitHubCommitResponse {
  sha: string;
  commit: {
    message: string;
    author?: {
      name: string;
      date: string;
    };
  };
  author?: {
    login: string;
  };
  files?: Array<{
    changes: number;
  }>;
}

export async function getCommits(
  owner: string,
  repo: string,
  defaultBranch: string = "main"
): Promise<GitHubCommit[]> {
  // First, try to get the actual default branch
  let branch = defaultBranch;

  try {
    const response = await githubFetch<GitHubCommitResponse[]>(
      `/repos/${owner}/${repo}/commits?per_page=100&page=1${
        branch ? `&sha=${branch}` : ""
      }`
    );

    return response.map((commit) => {
      // Count changed files
      const changedFiles = commit.files?.length || 0;

      return {
        sha: commit.sha,
        message: commit.commit.message,
        authorLogin: commit.author?.login || null,
        authorName: commit.commit.author?.name || null,
        authorDate: commit.commit.author?.date || new Date().toISOString(),
        changedFiles,
      };
    });
  } catch (error) {
    // If the branch doesn't exist, try without specifying it
    if (branch !== "main" && branch !== "master") {
      const response = await githubFetch<GitHubCommitResponse[]>(
        `/repos/${owner}/${repo}/commits?per_page=100&page=1`
      );

      return response.map((commit) => ({
        sha: commit.sha,
        message: commit.commit.message,
        authorLogin: commit.author?.login || null,
        authorName: commit.commit.author?.name || null,
        authorDate: commit.commit.author?.date || new Date().toISOString(),
        changedFiles: commit.files?.length || 0,
      }));
    }

    throw error;
  }
}
