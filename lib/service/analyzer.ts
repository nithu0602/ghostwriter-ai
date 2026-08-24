/**
 * Repository analyzer orchestration service
 * Coordinates GitHub data ingestion and analysis layers
 *
 * Data flow:
 * GitHub data → Validation → Analysis functions → Unified result
 */

import {
  analyzeContributors,
  analyzeOwnership,
  analyzeCollaboration,
  calculateBusFactor,
  calculateKnowledgeSilos,
  calculateEngineeringHealth,
  RepositoryAnalysis,
} from "../analysis";
import {
  GitHubRepositoryData,
  ValidationResult,
  ValidationError,
  InsufficientDataError,
  AnalysisServiceError,
} from "./types";
import { getCached, setCached } from "./cache";

/**
 * Validates GitHub repository data
 *
 * Checks:
 * - Repository metadata exists
 * - At least some contributors exist
 * - At least some commits exist (for meaningful analysis)
 *
 * Warnings but allows:
 * - Empty pull requests (repository may be new)
 * - No pull requests means collaboration analysis will be limited
 */
export function validateGitHubData(data: GitHubRepositoryData): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Critical validation
  if (!data.repository) {
    errors.push("Repository metadata is required");
  }

  if (!data.contributors || data.contributors.length === 0) {
    errors.push("At least one contributor is required for analysis");
  }

  if (!data.commits || data.commits.length === 0) {
    errors.push("At least one commit is required for analysis");
  }

  // Warnings for limited analysis
  if (!data.pullRequests || data.pullRequests.length === 0) {
    warnings.push(
      "No pull request data available; collaboration analysis will be limited"
    );
  }

  // Check for reviewer data
  const hasReviewerData =
    data.pullRequests &&
    data.pullRequests.length > 0 &&
    data.pullRequests.some((pr) => pr.reviewers && pr.reviewers.length > 0);

  if (!hasReviewerData && data.pullRequests && data.pullRequests.length > 0) {
    warnings.push(
      "No reviewer information available; collaboration density may be underestimated"
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Analyzes a GitHub repository and returns comprehensive engineering analysis
 *
 * @param data - Raw GitHub repository data
 * @returns Complete repository analysis with all metrics
 * @throws ValidationError if data is invalid
 * @throws InsufficientDataError if critical data is missing
 * @throws AnalysisServiceError for other service errors
 *
 * The analysis includes:
 * - Contributor analysis with engineering scores
 * - Ownership concentration analysis
 * - Bus factor calculation
 * - Knowledge silo detection
 * - Collaboration graph analysis
 * - Engineering health score
 */
export function analyzeRepository(data: GitHubRepositoryData): RepositoryAnalysis {
  // Validate input data
  const validation = validateGitHubData(data);

  if (!validation.isValid) {
    throw new ValidationError(
      "Invalid GitHub repository data for analysis",
      validation.errors
    );
  }

  // Check for sufficient data (already done in validation, but explicit here)
  if (
    !data.repository ||
    !data.contributors ||
    !data.commits ||
    data.contributors.length === 0 ||
    data.commits.length === 0
  ) {
    throw new InsufficientDataError(
      "Repository data must contain metadata, at least one contributor, and at least one commit"
    );
  }

  try {
    // Run all analysis functions
    const contributors = analyzeContributors(
      data.contributors,
      data.commits,
      data.pullRequests || []
    );

    const ownership = analyzeOwnership(data.commits, data.contributors);

    const busFactor = calculateBusFactor(data.commits);

    const knowledgeSilos = calculateKnowledgeSilos(data.commits);

    const collaboration = analyzeCollaboration(data.pullRequests || []);

    // Calculate engineering health from individual metrics
    const engineeringHealth = calculateEngineeringHealth(
      ownership.ownershipConcentration,
      busFactor.busFactor,
      collaboration.collaborationDensity,
      contributors.totalContributors,
      data.commits.length
    );

    // Combine all results into unified analysis
    const result: RepositoryAnalysis = {
      repository: {
        language: data.repository.language,
        stars: data.repository.stars,
        forks: data.repository.forks,
        openIssues: data.repository.openIssues,
        updatedAt: data.repository.updatedAt,
        visibility: data.repository.visibility,
      },
      contributors,
      ownership,
      busFactor,
      knowledgeSilos,
      collaboration,
      engineeringHealth,
      analyzedAt: new Date().toISOString(),
    };

    return result;
  } catch (error) {
    // Catch unexpected errors and wrap them
    if (error instanceof AnalysisServiceError) {
      throw error;
    }

    throw new AnalysisServiceError(
      "ANALYSIS_FAILED",
      `Repository analysis failed: ${error instanceof Error ? error.message : String(error)}`,
      error
    );
  }
}

/**
 * Analyzes a repository from owner and repo name
 * Convenience wrapper that handles GitHub API calls and orchestrates analysis
 *
 * @param owner - Repository owner
 * @param repo - Repository name
 * @returns Complete repository analysis
 * @throws Various errors if GitHub API calls fail or data is invalid
 */
export async function analyzeRepositoryByName(
  owner: string,
  repo: string
): Promise<RepositoryAnalysis> {
  const cacheKey = `${owner.toLowerCase()}/${repo.toLowerCase()}`;
  const cached = getCached<RepositoryAnalysis>(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    // Import GitHub API functions here to avoid circular dependencies
    const {
      getRepository,
      getContributors,
      getCommits,
      getPullRequests,
    } = await import("../github");

    // Fetch all required data in parallel
    const [repository, contributors, pullRequests] = await Promise.all([
      getRepository(owner, repo),
      getContributors(owner, repo),
      getPullRequests(owner, repo),
    ]);

    // Get commits with the repository's default branch
    const commits = await getCommits(owner, repo, repository.defaultBranch);

    // Compose the data bundle
    const data: GitHubRepositoryData = {
      repository,
      contributors,
      commits,
      pullRequests,
    };

    // Analyze the repository data
    const result = analyzeRepository(data);
    setCached(cacheKey, result);
    return result;
  } catch (error) {
    if (error instanceof AnalysisServiceError) {
      throw error;
    }

    // Wrap GitHub API errors
    throw new AnalysisServiceError(
      "DATA_FETCH_FAILED",
      `Failed to analyze repository: ${error instanceof Error ? error.message : String(error)}`,
      error
    );
  }
}

/**
 * Validates that a GitHub URL is correctly formatted
 *
 * @param url - GitHub repository URL (e.g., https://github.com/owner/repo)
 * @returns true if valid, false otherwise
 */
export function isValidGitHubUrl(url: string): boolean {
  try {
    const { parseGitHubUrl } = require("../github/client");
    parseGitHubUrl(url);
    return true;
  } catch {
    return false;
  }
}
