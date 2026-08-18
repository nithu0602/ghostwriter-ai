/**
 * GitHub REST API client
 * Handles authentication, headers, and error handling
 */

import {
  GitHubError,
  GitHubRateLimitError,
  GitHubNotFoundError,
} from "./types";

const GITHUB_API_BASE = "https://api.github.com";
const GITHUB_API_VERSION = "2026-03-10";

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  body?: unknown;
}

export async function githubFetch<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const url = `${GITHUB_API_BASE}${endpoint}`;

  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": GITHUB_API_VERSION,
  };

  // Only add Authorization header on server side
  if (typeof window === "undefined" && process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const init: RequestInit = {
    method: options.method || "GET",
    headers,
  };

  if (options.body) {
    init.body = JSON.stringify(options.body);
    headers["Content-Type"] = "application/json";
  }

  let response: Response;
  try {
    response = await fetch(url, init);
  } catch (error) {
    throw new GitHubError(0, `Failed to fetch from GitHub API: ${error}`);
  }

  // Handle specific status codes
  if (response.status === 404) {
    throw new GitHubNotFoundError(endpoint);
  }

  if (response.status === 403) {
    // Check if it's a rate limit error
    const data = await response.json().catch(() => ({}));
    if (
      data.message?.includes("API rate limit exceeded") ||
      data.message?.includes("rate limit")
    ) {
      throw new GitHubRateLimitError();
    }
    throw new GitHubError(403, `GitHub API access forbidden: ${data.message}`);
  }

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new GitHubError(
      response.status,
      `GitHub API error: ${data.message || response.statusText}`,
      data
    );
  }

  // Parse successful response
  const data: T = await response.json();
  return data;
}

/**
 * Parse GitHub repository URL
 * Supports: https://github.com/owner/repo
 * Returns: { owner, repo }
 */
export function parseGitHubUrl(url: string): { owner: string; repo: string } {
  try {
    // Remove trailing slash and .git
    let cleaned = url.trim().replace(/\.git$/, "").replace(/\/$/, "");

    // Extract from full URL
    const match = cleaned.match(
      /(?:https?:\/\/)?(?:www\.)?github\.com\/([^/]+)\/([^/]+)/i
    );

    if (!match) {
      throw new Error("Invalid GitHub URL format");
    }

    const [, owner, repo] = match;

    if (!owner || !repo) {
      throw new Error("Could not extract owner and repo from URL");
    }

    return { owner, repo };
  } catch (error) {
    throw new GitHubError(
      400,
      `Invalid GitHub URL: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
