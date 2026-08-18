/**
 * Contributor analysis
 * Calculates contribution metrics and scores based on available GitHub data
 */

import {
  GitHubContributor,
  GitHubCommit,
  GitHubPullRequest,
} from "../github/types";
import {
  AnalyzedContributor,
  ContributorAnalysisResult,
  DataQuality,
} from "./types";

/**
 * Analyzes contributors and calculates engineering scores
 *
 * Contribution Score Formula (0-100):
 * The score combines multiple signals:
 * 1. Commit contribution: 40% weight
 * 2. Pull request creation: 30% weight
 * 3. PR merges: 20% weight
 * 4. Review participation: 10% weight
 *
 * This avoids treating raw commit count as the only measure of impact.
 * Merge activity shows code quality; PR creation shows initiative;
 * review participation shows collaboration.
 *
 * Score = (commitScore * 0.40) + (prScore * 0.30) + (mergedPrScore * 0.20) + (reviewScore * 0.10)
 */
export function analyzeContributors(
  contributors: GitHubContributor[],
  commits: GitHubCommit[],
  pullRequests: GitHubPullRequest[]
): ContributorAnalysisResult {
  if (contributors.length === 0) {
    return {
      topContributors: [],
      totalContributors: 0,
      dataQuality: "unavailable",
    };
  }

  // Count commits per contributor login
  const commitsByContributor = new Map<string, number>();
  commits.forEach((commit) => {
    if (commit.authorLogin) {
      commitsByContributor.set(
        commit.authorLogin,
        (commitsByContributor.get(commit.authorLogin) || 0) + 1
      );
    }
  });

  // Count PRs and merged PRs per author
  const prsByAuthor = new Map<string, number>();
  const mergedPrsByAuthor = new Map<string, number>();
  const reviewsByContributor = new Map<string, Set<string>>();

  pullRequests.forEach((pr) => {
    if (pr.author) {
      prsByAuthor.set(pr.author, (prsByAuthor.get(pr.author) || 0) + 1);

      if (pr.state === "closed" && pr.mergedAt) {
        mergedPrsByAuthor.set(
          pr.author,
          (mergedPrsByAuthor.get(pr.author) || 0) + 1
        );
      }
    }

    // Track review participation
    pr.reviewers.forEach((reviewer) => {
      if (!reviewsByContributor.has(reviewer)) {
        reviewsByContributor.set(reviewer, new Set());
      }
      reviewsByContributor.get(reviewer)!.add(pr.author || "unknown");
    });
  });

  // Calculate total contributions for percentages
  const totalContributions = Array.from(commitsByContributor.values()).reduce(
    (a, b) => a + b,
    0
  );

  // Analyze each contributor
  const analyzed: AnalyzedContributor[] = contributors.map((contributor) => {
    const commits = commitsByContributor.get(contributor.login) || 0;
    const prs = prsByAuthor.get(contributor.login) || 0;
    const mergedPrs = mergedPrsByAuthor.get(contributor.login) || 0;
    const reviewCount = reviewsByContributor.get(contributor.login)?.size || 0;

    // Calculate normalized scores (0-100)
    const maxCommits = Math.max(
      1,
      ...Array.from(commitsByContributor.values())
    );
    const maxPrs = Math.max(1, ...Array.from(prsByAuthor.values()), 1);
    const maxMergedPrs = Math.max(
      1,
      ...Array.from(mergedPrsByAuthor.values()),
      1
    );
    const maxReviews = Math.max(1, ...Array.from(reviewsByContributor.values()).map(s => s.size), 1);

    const commitScore = (commits / maxCommits) * 100;
    const prScore = (prs / maxPrs) * 100;
    const mergedPrScore = (mergedPrs / maxMergedPrs) * 100;
    const reviewScore = (reviewCount / maxReviews) * 100;

    // Weighted combination
    const engineeringScore =
      commitScore * 0.4 + prScore * 0.3 + mergedPrScore * 0.2 + reviewScore * 0.1;

    const contributionPercentage =
      totalContributions > 0 ? (commits / totalContributions) * 100 : 0;

    return {
      login: contributor.login,
      name: contributor.name,
      avatarUrl: contributor.avatarUrl,
      contributions: contributor.contributions,
      commitCount: commits,
      prCount: prs,
      mergedPrCount: mergedPrs,
      reviewParticipation: reviewCount,
      contributionPercentage,
      engineeringScore: Math.round(engineeringScore * 10) / 10, // Round to 1 decimal
    };
  });

  // Sort by engineering score descending
  analyzed.sort((a, b) => b.engineeringScore - a.engineeringScore);

  // Determine data quality
  let dataQuality: DataQuality = "complete";
  if (reviewsByContributor.size === 0 && pullRequests.length > 0) {
    dataQuality = "limited"; // Review data not available
  }
  if (commits.length === 0) {
    dataQuality = "limited"; // No commit data
  }

  return {
    topContributors: analyzed,
    totalContributors: contributors.length,
    dataQuality,
  };
}
