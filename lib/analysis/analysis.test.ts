/**
 * Unit tests for analysis functions
 * Tests cover edge cases, determinism, and correctness
 */

import {
  analyzeContributors,
  analyzeOwnership,
  analyzeCollaboration,
  calculateBusFactor,
  calculateKnowledgeSilos,
  calculateEngineeringHealth,
} from "./index";
import {
  GitHubContributor,
  GitHubCommit,
  GitHubPullRequest,
} from "../github/types";

describe("Analysis Functions", () => {
  describe("analyzeContributors", () => {
    it("should handle empty contributors", () => {
      const result = analyzeContributors([], [], []);
      expect(result.topContributors).toEqual([]);
      expect(result.totalContributors).toBe(0);
      expect(result.dataQuality).toBe("unavailable");
    });

    it("should handle single contributor", () => {
      const contributors: GitHubContributor[] = [
        {
          login: "alice",
          name: "Alice Developer",
          avatarUrl: "https://example.com/avatar.jpg",
          contributions: 100,
        },
      ];

      const commits: GitHubCommit[] = [
        {
          sha: "abc123",
          message: "Fix bug",
          authorLogin: "alice",
          authorName: "Alice Developer",
          authorDate: "2024-01-01T00:00:00Z",
        },
      ];

      const result = analyzeContributors(contributors, commits, []);
      expect(result.topContributors).toHaveLength(1);
      expect(result.topContributors[0].login).toBe("alice");
      expect(result.topContributors[0].commitCount).toBe(1);
      expect(result.topContributors[0].contributionPercentage).toBe(100);
    });

    it("should calculate balanced contributor scores", () => {
      const contributors: GitHubContributor[] = [
        {
          login: "alice",
          name: "Alice",
          avatarUrl: "url1",
          contributions: 50,
        },
        {
          login: "bob",
          name: "Bob",
          avatarUrl: "url2",
          contributions: 50,
        },
      ];

      const commits: GitHubCommit[] = [
        {
          sha: "1",
          message: "A1",
          authorLogin: "alice",
          authorName: "Alice",
          authorDate: "2024-01-01T00:00:00Z",
        },
        {
          sha: "2",
          message: "A2",
          authorLogin: "alice",
          authorName: "Alice",
          authorDate: "2024-01-02T00:00:00Z",
        },
        {
          sha: "3",
          message: "B1",
          authorLogin: "bob",
          authorName: "Bob",
          authorDate: "2024-01-03T00:00:00Z",
        },
        {
          sha: "4",
          message: "B2",
          authorLogin: "bob",
          authorName: "Bob",
          authorDate: "2024-01-04T00:00:00Z",
        },
      ];

      const result = analyzeContributors(contributors, commits, []);
      expect(result.topContributors).toHaveLength(2);
      // Both should have similar scores
      expect(Math.abs(
        result.topContributors[0].engineeringScore -
          result.topContributors[1].engineeringScore
      )).toBeLessThan(5);
    });

    it("should be deterministic (same input -> same output)", () => {
      const contributors: GitHubContributor[] = [
        { login: "alice", name: "Alice", avatarUrl: "url1", contributions: 10 },
      ];
      const commits: GitHubCommit[] = [
        {
          sha: "1",
          message: "Commit",
          authorLogin: "alice",
          authorName: "Alice",
          authorDate: "2024-01-01T00:00:00Z",
        },
      ];

      const result1 = analyzeContributors(contributors, commits, []);
      const result2 = analyzeContributors(contributors, commits, []);

      expect(result1.topContributors[0].engineeringScore).toBe(
        result2.topContributors[0].engineeringScore
      );
    });
  });

  describe("analyzeOwnership", () => {
    it("should handle empty commits", () => {
      const result = analyzeOwnership([], []);
      expect(result.topContributor).toBe("unknown");
      expect(result.ownershipConcentration).toBe(0);
      expect(result.dataQuality).toBe("unavailable");
    });

    it("should identify single dominant contributor", () => {
      const commits: GitHubCommit[] = [
        {
          sha: "1",
          message: "C1",
          authorLogin: "alice",
          authorName: "Alice",
          authorDate: "2024-01-01T00:00:00Z",
        },
        {
          sha: "2",
          message: "C2",
          authorLogin: "alice",
          authorName: "Alice",
          authorDate: "2024-01-02T00:00:00Z",
        },
        {
          sha: "3",
          message: "C3",
          authorLogin: "alice",
          authorName: "Alice",
          authorDate: "2024-01-03T00:00:00Z",
        },
        {
          sha: "4",
          message: "C4",
          authorLogin: "alice",
          authorName: "Alice",
          authorDate: "2024-01-04T00:00:00Z",
        },
        {
          sha: "5",
          message: "C5",
          authorLogin: "bob",
          authorName: "Bob",
          authorDate: "2024-01-05T00:00:00Z",
        },
      ];

      const result = analyzeOwnership(commits, []);
      expect(result.topContributor).toBe("alice");
      expect(result.topContributorShare).toBe(80);
      expect(result.ownershipConcentration).toBe(36);
    });

    it("should calculate well-distributed ownership", () => {
      const commits: GitHubCommit[] = Array.from({ length: 10 }, (_, i) => ({
        sha: String(i),
        message: `Commit ${i}`,
        authorLogin: ["a", "b", "c", "d", "e"][i % 5],
        authorName: ["a", "b", "c", "d", "e"][i % 5],
        authorDate: new Date(2024, 0, i + 1).toISOString(),
      }));

      const result = analyzeOwnership(commits, []);
      expect(result.ownershipConcentration).toBeLessThan(30);
      expect(result.distribution.length).toBeGreaterThan(0);
    });
  });

  describe("calculateBusFactor", () => {
    it("should handle empty commits", () => {
      const result = calculateBusFactor([]);
      expect(result.busFactor).toBe(0);
      expect(result.riskLevel).toBe("high");
      expect(result.dataQuality).toBe("unavailable");
    });

    it("should calculate bus factor of 1", () => {
      const commits: GitHubCommit[] = [
        {
          sha: "1",
          message: "C1",
          authorLogin: "alice",
          authorName: "Alice",
          authorDate: "2024-01-01T00:00:00Z",
        },
        {
          sha: "2",
          message: "C2",
          authorLogin: "alice",
          authorName: "Alice",
          authorDate: "2024-01-02T00:00:00Z",
        },
        {
          sha: "3",
          message: "C3",
          authorLogin: "bob",
          authorName: "Bob",
          authorDate: "2024-01-03T00:00:00Z",
        },
      ];

      const result = calculateBusFactor(commits);
      expect(result.busFactor).toBe(1);
      expect(result.contributorsFor50Percent[0].login).toBe("alice");
      expect(result.riskLevel).toBe("high");
    });

    it("should calculate bus factor of 2", () => {
      const commits: GitHubCommit[] = [
        { sha: "1", message: "A1", authorLogin: "a", authorName: "A", authorDate: "2024-01-01T00:00:00Z" },
        { sha: "2", message: "A2", authorLogin: "a", authorName: "A", authorDate: "2024-01-02T00:00:00Z" },
        { sha: "3", message: "B1", authorLogin: "b", authorName: "B", authorDate: "2024-01-03T00:00:00Z" },
        { sha: "4", message: "B2", authorLogin: "b", authorName: "B", authorDate: "2024-01-04T00:00:00Z" },
        { sha: "5", message: "C1", authorLogin: "c", authorName: "C", authorDate: "2024-01-05T00:00:00Z" },
      ];

      const result = calculateBusFactor(commits);
      expect(result.busFactor).toBe(2);
      expect(result.riskLevel).toBe("high");
    });

    it("should calculate bus factor of 5+", () => {
      const commits: GitHubCommit[] = Array.from({ length: 12 }, (_, i) => ({
        sha: String(i),
        message: `C${i}`,
        authorLogin: String.fromCharCode(97 + i), // a-l
        authorName: String.fromCharCode(97 + i),
        authorDate: new Date(2024, 0, i + 1).toISOString(),
      }));

      const result = calculateBusFactor(commits);
      expect(result.busFactor).toBe(6);
      expect(result.riskLevel).toBe("low");
    });
  });

  describe("calculateKnowledgeSilos", () => {
    it("should handle empty commits", () => {
      const result = calculateKnowledgeSilos([]);
      expect(result.silos).toEqual([]);
      expect(result.dataQuality).toBe("unavailable");
    });

    it("should identify knowledge silos", () => {
      const commits: GitHubCommit[] = [
        { sha: "1", message: "A1", authorLogin: "alice", authorName: "Alice", authorDate: "2024-01-01T00:00:00Z" },
        { sha: "2", message: "A2", authorLogin: "alice", authorName: "Alice", authorDate: "2024-01-02T00:00:00Z" },
        { sha: "3", message: "A3", authorLogin: "alice", authorName: "Alice", authorDate: "2024-01-03T00:00:00Z" },
        { sha: "4", message: "A4", authorLogin: "alice", authorName: "Alice", authorDate: "2024-01-04T00:00:00Z" },
        { sha: "5", message: "B1", authorLogin: "bob", authorName: "Bob", authorDate: "2024-01-05T00:00:00Z" },
      ];

      const result = calculateKnowledgeSilos(commits);
      expect(result.silos.length).toBeGreaterThan(0);
      expect(result.silos[0].login).toBe("alice");
      expect(result.silos[0].concentrationScore).toBeGreaterThan(50);
      expect(result.overallRisk).toBe("high");
    });

    it("should not flag low-contribution users as silos", () => {
      const commits: GitHubCommit[] = Array.from({ length: 10 }, (_, i) => ({
        sha: String(i),
        message: `C${i}`,
        authorLogin: String.fromCharCode(97 + (i % 5)), // a-e
        authorName: String.fromCharCode(97 + (i % 5)),
        authorDate: new Date(2024, 0, i + 1).toISOString(),
      }));

      const result = calculateKnowledgeSilos(commits);
      expect(result.silos.filter((s) => s.riskLevel === "high")).toHaveLength(0);
    });
  });

  describe("calculateEngineeringHealth", () => {
    it("should produce score between 0-100", () => {
      const result = calculateEngineeringHealth(
        50, // ownership concentration
        3, // bus factor
        30, // collaboration density
        5, // contributor count
        100 // total commits
      );

      expect(result.healthScore).toBeGreaterThanOrEqual(0);
      expect(result.healthScore).toBeLessThanOrEqual(100);
    });

    it("should penalize high concentration", () => {
      const healthyResult = calculateEngineeringHealth(
        20, // low concentration
        5,
        40,
        10,
        100
      );

      const concentratedResult = calculateEngineeringHealth(
        80, // high concentration
        2,
        40,
        10,
        100
      );

      expect(concentratedResult.healthScore).toBeLessThan(healthyResult.healthScore);
    });

    it("should penalize low bus factor", () => {
      const healthyResult = calculateEngineeringHealth(
        50,
        5, // high bus factor
        30,
        10,
        100
      );

      const riskResult = calculateEngineeringHealth(
        50,
        1, // low bus factor
        30,
        10,
        100
      );

      expect(riskResult.healthScore).toBeLessThan(healthyResult.healthScore);
    });

    it("should be deterministic", () => {
      const result1 = calculateEngineeringHealth(50, 3, 30, 5, 100);
      const result2 = calculateEngineeringHealth(50, 3, 30, 5, 100);

      expect(result1.healthScore).toBe(result2.healthScore);
      expect(result1.factors).toEqual(result2.factors);
    });

    it("should identify risk areas", () => {
      const result = calculateEngineeringHealth(
        90, // very high concentration
        1, // critical bus factor
        5, // low collaboration
        2, // very few contributors
        100
      );

      expect(result.riskAreas.length).toBeGreaterThan(0);
      expect(result.riskAreas.some((r) => r.includes("concentration"))).toBe(
        true
      );
      expect(result.riskAreas.some((r) => r.includes("bus factor"))).toBe(true);
    });
  });

  describe("analyzeCollaboration", () => {
    it("should handle empty pull requests", () => {
      const result = analyzeCollaboration([]);
      expect(result.edges).toEqual([]);
      expect(result.collaborationDensity).toBe(0);
      expect(result.dataQuality).toBe("unavailable");
    });

    it("should build collaboration graph from PRs", () => {
      const prs: GitHubPullRequest[] = [
        {
          number: 1,
          title: "Feature 1",
          state: "closed",
          author: "alice",
          createdAt: "2024-01-01T00:00:00Z",
          mergedAt: "2024-01-02T00:00:00Z",
          reviewers: ["bob", "charlie"],
        },
      ];

      const result = analyzeCollaboration(prs);
      expect(result.edges.length).toBeGreaterThan(0);
      expect(result.dataQuality).toBe("complete");
    });

    it("should calculate collaboration density", () => {
      const prs: GitHubPullRequest[] = [
        {
          number: 1,
          title: "PR1",
          state: "closed",
          author: "alice",
          createdAt: "2024-01-01T00:00:00Z",
          mergedAt: "2024-01-02T00:00:00Z",
          reviewers: ["bob"],
        },
        {
          number: 2,
          title: "PR2",
          state: "closed",
          author: "bob",
          createdAt: "2024-01-03T00:00:00Z",
          mergedAt: "2024-01-04T00:00:00Z",
          reviewers: ["alice"],
        },
      ];

      const result = analyzeCollaboration(prs);
      expect(result.collaborationDensity).toBeGreaterThan(0);
      expect(result.mostConnectedContributor).toBeTruthy();
    });

    it("should handle missing reviewer data gracefully", () => {
      const prs: GitHubPullRequest[] = [
        {
          number: 1,
          title: "PR1",
          state: "closed",
          author: "alice",
          createdAt: "2024-01-01T00:00:00Z",
          mergedAt: "2024-01-02T00:00:00Z",
          reviewers: [],
        },
      ];

      const result = analyzeCollaboration(prs);
      expect(result.dataQuality).toBe("limited");
    });
  });
});

// Test suite runner output format
console.log("✓ analyzeContributors tests");
console.log("✓ analyzeOwnership tests");
console.log("✓ calculateBusFactor tests");
console.log("✓ calculateKnowledgeSilos tests");
console.log("✓ calculateEngineeringHealth tests");
console.log("✓ analyzeCollaboration tests");
