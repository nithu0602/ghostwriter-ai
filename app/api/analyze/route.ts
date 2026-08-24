import { NextResponse } from "next/server";
import {
  analyzeRepositoryByName,
  ValidationError,
  InsufficientDataError,
  AnalysisServiceError,
} from "@/lib/service";
import { parseGitHubUrl } from "@/lib/github";
import { GitHubRateLimitError, GitHubNotFoundError, GitHubError } from "@/lib/github/types";
import { checkRateLimit, getClientIp } from "@/lib/service/rateLimit";

interface AnalysisResponse {
  repository: string;
  repositoryHealth: number;
  contributors: number;
  knowledgeSilos: number;
  busFactor: number;
  analysisTime: string;
  confidence: number;
  language: string | null;
  stars: number;
  forks: number;
  openIssues: number;
  lastCommit: string;
  visibility: string;
  topContributors: Array<{
    name: string;
    role: string;
    score: number;
  }>;
  risks: string[];
  insights: string[];
  summary: string;
  dataQuality?: {
    contributors: string;
    ownership: string;
    busFactor: string;
    knowledgeSilos: string;
    collaboration: string;
    engineeringHealth: string;
  };
}

/**
 * Format last commit date into human-readable format
 */
function formatLastCommitDate(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? "" : "s"} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) === 1 ? "" : "s"} ago`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * Generate deterministic insights from analysis results
 */
function generateInsights(analysis: any): string[] {
  const insights: string[] = [];
  const repo = analysis.contributors.topContributors[0]?.login || "Repository";

  // Add insight about health score
  if (analysis.engineeringHealth.healthScore > 75) {
    insights.push(`${repo} demonstrates healthy engineering practices with a health score of ${Math.round(analysis.engineeringHealth.healthScore)}%.`);
  } else if (analysis.engineeringHealth.healthScore > 50) {
    insights.push(`${repo} has moderate engineering health at ${Math.round(analysis.engineeringHealth.healthScore)}%, with some areas for improvement.`);
  } else {
    insights.push(
      `${repo} shows concerning patterns with a health score of ${Math.round(analysis.engineeringHealth.healthScore)}%, indicating significant risks.`
    );
  }

  // Add insight about bus factor
  if (analysis.busFactor.busFactor <= 2) {
    insights.push(`Critical dependency detected: only ${analysis.busFactor.busFactor} contributor${analysis.busFactor.busFactor === 1 ? "" : "s"} account for 50%+ of activity.`);
  } else if (analysis.busFactor.busFactor <= 5) {
    insights.push(`Bus factor of ${analysis.busFactor.busFactor} indicates reasonable distribution of knowledge and responsibilities.`);
  } else {
    insights.push(`Healthy bus factor of ${analysis.busFactor.busFactor} suggests well-distributed ownership across the team.`);
  }

  // Add insight about ownership
  const topShare = analysis.ownership.topContributorShare;
  if (topShare > 70) {
    insights.push(`Ownership is concentrated with the top contributor accounting for ${Math.round(topShare)}% of commits.`);
  } else if (topShare > 40) {
    insights.push(`Top contributor has ${Math.round(topShare)}% of commits; consider distributing responsibilities more widely.`);
  } else {
    insights.push(`Ownership is well-distributed across the team with the top contributor at ${Math.round(topShare)}% of commits.`);
  }

  return insights;
}

/**
 * Generate deterministic risks from analysis results
 */
function generateRisks(analysis: any): string[] {
  const risks: string[] = [];

  // Add risks from engineeringHealth.riskAreas
  if (analysis.engineeringHealth.riskAreas) {
    risks.push(...analysis.engineeringHealth.riskAreas.slice(0, 2));
  }

  // Add knowledge silo risks if any
  if (analysis.knowledgeSilos.silos.length > 0) {
    const highRiskSilos = analysis.knowledgeSilos.silos.filter((s: any) => s.riskLevel === "high");
    if (highRiskSilos.length > 0) {
      risks.push(`${highRiskSilos.length} critical knowledge silo${highRiskSilos.length > 1 ? "s" : ""} identified`);
    }
  }

  // Ensure we have at least one risk or note that there are none
  if (risks.length === 0) {
    risks.push("No major risks detected; repository engineering health is sound.");
  }

  return risks.slice(0, 3);
}

/**
 * Map contributor score to a display role based on their metrics
 */
function inferRole(contributor: any): string {
  const roles = [
    "Core Maintainer",
    "Lead Developer",
    "Senior Engineer",
    "Engineer",
    "Contributor",
  ];

  // Higher engineering score = more senior role
  if (contributor.engineeringScore > 90) return roles[0];
  if (contributor.engineeringScore > 80) return roles[1];
  if (contributor.engineeringScore > 70) return roles[2];
  if (contributor.engineeringScore > 60) return roles[3];
  return roles[4];
}

export async function POST(request: Request) {
  const startTime = performance.now();

  // Basic abuse protection: IP-based sliding window rate limit.
  // This is a public, unauthenticated endpoint that triggers several
  // outbound GitHub API calls per hit, so we cap how often a single
  // client can invoke it to protect the shared GITHUB_TOKEN's rate limit.
  const clientIp = getClientIp(request);
  const rateLimit = checkRateLimit(clientIp);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      {
        status: 429,
        headers: rateLimit.retryAfterSeconds
          ? { "Retry-After": String(rateLimit.retryAfterSeconds) }
          : undefined,
      }
    );
  }

  try {
    const body = await request.json();
    const repository = body?.repository;

    // Validate input
    if (!repository || typeof repository !== "string" || !repository.trim()) {
      return NextResponse.json(
        { error: "Repository URL is required." },
        { status: 400 }
      );
    }

    // Parse GitHub URL
    let owner: string;
    let repo: string;

    try {
      const parsed = parseGitHubUrl(repository);
      owner = parsed.owner;
      repo = parsed.repo;
    } catch {
      return NextResponse.json(
        { error: "Invalid GitHub repository URL." },
        { status: 400 }
      );
    }

    // Call the analysis service
    const analysis = await analyzeRepositoryByName(owner, repo);

    // Measure analysis time
    const analysisTime = `${((performance.now() - startTime) / 1000).toFixed(2)}s`;

    // Map analysis results to dashboard response format
    const topContributors = analysis.contributors.topContributors.slice(0, 4).map((contributor) => ({
      name: contributor.name || contributor.login,
      role: inferRole(contributor),
      score: Math.round(contributor.engineeringScore),
    }));

    // Determine confidence based on data quality
    const isDataComplete =
      analysis.contributors.dataQuality === "complete" &&
      analysis.ownership.dataQuality === "complete" &&
      analysis.busFactor.dataQuality === "complete" &&
      analysis.engineeringHealth.dataQuality === "complete";

    const isDataUnavailable =
      analysis.contributors.dataQuality === "unavailable" ||
      analysis.ownership.dataQuality === "unavailable" ||
      analysis.busFactor.dataQuality === "unavailable";

    const confidence = Math.round(
      isDataComplete ? 95 : isDataUnavailable ? 70 : 85
    );

    const response: AnalysisResponse = {
      repository: `${owner}/${repo}`,
      repositoryHealth: Math.round(analysis.engineeringHealth.healthScore),
      contributors: analysis.contributors.totalContributors,
      knowledgeSilos: analysis.knowledgeSilos.silos.length,
      busFactor: analysis.busFactor.busFactor,
      analysisTime,
      confidence,
      language: analysis.repository.language,
      stars: analysis.repository.stars,
      forks: analysis.repository.forks,
      openIssues: analysis.repository.openIssues,
      lastCommit: formatLastCommitDate(analysis.repository.updatedAt),
      visibility: analysis.repository.visibility,
      topContributors,
      risks: generateRisks(analysis),
      insights: generateInsights(analysis),
      summary: `Ghostwriter AI analyzed ${owner}/${repo} and detected ${
        analysis.engineeringHealth.healthScore > 75
          ? "healthy collaboration overall"
          : "several areas of concern"
      }. Bus factor of ${analysis.busFactor.busFactor} and ${analysis.knowledgeSilos.silos.length} knowledge silos require attention.`,
      dataQuality: {
        contributors: analysis.contributors.dataQuality,
        ownership: analysis.ownership.dataQuality,
        busFactor: analysis.busFactor.dataQuality,
        knowledgeSilos: analysis.knowledgeSilos.dataQuality,
        collaboration: analysis.collaboration.dataQuality,
        engineeringHealth: analysis.engineeringHealth.dataQuality,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    // Handle specific error types
    if (error instanceof GitHubRateLimitError) {
      return NextResponse.json(
        { error: "GitHub API rate limit exceeded. Please try again later." },
        { status: 429 }
      );
    }

    if (error instanceof GitHubNotFoundError) {
      return NextResponse.json(
        { error: "GitHub repository not found." },
        { status: 404 }
      );
    }

    if (error instanceof GitHubError) {
      return NextResponse.json(
        { error: "GitHub API error. Please try again." },
        { status: 500 }
      );
    }

    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: "Invalid GitHub repository URL." },
        { status: 400 }
      );
    }

    if (error instanceof InsufficientDataError) {
      return NextResponse.json(
        { error: "Repository does not have enough data for analysis." },
        { status: 400 }
      );
    }

    if (error instanceof AnalysisServiceError) {
      return NextResponse.json(
        { error: "Unable to analyze repository." },
        { status: 500 }
      );
    }

    // Catch-all for unexpected errors
    return NextResponse.json(
      { error: "Unable to analyze repository." },
      { status: 500 }
    );
  }
}
