/**
 * Repository metrics calculations
 * Bus factor, knowledge silos, and engineering health
 */

import {
  GitHubContributor,
  GitHubCommit,
} from "../github/types";
import {
  BusFactorResult,
  KnowledgeSilosResult,
  KnowledgeSilo,
  EngineeringHealthResult,
  DataQuality,
} from "./types";

/**
 * Calculates bus factor
 *
 * Definition:
 * The minimum number of contributors whose cumulative contribution
 * accounts for at least 50% of observed repository activity.
 *
 * Formula:
 * Sort contributors by commit count (descending)
 * Add contributors until cumulative % >= 50%
 *
 * Example:
 * A = 40%, B = 20%, C = 15%, D = 10%, E = 15%
 * A + B = 60% >= 50%, so bus factor = 2
 *
 * Risk levels:
 * - 1-2: HIGH risk (critical dependencies)
 * - 3-5: MEDIUM risk (reasonable bus factor)
 * - 6+: LOW risk (healthy distribution)
 */
export function calculateBusFactor(
  commits: GitHubCommit[]
): BusFactorResult {
  if (commits.length === 0) {
    return {
      busFactor: 0,
      contributorsFor50Percent: [],
      riskLevel: "high",
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

  // Sort by commit count descending
  const sortedContributors = Array.from(commitsByContributor.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([login, count]) => {
      const percentage = (count / totalCommits) * 100;
      return { login, count, percentage };
    });

  // Find minimum number of contributors for 50%+
  let cumulativePercentage = 0;
  let busFactor = 0;
  const contributorsFor50Percent = [];

  for (const contributor of sortedContributors) {
    cumulativePercentage += contributor.percentage;
    busFactor += 1;
    contributorsFor50Percent.push({
      login: contributor.login,
      percentage: Math.round(contributor.percentage * 10) / 10,
      cumulativePercentage: Math.round(cumulativePercentage * 10) / 10,
    });

    if (cumulativePercentage >= 50) {
      break;
    }
  }

  // Determine risk level
  let riskLevel: "low" | "medium" | "high";
  if (busFactor <= 2) {
    riskLevel = "high";
  } else if (busFactor <= 5) {
    riskLevel = "medium";
  } else {
    riskLevel = "low";
  }

  return {
    busFactor,
    contributorsFor50Percent,
    riskLevel,
    dataQuality: "complete",
  };
}

/**
 * Calculates knowledge silos
 *
 * A contributor is considered a knowledge silo when:
 * - They account for significant activity (>15% of commits)
 * AND
 * - Their activity is concentrated (i.e., not widely distributed)
 *
 * Concentration Score (0-100):
 * For MVP with limited file-level data, use commit distribution
 * as a proxy for focus area concentration.
 *
 * Since we only have aggregate file counts, mark as "limited" quality.
 * Score is based on: if a person has a high contribution percentage
 * but this is normalized across the project, they may not be a silo.
 *
 * Heuristic:
 * Concentration = (contributor_percentage - average_percentage) / max_gap * 100
 * If concentration > 50, mark as risk.
 */
export function calculateKnowledgeSilos(
  commits: GitHubCommit[]
): KnowledgeSilosResult {
  if (commits.length === 0) {
    return {
      silos: [],
      overallRisk: "low",
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
  const avgPercentage = 100 / Math.max(1, commitsByContributor.size);

  const silos: KnowledgeSilo[] = [];

  Array.from(commitsByContributor.entries()).forEach(([login, count]) => {
    const percentage = (count / totalCommits) * 100;

    // Only consider as potential silo if above 15% contribution
    if (percentage > 15) {
      // Concentration score based on how concentrated their activity is
      // Higher percentage = higher concentration
      const concentrationScore = Math.min(100, percentage - 10);

      let riskLevel: "low" | "medium" | "high";
      if (concentrationScore > 60) {
        riskLevel = "high";
      } else if (concentrationScore > 35) {
        riskLevel = "medium";
      } else {
        riskLevel = "low";
      }

      silos.push({
        login,
        concentrationScore: Math.round(concentrationScore),
        riskLevel,
        description: `${Math.round(percentage)}% of commits. With current data, file-level details are unavailable.`,
      });
    }
  });

  // Sort by risk level and concentration
  silos.sort((a, b) => {
    const riskOrder = { high: 0, medium: 1, low: 2 };
    return (
      riskOrder[a.riskLevel] - riskOrder[b.riskLevel] ||
      b.concentrationScore - a.concentrationScore
    );
  });

  // Determine overall risk
  let overallRisk: "low" | "medium" | "high" = "low";
  if (silos.some((s) => s.riskLevel === "high")) {
    overallRisk = "high";
  } else if (silos.some((s) => s.riskLevel === "medium")) {
    overallRisk = "medium";
  }

  return {
    silos,
    overallRisk,
    dataQuality: "limited", // File-level data not available
  };
}

/**
 * Calculates engineering health score
 *
 * Engineering Health Score Formula (0-100):
 * Combines multiple factors to produce a holistic health assessment
 *
 * Components:
 * 1. Ownership concentration (0-100, inverse)
 *    - Lower concentration = higher health
 * 2. Bus factor risk (0-100, inverse)
 *    - Higher bus factor = higher health
 * 3. Collaboration density (0-100, direct)
 *    - Higher density = higher health (but capped at 50 due to diminishing returns)
 * 4. Contributor diversity (0-100, direct)
 *    - More diverse = higher health
 *
 * Health Score = 
 *   (100 - ownershipConcentration) * 0.35 +
 *   busFactor health * 0.30 +
 *   collaborationDensity * 0.20 +
 *   diversityScore * 0.15
 */
export function calculateEngineeringHealth(
  ownershipConcentration: number,
  busFactor: number,
  collaborationDensity: number,
  contributorCount: number,
  totalCommits: number
): EngineeringHealthResult {
  // 1. Ownership concentration (inverse scoring)
  const ownershipScore = Math.max(0, 100 - ownershipConcentration);

  // 2. Bus factor health
  // busFactor 1 = 0 points, 2 = 20, 3 = 40, 4 = 60, 5+ = 80
  const busFactorHealth = Math.min(80, busFactor > 0 ? (busFactor - 1) * 20 : 0);

  // 3. Collaboration density (cap at 50 for diminishing returns)
  const collaborationScore = Math.min(50, collaborationDensity);

  // 4. Contributor diversity
  // For MVP: compare contributor count to average commits
  const avgCommitsPerContributor =
    contributorCount > 0 ? totalCommits / contributorCount : 0;
  const diversityScore = Math.min(
    100,
    (contributorCount * 100) / Math.max(5, avgCommitsPerContributor * 2)
  );

  // Weighted combination
  const healthScore =
    ownershipScore * 0.35 +
    busFactorHealth * 0.3 +
    collaborationScore * 0.2 +
    diversityScore * 0.15;

  // Identify risk areas
  const riskAreas: string[] = [];
  if (ownershipConcentration > 70) {
    riskAreas.push("High ownership concentration");
  }
  if (busFactor <= 2) {
    riskAreas.push("Low bus factor (critical dependency risk)");
  }
  if (collaborationDensity < 20) {
    riskAreas.push("Low collaboration density");
  }
  if (contributorCount <= 2) {
    riskAreas.push("Very few contributors");
  }

  const factors = {
    ownershipConcentration,
    busFactorRisk: Math.max(0, 100 - busFactorHealth), // Inverted for display
    collaborationDensity,
    contributorDiversity: Math.round(diversityScore),
  };

  return {
    healthScore: Math.round(healthScore * 10) / 10,
    factors,
    riskAreas,
    dataQuality: "complete",
  };
}
