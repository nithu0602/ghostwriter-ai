import { NextResponse } from "next/server";

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

function extractRepoName(url: string) {
  const normalized = String(url).trim().replace(/\s+/g, "");
  const match = normalized.match(/github\.com\/([^\/\s]+\/[^\/\s]+)/i);
  if (match?.[1]) {
    return match[1].replace(/\/+$/, "");
  }
  if (normalized.includes("/")) {
    return normalized.replace(/\/+$/, "");
  }
  return "vercel/next.js";
}

function pickTopContributors() {
  const firstNames = ["Sarah", "Alex", "Priya", "Michael", "Zara", "Dev", "Asha", "Ravi"];
  const lastNames = ["Chen", "Kumar", "Singh", "Ross", "Patel", "Mitra", "Sharma", "Rao"];
  const roles = ["Backend", "Frontend", "DevOps", "Platform", "Infrastructure", "QA"];
  const contributors = shuffle(firstNames).slice(0, 4).map((firstName, index) => ({
    name: `${firstName} ${lastNames[index % lastNames.length]}`,
    role: roles[index % roles.length],
    score: randomBetween(82, 99),
  }));
  return contributors;
}

function pickRisks() {
  const riskOptions = [
    "Backend dependency on one engineer",
    "Low documentation coverage",
    "Review bottleneck detected",
    "Critical dependency identified",
    "Ownership concentrated in core modules",
    "Sparse onboarding documentation",
    "High review latency for critical paths",
    "Single-service knowledge gap found",
  ];
  return shuffle(riskOptions).slice(0, 3);
}

function getRandomRepoOverview() {
  const languages = ["TypeScript", "JavaScript", "Python", "Go", "Rust"];
  const commitTimes = ["2 hours ago", "12 hours ago", "1 day ago", "2 days ago", "3 days ago", "5 days ago"];
  return {
    language: languages[randomBetween(0, languages.length - 1)],
    stars: randomBetween(1000, 250000),
    forks: randomBetween(100, 50000),
    openIssues: randomBetween(5, 1200),
    lastCommit: commitTimes[randomBetween(0, commitTimes.length - 1)],
    visibility: "Public",
  };
}

function generateInsights(repository: string) {
  const stats = {
    review: randomBetween(8, 17),
    churn: randomBetween(5, 14),
    quality: randomBetween(3, 11),
  };

  const templates = [
    `Healthy collaboration across frontend teams in ${repository}.`,
    `Knowledge concentration increased by ${stats.review}% in core modules.`,
    `Review participation improved over the last sprint.`,
    `Core module churn for ${repository} is up ${stats.churn}% this cycle.`,
    `Documentation quality improved by ${stats.quality}% since the last release.`,
    `AI flagged a small set of high-risk change paths in ${repository}.`,
  ];

  return shuffle(templates).slice(0, 3);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const repository = body?.repository;

    if (!repository || typeof repository !== "string" || !repository.trim()) {
      return NextResponse.json(
        { error: "Repository URL is required." },
        { status: 400 }
      );
    }

    const repoName = extractRepoName(repository);
    const repositoryHealth = randomBetween(82, 97);
    const contributors = randomBetween(8, 42);
    const knowledgeSilos = randomBetween(1, 6);
    const busFactor = randomBetween(2, 7);
    const confidence = randomBetween(90, 99);
    const analysisTime = `${(randomBetween(32, 58) / 10).toFixed(1)}s`;
    const { language, stars, forks, openIssues, lastCommit, visibility } = getRandomRepoOverview();
    const topContributors = pickTopContributors();
    const risks = pickRisks();
    const insights = generateInsights(repoName);
    const summary = `Ghostwriter AI analyzed ${repoName} and detected healthy collaboration overall, but several critical backend modules rely heavily on a small group of contributors.`;

    return NextResponse.json({
      repository: repoName,
      repositoryHealth,
      contributors,
      knowledgeSilos,
      busFactor,
      analysisTime,
      confidence,
      language,
      stars,
      forks,
      openIssues,
      lastCommit,
      visibility,
      topContributors,
      risks,
      insights,
      summary,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Repository URL is required." },
      { status: 400 }
    );
  }
}
