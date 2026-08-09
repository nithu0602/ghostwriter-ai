"use client";

import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  AlertCircle,
  BrainCircuit,
  Clock,
  Code2,
  GitBranch,
  Globe2,
  LoaderCircle,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  Star,
  TriangleAlert,
  Users,
} from "lucide-react";

const statusMessages = [
  "Connecting to GitHub...",
  "Reading repository...",
  "Analyzing contributors...",
  "Detecting ownership...",
  "Building collaboration graph...",
  "Generating AI report...",
];

function extractRepoName(url: string) {
  const normalized = url.trim().replace(/\s+/g, "");
  const match = normalized.match(/github\.com\/([^\/\s]+\/[^\/\s]+)/i);
  if (match?.[1]) {
    return match[1].replace(/\/+$/, "");
  }
  if (normalized.includes("/")) {
    return normalized.replace(/\/+$/, "");
  }
  return "vercel/next.js";
}

const defaultAnalysisData = {
  repository: "vercel/next.js",
  repositoryHealth: 87,
  contributors: 18,
  knowledgeSilos: 4,
  busFactor: 3,
  confidence: 93,
  analysisTime: "4.1s",
  language: "TypeScript",
  stars: 134200,
  forks: 28900,
  openIssues: 612,
  lastCommit: "2 days ago",
  visibility: "Public",
  topContributors: [
    { name: "Sarah Chen", role: "Backend", score: 98 },
    { name: "Alex Kumar", role: "Frontend", score: 94 },
    { name: "Priya Singh", role: "DevOps", score: 90 },
    { name: "Michael Ross", role: "Platform", score: 88 },
  ],
  risks: [
    "Backend dependency on one engineer",
    "Documentation coverage below target",
    "Review ownership concentrated",
  ],
  insights: [
    "Healthy collaboration across frontend teams.",
    "Knowledge concentration increased by 12%.",
    "Review participation improved over the last sprint.",
  ],
  summary:
    "Ghostwriter AI analyzed the repository and detected healthy collaboration overall, but several critical backend modules rely heavily on a small group of contributors.",
};

type AnalysisData = typeof defaultAnalysisData;

export default function DashboardPage() {
  const [repoInput, setRepoInput] = useState("");
  const [error, setError] = useState("");
  const [apiError, setApiError] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [statusIndex, setStatusIndex] = useState(0);
  const [analysisData, setAnalysisData] = useState<AnalysisData>(defaultAnalysisData);
  const [showReport, setShowReport] = useState(true);

  const metrics = [
    { id: 1, title: "Repository Health", value: `${analysisData.repositoryHealth}%`, Icon: Activity },
    { id: 2, title: "Contributors", value: `${analysisData.contributors}`, Icon: Users },
    { id: 3, title: "Knowledge Silos", value: `${analysisData.knowledgeSilos}`, Icon: BrainCircuit },
    { id: 4, title: "Bus Factor", value: `${analysisData.busFactor}`, Icon: ShieldAlert },
  ];

  const overviewItems = [
    { label: "Repository", value: analysisData.repository || "Unknown", Icon: GitBranch },
    { label: "Primary Language", value: analysisData.language || "Unknown", Icon: Code2 },
    { label: "Stars", value: analysisData.stars?.toLocaleString("en-US") ?? "Unknown", Icon: Star },
    { label: "Forks", value: analysisData.forks?.toLocaleString("en-US") ?? "Unknown", Icon: GitBranch },
    { label: "Open Issues", value: analysisData.openIssues?.toLocaleString("en-US") ?? "Unknown", Icon: AlertCircle },
    { label: "Last Commit", value: analysisData.lastCommit || "Unknown", Icon: Clock },
    { label: "Repository Visibility", value: analysisData.visibility || "Unknown", Icon: Globe2 },
    { label: "Analysis Time", value: analysisData.analysisTime || "Unknown", Icon: Clock },
    { label: "AI Confidence", value: `${analysisData.confidence ?? "Unknown"}%`, Icon: ShieldCheck },
  ];

  useEffect(() => {
    if (!isAnalyzing) {
      return;
    }

    setShowReport(false);
    setStatusIndex(0);

    const interval = window.setInterval(() => {
      setStatusIndex((current) => Math.min(current + 1, statusMessages.length - 1));
    }, 500);

    return () => {
      window.clearInterval(interval);
    };
  }, [isAnalyzing]);

  const handleAnalyze = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setApiError("");
    if (!repoInput.trim()) {
      setError("Please enter a GitHub repository URL.");
      return;
    }

    setError("");
    setIsAnalyzing(true);
    setStatusIndex(0);

    try {
      const responsePromise = fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repository: repoInput }),
      });
      const delayPromise = new Promise((resolve) => window.setTimeout(resolve, 3200));

      const [response] = await Promise.all([responsePromise, delayPromise]);

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error || "Unable to analyze repository.");
      }

      const result = (await response.json()) as AnalysisData;
      setAnalysisData(result);
    } catch (error) {
      setApiError("Unable to analyze repository.");
    } finally {
      setIsAnalyzing(false);
      setShowReport(true);
    }
  };

  return (
    <main className="min-h-screen bg-[#07070d] p-6 text-white sm:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-slate-950/40 backdrop-blur-2xl">
          <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-center">
            <div className="max-w-3xl">
              <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Analyze Another Repository</p>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Paste any GitHub repository URL to generate AI engineering insights.
              </h1>
              <p className="mt-4 text-sm leading-7 text-slate-300 sm:text-base">
                Ghostwriter AI will simulate a complete engineering intelligence report with realistic metrics, risks, and contributors for the repository you enter.
              </p>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-6 shadow-xl shadow-slate-950/20 backdrop-blur-xl">
              <form className="space-y-4" onSubmit={handleAnalyze}>
                <label className="block text-sm font-medium text-slate-300" htmlFor="repo-url">
                  Repository URL
                </label>
                <input
                  id="repo-url"
                  value={repoInput}
                  onChange={(event) => setRepoInput(event.target.value)}
                  className="w-full rounded-3xl border border-white/10 bg-slate-900/90 px-5 py-4 text-sm text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
                  placeholder="https://github.com/owner/repository"
                  type="url"
                  autoComplete="off"
                  disabled={isAnalyzing}
                />
                {error ? <p className="text-sm text-rose-400">{error}</p> : null}

                <button
                  type="submit"
                  disabled={isAnalyzing}
                  className="inline-flex w-full items-center justify-center rounded-3xl bg-gradient-to-r from-cyan-500 to-violet-500 px-6 py-4 text-sm font-semibold text-slate-950 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isAnalyzing ? "Analyzing repository…" : "Analyze"}
                </button>
              </form>
            </div>
          </div>
        </section>

        <AnimatePresence mode="wait">
          {isAnalyzing ? (
            <motion.section
              key="loading"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.35 }}
              className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-slate-950/30 backdrop-blur-2xl"
            >
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Analyzing repository</p>
                  <h2 className="mt-3 text-3xl font-semibold text-white">Simulating Ghostwriter AI pipeline</h2>
                </div>
                <div className="inline-flex items-center gap-3 rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-3 text-slate-200 shadow-lg shadow-slate-950/20">
                  <LoaderCircle className="h-6 w-6 animate-spin" />
                  <span className="text-sm">Processing</span>
                </div>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {statusMessages.map((message, index) => (
                  <div
                    key={message}
                    className={`rounded-3xl border px-4 py-4 text-sm transition ${
                      index <= statusIndex ? "border-cyan-400/30 bg-cyan-500/10 text-cyan-200" : "border-white/10 bg-slate-950/70 text-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-cyan-300">✓</span>
                      <span className="font-medium">{message}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.section>
          ) : showReport ? (
            <motion.div
              key={analysisData.repository}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              transition={{ duration: 0.4 }}
              className="space-y-8"
            >
              <section className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-8 shadow-2xl shadow-slate-950/40 backdrop-blur-2xl">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-3xl">
                    <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Engineering Intelligence Dashboard</p>
                    <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                      {analysisData.repository}
                    </h1>
                    <p className="mt-4 max-w-2xl text-sm text-slate-300 sm:text-base">
                      AI-generated engineering insights for the latest repository snapshot.
                    </p>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-white/5 px-5 py-4 text-sm text-slate-200 shadow-lg shadow-slate-950/20">
                    <div className="text-xs uppercase tracking-[0.3em] text-slate-400">Repository</div>
                    <div className="mt-2 font-medium text-white">{analysisData.repository}</div>
                  </div>
                </div>
              </section>

              <motion.section
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.06 }}
                className="rounded-[2rem] border border-white/10 bg-white/5 p-8 backdrop-blur-2xl shadow-2xl shadow-slate-950/40"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Repository Overview</p>
                    <h2 className="mt-3 text-2xl font-semibold text-white">Repository Overview</h2>
                  </div>
                </div>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {overviewItems.map((item) => (
                    <div key={item.label} className="flex items-start gap-4 rounded-3xl border border-white/10 bg-slate-950/60 p-4">
                      <div className="mt-1 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-violet-500 text-white">
                        <item.Icon size={18} />
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{item.label}</p>
                        <p className="mt-2 text-sm font-semibold text-white">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.section>

              <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                {metrics.map((metric, index) => {
                  const Icon = metric.Icon;
                  return (
                    <motion.div
                      key={metric.id}
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.45, delay: index * 0.06 }}
                      whileHover={{ y: -6, scale: 1.02 }}
                      className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-lg shadow-lg shadow-slate-950/20"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-500 text-white">
                          <Icon size={20} />
                        </div>
                        <div>
                          <p className="text-sm text-slate-300">{metric.title}</p>
                          <p className="mt-2 text-2xl font-semibold text-white">{metric.value}</p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </section>

              <section className="grid gap-6 xl:grid-cols-[2fr_1fr]">
                <motion.div
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45 }}
                  className="rounded-[2rem] border border-white/10 bg-white/5 p-8 backdrop-blur-2xl shadow-2xl shadow-slate-950/40"
                >
                  <div className="flex items-center gap-3 text-slate-300">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-violet-500 text-white">
                      <Sparkles size={20} />
                    </div>
                    <div>
                      <p className="text-sm uppercase tracking-[0.24em] text-slate-400">AI Executive Summary</p>
                    </div>
                  </div>
                  <h2 className="mt-6 text-3xl font-semibold text-white">AI Executive Summary</h2>
                  <p className="mt-4 text-sm leading-7 text-slate-300 sm:text-base">{analysisData.summary}</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: 0.06 }}
                  className="rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-2xl shadow-2xl shadow-slate-950/40"
                >
                  <div className="mb-5 flex items-center justify-between">
                    <p className="text-lg font-semibold text-white">Detected Risks</p>
                  </div>
                  <div className="space-y-4">
                    {analysisData.risks.map((risk) => (
                      <div key={risk} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-500 text-white">
                          <TriangleAlert size={18} />
                        </div>
                        <p className="text-sm text-slate-300">{risk}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </section>

              <section className="grid gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: 0.1 }}
                  className="rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-2xl shadow-2xl shadow-slate-950/40"
                >
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-white">Top Contributors</h3>
                      <p className="mt-2 text-sm text-slate-400">Key contributors driving the project forward.</p>
                    </div>
                  </div>
                  <div className="mt-6 overflow-hidden rounded-3xl border border-white/10 bg-slate-950/70">
                    <table className="min-w-full text-left text-sm text-slate-300">
                      <thead className="border-b border-white/10 bg-slate-900/80 text-slate-400">
                        <tr>
                          <th className="px-6 py-4">Engineer</th>
                          <th className="px-6 py-4">Role</th>
                          <th className="px-6 py-4">Contribution Score</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10">
                        {analysisData.topContributors.map((contributor, index) => (
                          <tr key={contributor.name} className={index % 2 === 0 ? "bg-white/5" : "bg-transparent"}>
                            <td className="px-6 py-4 text-white">{contributor.name}</td>
                            <td className="px-6 py-4">{contributor.role}</td>
                            <td className="px-6 py-4 font-semibold text-white">{contributor.score}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>

                <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
                  <motion.div
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: 0.14 }}
                    className="rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-2xl shadow-2xl shadow-slate-950/40"
                  >
                    <p className="text-lg font-semibold text-white">Recent Insights</p>
                    <div className="mt-6 grid gap-4 sm:grid-cols-3">
                      {analysisData.insights.map((insight) => (
                        <div key={insight} className="rounded-3xl border border-white/10 bg-slate-950/70 p-5 text-sm text-slate-300 shadow-sm shadow-slate-950/20">
                          {insight}
                        </div>
                      ))}
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: 0.18 }}
                    className="rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-2xl shadow-2xl shadow-slate-950/40"
                  >
                    <p className="text-lg font-semibold text-white">Risk Snapshot</p>
                    <div className="mt-5 space-y-4">
                      {analysisData.risks.map((risk) => (
                        <div key={risk} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-500 text-white">
                            <TriangleAlert size={18} />
                          </div>
                          <p className="text-sm text-slate-300">{risk}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                </div>
              </section>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </main>
  );
}
