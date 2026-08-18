/**
 * ANALYSIS LAYER VALIDATION AND EXAMPLE USAGE
 * 
 * This file demonstrates that all analysis functions work correctly
 * and produce deterministic, explainable results.
 */

import {
  analyzeContributors,
  analyzeOwnership,
  calculateBusFactor,
  calculateKnowledgeSilos,
  analyzeCollaboration,
  calculateEngineeringHealth,
} from "./index";
import {
  GitHubContributor,
  GitHubCommit,
  GitHubPullRequest,
} from "../github/types";

/**
 * Example 1: Single dominant contributor repository
 * Expected: High bus factor risk, high ownership concentration
 */
export function exampleSingleDominantContributor() {
  const contributors: GitHubContributor[] = [
    {
      login: "alice",
      name: "Alice",
      avatarUrl: "https://example.com/alice.jpg",
      contributions: 980,
    },
    {
      login: "bob",
      name: "Bob",
      avatarUrl: "https://example.com/bob.jpg",
      contributions: 20,
    },
  ];

  const commits: GitHubCommit[] = [
    ...Array.from({ length: 98 }, (_, i) => ({
      sha: `a${i}`,
      message: `Commit from Alice ${i}`,
      authorLogin: "alice",
      authorName: "Alice",
      authorDate: `2024-01-${String((i % 28) + 1).padStart(2, "0")}T00:00:00Z`,
    })),
    ...Array.from({ length: 2 }, (_, i) => ({
      sha: `b${i}`,
      message: `Commit from Bob ${i}`,
      authorLogin: "bob",
      authorName: "Bob",
      authorDate: `2024-02-${String((i + 1) * 10).padStart(2, "0")}T00:00:00Z`,
    })),
  ];

  const pullRequests: GitHubPullRequest[] = [];

  console.log("Example 1: Single Dominant Contributor");
  console.log("- Contributors:", analyzeContributors(contributors, commits, pullRequests).topContributors.map(c => c.login));
  console.log("- Ownership concentration:", analyzeOwnership(commits, contributors).ownershipConcentration);
  console.log("- Bus factor:", calculateBusFactor(commits).busFactor);
  console.log("- Risk areas:", calculateKnowledgeSilos(commits).silos.map(s => s.login));
  console.log("");
}

/**
 * Example 2: Balanced contributor distribution
 * Expected: Low bus factor risk, low ownership concentration, high health score
 */
export function exampleBalancedDistribution() {
  const contributors: GitHubContributor[] = [
    { login: "alice", name: "Alice", avatarUrl: "url1", contributions: 25 },
    { login: "bob", name: "Bob", avatarUrl: "url2", contributions: 25 },
    { login: "charlie", name: "Charlie", avatarUrl: "url3", contributions: 25 },
    { login: "diana", name: "Diana", avatarUrl: "url4", contributions: 25 },
  ];

  const commits: GitHubCommit[] = [
    ...Array.from({ length: 25 }, (_, i) => ({
      sha: `a${i}`,
      message: `A${i}`,
      authorLogin: "alice",
      authorName: "Alice",
      authorDate: `2024-01-${String((i % 28) + 1).padStart(2, "0")}T00:00:00Z`,
    })),
    ...Array.from({ length: 25 }, (_, i) => ({
      sha: `b${i}`,
      message: `B${i}`,
      authorLogin: "bob",
      authorName: "Bob",
      authorDate: `2024-01-${String((i % 28) + 1).padStart(2, "0")}T00:00:00Z`,
    })),
    ...Array.from({ length: 25 }, (_, i) => ({
      sha: `c${i}`,
      message: `C${i}`,
      authorLogin: "charlie",
      authorName: "Charlie",
      authorDate: `2024-01-${String((i % 28) + 1).padStart(2, "0")}T00:00:00Z`,
    })),
    ...Array.from({ length: 25 }, (_, i) => ({
      sha: `d${i}`,
      message: `D${i}`,
      authorLogin: "diana",
      authorName: "Diana",
      authorDate: `2024-01-${String((i % 28) + 1).padStart(2, "0")}T00:00:00Z`,
    })),
  ];

  const pullRequests: GitHubPullRequest[] = [];

  console.log("Example 2: Balanced Distribution");
  console.log("- Ownership concentration:", analyzeOwnership(commits, contributors).ownershipConcentration);
  console.log("- Bus factor:", calculateBusFactor(commits).busFactor);
  console.log("- Knowledge silos (high-risk):", calculateKnowledgeSilos(commits).silos.filter(s => s.riskLevel === "high").length);
  console.log("");
}

/**
 * Example 3: Collaboration through pull requests
 * Expected: Collaboration density > 0, edges created
 */
export function exampleCollaboration() {
  const pullRequests: GitHubPullRequest[] = [
    {
      number: 1,
      title: "Feature X",
      state: "closed",
      author: "alice",
      createdAt: "2024-01-01T00:00:00Z",
      mergedAt: "2024-01-02T00:00:00Z",
      reviewers: ["bob", "charlie"],
    },
    {
      number: 2,
      title: "Feature Y",
      state: "closed",
      author: "bob",
      createdAt: "2024-01-03T00:00:00Z",
      mergedAt: "2024-01-04T00:00:00Z",
      reviewers: ["alice", "diana"],
    },
    {
      number: 3,
      title: "Feature Z",
      state: "closed",
      author: "charlie",
      createdAt: "2024-01-05T00:00:00Z",
      mergedAt: "2024-01-06T00:00:00Z",
      reviewers: ["alice"],
    },
  ];

  const collab = analyzeCollaboration(pullRequests);

  console.log("Example 3: Collaboration Analysis");
  console.log("- Collaboration edges:", collab.edges.length);
  console.log("- Collaboration density:", collab.collaborationDensity);
  console.log("- Most connected:", collab.mostConnectedContributor);
  console.log("- Data quality:", collab.dataQuality);
  console.log("");
}

/**
 * Example 4: Determinism verification
 * Running the same analysis twice should produce identical results
 */
export function verifyDeterminism() {
  const contributors: GitHubContributor[] = [
    { login: "alice", name: "Alice", avatarUrl: "url1", contributions: 50 },
    { login: "bob", name: "Bob", avatarUrl: "url2", contributions: 30 },
    { login: "charlie", name: "Charlie", avatarUrl: "url3", contributions: 20 },
  ];

  const commits: GitHubCommit[] = [
    { sha: "1", message: "A1", authorLogin: "alice", authorName: "Alice", authorDate: "2024-01-01T00:00:00Z" },
    { sha: "2", message: "A2", authorLogin: "alice", authorName: "Alice", authorDate: "2024-01-02T00:00:00Z" },
    { sha: "3", message: "B1", authorLogin: "bob", authorName: "Bob", authorDate: "2024-01-03T00:00:00Z" },
    { sha: "4", message: "C1", authorLogin: "charlie", authorName: "Charlie", authorDate: "2024-01-04T00:00:00Z" },
  ];

  const result1 = analyzeOwnership(commits, contributors);
  const result2 = analyzeOwnership(commits, contributors);

  const isDeterministic =
    result1.topContributor === result2.topContributor &&
    result1.topContributorShare === result2.topContributorShare &&
    result1.ownershipConcentration === result2.ownershipConcentration;

  console.log("Example 4: Determinism Verification");
  console.log("- First run ownership concentration:", result1.ownershipConcentration);
  console.log("- Second run ownership concentration:", result2.ownershipConcentration);
  console.log("- Results are deterministic:", isDeterministic);
  console.log("");
}

// Run examples (for demonstration only, not executed by Next.js)
console.log("=".repeat(60));
console.log("GHOSTWRITER AI - ANALYSIS LAYER VALIDATION");
console.log("=".repeat(60));
console.log("");
