/**
 * Ownership analysis
 * Calculates ownership concentration and distribution
 */

import {
  GitHubContributor,
  GitHubCommit,
} from "../github/types";
import { OwnershipAnalysisResult, DataQuality } from "./types";

/**
 * Analyzes ownership concentration based on commit data
 *
 * Ownership Concentration Formula:
 * Uses Herfindahl-Hirschman Index (HHI) normalized to 0-100
 * HHI = sum of (share_i)^2 for each contributor
 * Normalized = (HHI - min_HHI) / (max_HHI - min_HHI) * 100
 *
 * - 0-20: Very distributed (healthy)
 * - 21-40: Well distributed
 * - 41-60: Moderate concentration
 * - 61-80: Concentrated
 * - 81-100: Highly concentrated (risky)
 */
export function analyzeOwnership(
  commits: GitHubCommit[],
  contributors: GitHubContributor[]
): OwnershipAnalysisResult {
  if (commits.length === 0 || contributors.length === 0) {
    return {
      topContributor: "unknown",
      topContributorShare: 0,
      ownershipConcentration: 0,
      distribution: [],
      dataQuality: "unavailable",
    };
  }

  // Count commits per contributor
  const commitsByContributor = new Map<string, number>();
  commits.forEach((commit) => {
    if (commit.authorLogin) {
      commitsByContributor.set(
        commit.authorLogin,
        (commitsByContributor.get(commit.authorLogin) || 0) + 1
      );
    }
  });

  const totalCommits = commits.length;

  // Calculate shares
  const shares = Array.from(commitsByContributor.values()).map(
    (count) => (count / totalCommits) * 100
  );

  // Calculate HHI
  const hhi = shares.reduce((sum, share) => sum + Math.pow(share / 100, 2), 0);

  // Normalize HHI to 0-100
  // Min HHI for n contributors = 1/n
  // Max HHI = 1 (one contributor has everything)
  const minHhi = 1 / commitsByContributor.size;
  const maxHhi = 1;
  const normalizedConcentration =
    ((hhi - minHhi) / (maxHhi - minHhi)) * 100;

  // Get top contributor and distribution
  const sortedContributors = Array.from(
    commitsByContributor.entries()
  ).sort((a, b) => b[1] - a[1]);

  const topContributor = sortedContributors[0]?.[0] || "unknown";
  const topContributorShare = sortedContributors[0]
    ? (sortedContributors[0][1] / totalCommits) * 100
    : 0;

  // Distribution of top 4 contributors
  const distribution = sortedContributors.slice(0, 4).map(([login, count]) => ({
    login,
    percentage: Math.round((count / totalCommits) * 1000) / 10, // 1 decimal
  }));

  // Determine data quality
  const dataQuality: DataQuality =
    commitsByContributor.size > 0 ? "complete" : "limited";

  return {
    topContributor,
    topContributorShare: Math.round(topContributorShare * 10) / 10,
    ownershipConcentration: Math.round(normalizedConcentration * 10) / 10,
    distribution,
    dataQuality,
  };
}
