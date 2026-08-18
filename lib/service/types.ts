/**
 * Service layer types
 * Input and output types for the repository analysis orchestration
 */

import {
  RepositoryMetadata,
  GitHubContributor,
  GitHubCommit,
  GitHubPullRequest,
  GitHubError,
} from "../github/types";
import { RepositoryAnalysis } from "../analysis/types";

/**
 * Raw GitHub data bundle
 * Contains all fetched GitHub data for a repository
 */
export interface GitHubRepositoryData {
  repository: RepositoryMetadata;
  contributors: GitHubContributor[];
  commits: GitHubCommit[];
  pullRequests: GitHubPullRequest[];
}

/**
 * Validation result for GitHub data
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Analysis service error
 */
export class AnalysisServiceError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "AnalysisServiceError";
  }
}

/**
 * Input validation error
 */
export class ValidationError extends AnalysisServiceError {
  constructor(message: string, public validationErrors: string[]) {
    super("VALIDATION_ERROR", message);
    this.name = "ValidationError";
  }
}

/**
 * Insufficient data error
 */
export class InsufficientDataError extends AnalysisServiceError {
  constructor(message: string) {
    super("INSUFFICIENT_DATA", message);
    this.name = "InsufficientDataError";
  }
}
