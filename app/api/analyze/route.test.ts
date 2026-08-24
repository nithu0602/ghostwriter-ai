/**
 * Tests for the repository analysis API route
 */

import { POST } from "./route";

// Mock the service layer
jest.mock("@/lib/service", () => ({
  analyzeRepositoryByName: jest.fn(),
  ValidationError: class ValidationError extends Error {
    constructor(message: string, public validationErrors: string[]) {
      super(message);
      this.name = "ValidationError";
    }
  },
  InsufficientDataError: class InsufficientDataError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "InsufficientDataError";
    }
  },
  AnalysisServiceError: class AnalysisServiceError extends Error {
    constructor(public code: string, message: string) {
      super(message);
      this.name = "AnalysisServiceError";
    }
  },
}));

// Mock GitHub error classes
jest.mock("@/lib/github/types", () => ({
  GitHubRateLimitError: class GitHubRateLimitError extends Error {
    constructor() {
      super("Rate limited");
      this.name = "GitHubRateLimitError";
    }
  },
  GitHubNotFoundError: class GitHubNotFoundError extends Error {
    constructor(resource: string) {
      super(`Not found: ${resource}`);
      this.name = "GitHubNotFoundError";
    }
  },
  GitHubError: class GitHubError extends Error {
    constructor(public code: number, message: string) {
      super(message);
      this.name = "GitHubError";
    }
  },
}));

// Mock GitHub client
jest.mock("@/lib/github", () => ({
  parseGitHubUrl: jest.fn((url: string) => {
    if (!url || url.includes("invalid")) {
      throw new Error("Invalid URL");
    }
    const match = url.match(/github\.com\/([^/]+)\/(.+?)(\.git)?$/);
    if (!match) {
      throw new Error("Invalid GitHub URL");
    }
    return { owner: match[1], repo: match[2] };
  }),
}));

const mockAnalyzeRepositoryByName = require("@/lib/service").analyzeRepositoryByName;

describe("POST /api/analyze", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    require("@/lib/service/rateLimit").__resetRateLimitForTests();
  });

  // Helper to create a mock request
  function createRequest(body: any): Request {
    return new Request("http://localhost:3000/api/analyze", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });
  }

  describe("Input Validation", () => {
    it("should return 400 if repository is missing", async () => {
      const request = createRequest({});
      const response = await POST(request);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toContain("required");
    });

    it("should return 400 if repository is empty string", async () => {
      const request = createRequest({ repository: "" });
      const response = await POST(request);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toContain("required");
    });

    it("should return 400 if repository is whitespace only", async () => {
      const request = createRequest({ repository: "   " });
      const response = await POST(request);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toContain("required");
    });

    it("should return 400 if repository URL is invalid", async () => {
      const request = createRequest({ repository: "invalid-url" });
      const response = await POST(request);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toContain("Invalid GitHub repository URL");
    });
  });

  describe("Error Handling", () => {
    it("should return 404 if repository not found", async () => {
      const { GitHubNotFoundError } = require("@/lib/github/types");
      mockAnalyzeRepositoryByName.mockRejectedValue(
        new GitHubNotFoundError("repo")
      );

      const request = createRequest({ repository: "https://github.com/owner/notfound" });
      const response = await POST(request);

      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body.error).toContain("not found");
    });

    it("should return 429 if rate limit exceeded", async () => {
      const { GitHubRateLimitError } = require("@/lib/github/types");
      mockAnalyzeRepositoryByName.mockRejectedValue(new GitHubRateLimitError());

      const request = createRequest({ repository: "https://github.com/owner/repo" });
      const response = await POST(request);

      expect(response.status).toBe(429);
      const body = await response.json();
      expect(body.error).toContain("rate limit");
    });

    it("should return 400 if validation error", async () => {
      const { ValidationError } = require("@/lib/service");
      mockAnalyzeRepositoryByName.mockRejectedValue(
        new ValidationError("Invalid", ["error1"])
      );

      const request = createRequest({ repository: "https://github.com/owner/repo" });
      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it("should return 500 for unexpected errors", async () => {
      mockAnalyzeRepositoryByName.mockRejectedValue(new Error("Unexpected error"));

      const request = createRequest({ repository: "https://github.com/owner/repo" });
      const response = await POST(request);

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error).toContain("Unable to analyze");
    });
  });

  describe("Successful Analysis", () => {
    const mockAnalysisResult = {
      repository: {
        language: "TypeScript",
        stars: 1234,
        forks: 56,
        openIssues: 7,
        updatedAt: "2024-01-02T00:00:00Z",
        visibility: "Public" as const,
      },
      contributors: {
        topContributors: [
          {
            login: "alice",
            name: "Alice Dev",
            avatarUrl: "url",
            contributions: 100,
            commitCount: 50,
            prCount: 10,
            mergedPrCount: 8,
            reviewParticipation: 20,
            contributionPercentage: 45,
            engineeringScore: 92,
          },
          {
            login: "bob",
            name: "Bob Dev",
            avatarUrl: "url",
            contributions: 80,
            commitCount: 40,
            prCount: 8,
            mergedPrCount: 7,
            reviewParticipation: 15,
            contributionPercentage: 35,
            engineeringScore: 85,
          },
        ],
        totalContributors: 5,
        dataQuality: "complete" as const,
      },
      ownership: {
        topContributor: "alice",
        topContributorShare: 45,
        ownershipConcentration: 35,
        distribution: [
          { login: "alice", percentage: 45 },
          { login: "bob", percentage: 35 },
        ],
        dataQuality: "complete" as const,
      },
      busFactor: {
        busFactor: 2,
        contributorsFor50Percent: [
          { login: "alice", percentage: 45, cumulativePercentage: 45 },
          { login: "bob", percentage: 35, cumulativePercentage: 80 },
        ],
        riskLevel: "high" as const,
        dataQuality: "complete" as const,
      },
      knowledgeSilos: {
        silos: [],
        overallRisk: "low" as const,
        dataQuality: "limited" as const,
      },
      collaboration: {
        edges: [],
        collaborationDensity: 20,
        mostConnectedContributor: null,
        mostConnectedCount: 0,
        dataQuality: "limited" as const,
      },
      engineeringHealth: {
        healthScore: 78,
        factors: {
          ownershipConcentration: 35,
          busFactorRisk: 60,
          collaborationDensity: 20,
          contributorDiversity: 50,
        },
        riskAreas: ["Low bus factor"],
        dataQuality: "complete" as const,
      },
      analyzedAt: new Date().toISOString(),
    };

    it("should return 200 with analysis results for valid repository", async () => {
      mockAnalyzeRepositoryByName.mockResolvedValue(mockAnalysisResult);

      const request = createRequest({ repository: "https://github.com/owner/repo" });
      const response = await POST(request);

      expect(response.status).toBe(200);
      const body = await response.json();

      // Verify response shape
      expect(body.repository).toBe("owner/repo");
      expect(body.repositoryHealth).toBeDefined();
      expect(body.contributors).toBeDefined();
      expect(body.knowledgeSilos).toBeDefined();
      expect(body.busFactor).toBeDefined();
      expect(body.analysisTime).toBeDefined();
      expect(body.confidence).toBeDefined();
      expect(body.topContributors).toBeInstanceOf(Array);
      expect(body.risks).toBeInstanceOf(Array);
      expect(body.insights).toBeInstanceOf(Array);
      expect(body.summary).toBeDefined();
    });

    it("should map analysis results correctly", async () => {
      mockAnalyzeRepositoryByName.mockResolvedValue(mockAnalysisResult);

      const request = createRequest({ repository: "https://github.com/owner/repo" });
      const response = await POST(request);
      const body = await response.json();

      expect(body.repositoryHealth).toBe(78); // healthScore rounded
      expect(body.contributors).toBe(5); // totalContributors
      expect(body.busFactor).toBe(2);
      expect(body.knowledgeSilos).toBe(0); // silos.length
      expect(body.topContributors.length).toBe(2);
      expect(body.topContributors[0].score).toBe(92); // alice's engineeringScore
    });

    it("should preserve data quality information", async () => {
      mockAnalyzeRepositoryByName.mockResolvedValue(mockAnalysisResult);

      const request = createRequest({ repository: "https://github.com/owner/repo" });
      const response = await POST(request);
      const body = await response.json();

      expect(body.dataQuality).toBeDefined();
      expect(body.dataQuality.contributors).toBe("complete");
      expect(body.dataQuality.ownership).toBe("complete");
      expect(body.dataQuality.busFactor).toBe("complete");
      expect(body.dataQuality.knowledgeSilos).toBe("limited");
      expect(body.dataQuality.collaboration).toBe("limited");
    });

    it("should generate deterministic risks from analysis", async () => {
      mockAnalyzeRepositoryByName.mockResolvedValue(mockAnalysisResult);

      const request = createRequest({ repository: "https://github.com/owner/repo" });
      const response = await POST(request);
      const body = await response.json();

      expect(body.risks).toBeInstanceOf(Array);
      expect(body.risks.length).toBeGreaterThan(0);
      // Risks should be from engineeringHealth.riskAreas or generated
      expect(body.risks[0]).not.toMatch(/Math.random|fake|mock/i);
    });

    it("should generate deterministic insights from analysis", async () => {
      mockAnalyzeRepositoryByName.mockResolvedValue(mockAnalysisResult);

      const request = createRequest({ repository: "https://github.com/owner/repo" });
      const response = await POST(request);
      const body = await response.json();

      expect(body.insights).toBeInstanceOf(Array);
      expect(body.insights.length).toBeGreaterThan(0);
      // Insights should be based on actual analysis data
      expect(body.insights[0]).toContain("owner/repo");
    });

    it("should not use random values in response", async () => {
      mockAnalyzeRepositoryByName.mockResolvedValue(mockAnalysisResult);

      const request1 = createRequest({ repository: "https://github.com/owner/repo" });
      const response1 = await POST(request1);
      const body1 = await response1.json();

      const request2 = createRequest({ repository: "https://github.com/owner/repo" });
      const response2 = await POST(request2);
      const body2 = await response2.json();

      // Key metrics should be identical (deterministic)
      expect(body1.repositoryHealth).toBe(body2.repositoryHealth);
      expect(body1.busFactor).toBe(body2.busFactor);
      expect(body1.contributors).toBe(body2.contributors);
      expect(body1.confidence).toBe(body2.confidence);
    });

    it("should measure actual analysis time", async () => {
      mockAnalyzeRepositoryByName.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve(mockAnalysisResult), 100);
          })
      );

      const request = createRequest({ repository: "https://github.com/owner/repo" });
      const response = await POST(request);
      const body = await response.json();

      expect(body.analysisTime).toBeDefined();
      expect(body.analysisTime).toMatch(/^\d+\.\d{2}s$/);
      // Should be at least 0.1s (our mock delay)
      const timeSeconds = parseFloat(body.analysisTime);
      expect(timeSeconds).toBeGreaterThanOrEqual(0.1);
    });

    it("should infer contributor roles based on engineering scores", async () => {
      mockAnalyzeRepositoryByName.mockResolvedValue(mockAnalysisResult);

      const request = createRequest({ repository: "https://github.com/owner/repo" });
      const response = await POST(request);
      const body = await response.json();

      expect(body.topContributors[0].role).toBeDefined();
      // Higher score = more senior role
      if (body.topContributors[0].score > body.topContributors[1].score) {
        // This is just checking that roles exist and are reasonable
        expect([
          "Core Maintainer",
          "Lead Developer",
          "Senior Engineer",
          "Engineer",
          "Contributor",
        ]).toContain(body.topContributors[0].role);
      }
    });

    it("should set confidence based on data quality", async () => {
      const completeDataResult = {
        ...mockAnalysisResult,
        contributors: { ...mockAnalysisResult.contributors, dataQuality: "complete" as const },
        ownership: { ...mockAnalysisResult.ownership, dataQuality: "complete" as const },
        busFactor: { ...mockAnalysisResult.busFactor, dataQuality: "complete" as const },
        engineeringHealth: { ...mockAnalysisResult.engineeringHealth, dataQuality: "complete" as const },
      };

      mockAnalyzeRepositoryByName.mockResolvedValue(completeDataResult);

      const request = createRequest({ repository: "https://github.com/owner/repo" });
      const response = await POST(request);
      const body = await response.json();

      // Complete data should give high confidence
      expect(body.confidence).toBe(95);
    });

    it("should call analyzeRepositoryByName with parsed owner and repo", async () => {
      mockAnalyzeRepositoryByName.mockResolvedValue(mockAnalysisResult);

      const request = createRequest({ repository: "https://github.com/vercel/next.js" });
      await POST(request);

      expect(mockAnalyzeRepositoryByName).toHaveBeenCalledWith("vercel", "next.js");
    });
  });
});
