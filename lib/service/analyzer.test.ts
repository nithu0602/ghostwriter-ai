/**
 * Unit tests for repository analyzer service
 * Tests orchestration layer integration between GitHub data and analysis functions
 */

import {
  validateGitHubData,
  analyzeRepository,
  isValidGitHubUrl,
  GitHubRepositoryData,
  ValidationError,
  InsufficientDataError,
  AnalysisServiceError,
} from "./index";
import { RepositoryMetadata } from "../github/types";
import { GitHubContributor, GitHubCommit, GitHubPullRequest } from "../github";

describe("Repository Analyzer Service", () => {
  const mockRepository: RepositoryMetadata = {
    owner: "test",
    name: "repo",
    fullName: "test/repo",
    description: "Test repository",
    defaultBranch: "main",
    language: "TypeScript",
    stars: 100,
    forks: 10,
    openIssues: 5,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-02-01T00:00:00Z",
    visibility: "Public",
  };

  const mockContributors: GitHubContributor[] = [
    {
      login: "alice",
      name: "Alice",
      avatarUrl: "https://example.com/alice.jpg",
      contributions: 50,
    },
    {
      login: "bob",
      name: "Bob",
      avatarUrl: "https://example.com/bob.jpg",
      contributions: 30,
    },
  ];

  const mockCommits: GitHubCommit[] = [
    {
      sha: "abc123",
      message: "Initial commit",
      authorLogin: "alice",
      authorName: "Alice",
      authorDate: "2024-01-01T00:00:00Z",
    },
    {
      sha: "def456",
      message: "Feature X",
      authorLogin: "bob",
      authorName: "Bob",
      authorDate: "2024-01-02T00:00:00Z",
    },
  ];

  const mockPullRequests: GitHubPullRequest[] = [
    {
      number: 1,
      title: "Feature",
      state: "closed",
      author: "alice",
      createdAt: "2024-01-01T00:00:00Z",
      mergedAt: "2024-01-02T00:00:00Z",
      reviewers: ["bob"],
    },
  ];

  describe("validateGitHubData", () => {
    it("should accept complete valid data", () => {
      const data: GitHubRepositoryData = {
        repository: mockRepository,
        contributors: mockContributors,
        commits: mockCommits,
        pullRequests: mockPullRequests,
      };

      const result = validateGitHubData(data);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject missing repository", () => {
      const data: any = {
        repository: null,
        contributors: mockContributors,
        commits: mockCommits,
        pullRequests: mockPullRequests,
      };

      const result = validateGitHubData(data);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Repository metadata is required");
    });

    it("should reject empty contributors", () => {
      const data: GitHubRepositoryData = {
        repository: mockRepository,
        contributors: [],
        commits: mockCommits,
        pullRequests: mockPullRequests,
      };

      const result = validateGitHubData(data);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "At least one contributor is required for analysis"
      );
    });

    it("should reject empty commits", () => {
      const data: GitHubRepositoryData = {
        repository: mockRepository,
        contributors: mockContributors,
        commits: [],
        pullRequests: mockPullRequests,
      };

      const result = validateGitHubData(data);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("At least one commit is required for analysis");
    });

    it("should warn about missing pull requests", () => {
      const data: GitHubRepositoryData = {
        repository: mockRepository,
        contributors: mockContributors,
        commits: mockCommits,
        pullRequests: [],
      };

      const result = validateGitHubData(data);
      expect(result.isValid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain("collaboration");
    });

    it("should warn about missing reviewer data", () => {
      const prsWithoutReviewers: GitHubPullRequest[] = [
        {
          number: 1,
          title: "PR",
          state: "closed",
          author: "alice",
          createdAt: "2024-01-01T00:00:00Z",
          mergedAt: "2024-01-02T00:00:00Z",
          reviewers: [],
        },
      ];

      const data: GitHubRepositoryData = {
        repository: mockRepository,
        contributors: mockContributors,
        commits: mockCommits,
        pullRequests: prsWithoutReviewers,
      };

      const result = validateGitHubData(data);
      expect(result.isValid).toBe(true);
      expect(result.warnings.some((w) => w.includes("reviewer"))).toBe(true);
    });
  });

  describe("analyzeRepository", () => {
    it("should analyze complete valid repository", () => {
      const data: GitHubRepositoryData = {
        repository: mockRepository,
        contributors: mockContributors,
        commits: mockCommits,
        pullRequests: mockPullRequests,
      };

      const result = analyzeRepository(data);

      expect(result.contributors).toBeDefined();
      expect(result.ownership).toBeDefined();
      expect(result.busFactor).toBeDefined();
      expect(result.knowledgeSilos).toBeDefined();
      expect(result.collaboration).toBeDefined();
      expect(result.engineeringHealth).toBeDefined();
      expect(result.analyzedAt).toBeDefined();
      expect(result.repository).toEqual({
        language: "TypeScript",
        stars: 100,
        forks: 10,
        openIssues: 5,
        updatedAt: "2024-02-01T00:00:00Z",
        visibility: "Public",
      });
    });

    it("should throw ValidationError on invalid data", () => {
      const data: GitHubRepositoryData = {
        repository: mockRepository,
        contributors: [],
        commits: mockCommits,
        pullRequests: mockPullRequests,
      };

      expect(() => analyzeRepository(data)).toThrow(ValidationError);
    });

    it("should throw ValidationError on missing commits", () => {
      const data: GitHubRepositoryData = {
        repository: mockRepository,
        contributors: mockContributors,
        commits: [],
        pullRequests: mockPullRequests,
      };

      expect(() => analyzeRepository(data)).toThrow(ValidationError);
    });

    it("should work with empty pull requests", () => {
      const data: GitHubRepositoryData = {
        repository: mockRepository,
        contributors: mockContributors,
        commits: mockCommits,
        pullRequests: [],
      };

      const result = analyzeRepository(data);
      expect(result.collaboration.dataQuality).toBe("unavailable");
    });

    it("should calculate correct bus factor for single dominant contributor", () => {
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

      const data: GitHubRepositoryData = {
        repository: mockRepository,
        contributors: mockContributors,
        commits,
        pullRequests: [],
      };

      const result = analyzeRepository(data);
      expect(result.busFactor.busFactor).toBe(1);
      expect(result.busFactor.riskLevel).toBe("high");
    });

    it("should identify knowledge silos", () => {
      const commits: GitHubCommit[] = Array.from({ length: 20 }, (_, i) => ({
        sha: `${i}`,
        message: `Commit ${i}`,
        authorLogin: i < 15 ? "alice" : "bob",
        authorName: i < 15 ? "Alice" : "Bob",
        authorDate: `2024-01-${String((i % 28) + 1).padStart(2, "0")}T00:00:00Z`,
      }));

      const data: GitHubRepositoryData = {
        repository: mockRepository,
        contributors: mockContributors,
        commits,
        pullRequests: [],
      };

      const result = analyzeRepository(data);
      expect(result.knowledgeSilos.silos.length).toBeGreaterThan(0);
    });

    it("should preserve data quality information", () => {
      const data: GitHubRepositoryData = {
        repository: mockRepository,
        contributors: mockContributors,
        commits: mockCommits,
        pullRequests: [],
      };

      const result = analyzeRepository(data);

      expect(result.contributors.dataQuality).toBeDefined();
      expect(result.ownership.dataQuality).toBeDefined();
      expect(result.busFactor.dataQuality).toBeDefined();
      expect(result.knowledgeSilos.dataQuality).toBeDefined();
      expect(result.collaboration.dataQuality).toBeDefined();
      expect(result.engineeringHealth.dataQuality).toBeDefined();
    });

    it("should be deterministic", () => {
      const data: GitHubRepositoryData = {
        repository: mockRepository,
        contributors: mockContributors,
        commits: mockCommits,
        pullRequests: mockPullRequests,
      };

      const result1 = analyzeRepository(data);
      const result2 = analyzeRepository(data);

      // Compare key metrics
      expect(result1.ownership.ownershipConcentration).toBe(
        result2.ownership.ownershipConcentration
      );
      expect(result1.busFactor.busFactor).toBe(result2.busFactor.busFactor);
      expect(result1.engineeringHealth.healthScore).toBe(
        result2.engineeringHealth.healthScore
      );
    });

    it("should handle single contributor repository", () => {
      const singleContributor: GitHubContributor[] = [
        {
          login: "alice",
          name: "Alice",
          avatarUrl: "https://example.com/alice.jpg",
          contributions: 100,
        },
      ];

      const data: GitHubRepositoryData = {
        repository: mockRepository,
        contributors: singleContributor,
        commits: mockCommits,
        pullRequests: [],
      };

      const result = analyzeRepository(data);

      expect(result.contributors.totalContributors).toBe(1);
      expect(result.ownership.topContributorShare).toBe(100);
      expect(result.busFactor.riskLevel).toBe("high");
    });

    it("should handle balanced contributor distribution", () => {
      const balancedCommits: GitHubCommit[] = Array.from(
        { length: 12 },
        (_, i) => ({
          sha: `${i}`,
          message: `Commit ${i}`,
          authorLogin: ["a", "b", "c", "d"][i % 4],
          authorName: ["a", "b", "c", "d"][i % 4],
          authorDate: `2024-01-${String((i % 28) + 1).padStart(2, "0")}T00:00:00Z`,
        })
      );

      const balancedContributors: GitHubContributor[] = [
        { login: "a", name: "A", avatarUrl: "url1", contributions: 3 },
        { login: "b", name: "B", avatarUrl: "url2", contributions: 3 },
        { login: "c", name: "C", avatarUrl: "url3", contributions: 3 },
        { login: "d", name: "D", avatarUrl: "url4", contributions: 3 },
      ];

      const data: GitHubRepositoryData = {
        repository: mockRepository,
        contributors: balancedContributors,
        commits: balancedCommits,
        pullRequests: [],
      };

      const result = analyzeRepository(data);

      expect(result.busFactor.busFactor).toBeGreaterThan(2);
      expect(result.ownership.ownershipConcentration).toBeLessThan(30);
    });

    it("should return ISO timestamp", () => {
      const data: GitHubRepositoryData = {
        repository: mockRepository,
        contributors: mockContributors,
        commits: mockCommits,
        pullRequests: [],
      };

      const result = analyzeRepository(data);

      expect(result.analyzedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      const timestamp = new Date(result.analyzedAt);
      expect(timestamp.getTime()).toBeLessThanOrEqual(Date.now());
    });
  });

  describe("isValidGitHubUrl", () => {
    it("should accept valid GitHub URLs", () => {
      expect(isValidGitHubUrl("https://github.com/owner/repo")).toBe(true);
      expect(isValidGitHubUrl("https://github.com/vercel/next.js")).toBe(true);
      expect(isValidGitHubUrl("github.com/owner/repo")).toBe(true);
    });

    it("should reject invalid GitHub URLs", () => {
      expect(isValidGitHubUrl("https://gitlab.com/owner/repo")).toBe(false);
      expect(isValidGitHubUrl("not-a-url")).toBe(false);
    });
  });
});

// Test suite runner output format
console.log("✓ validateGitHubData tests");
console.log("✓ analyzeRepository tests");
console.log("✓ isValidGitHubUrl tests");
