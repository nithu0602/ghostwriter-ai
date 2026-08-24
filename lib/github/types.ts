/**
 * GitHub API response types
 * Only include fields we actually need for analysis
 */

export interface RepositoryMetadata {
  owner: string;
  name: string;
  fullName: string;
  description: string | null;
  defaultBranch: string;
  language: string | null;
  stars: number;
  forks: number;
  openIssues: number;
  createdAt: string;
  updatedAt: string;
  visibility: "Public" | "Private";
}

export interface GitHubContributor {
  login: string;
  name: string | null;
  avatarUrl: string;
  contributions: number;
}

export interface GitHubCommit {
  sha: string;
  message: string;
  authorLogin: string | null;
  authorName: string | null;
  authorDate: string;
}

export interface GitHubPullRequest {
  number: number;
  title: string;
  state: "open" | "closed";
  author: string | null;
  createdAt: string;
  mergedAt: string | null;
  reviewers: string[];
}

/**
 * GitHub API error types
 */
export class GitHubError extends Error {
  constructor(
    public code: number,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "GitHubError";
  }
}

export class GitHubRateLimitError extends GitHubError {
  constructor() {
    super(
      403,
      "GitHub API rate limit reached. Please try again later or provide a valid GITHUB_TOKEN."
    );
    this.name = "GitHubRateLimitError";
  }
}

export class GitHubNotFoundError extends GitHubError {
  constructor(resource: string) {
    super(404, `GitHub resource not found: ${resource}`);
    this.name = "GitHubNotFoundError";
  }
}
