"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Users, Eye, ShieldCheck, BookOpen } from "lucide-react";

export function Hero() {
  const metrics = [
    { id: 1, label: "Contributors Found", value: "128", icon: Users },
    { id: 2, label: "Hidden Work", value: "42 PRs", icon: Eye },
    { id: 3, label: "Project Risk", value: "Low", icon: ShieldCheck },
    { id: 4, label: "Knowledge Coverage", value: "78%", icon: BookOpen },
  ];

  return (
    <section className="relative isolate overflow-hidden bg-slate-900/100 text-white">
      <div className="absolute -inset-32 -z-10 transform-gpu blur-3xl opacity-30">
        <div className="relative left-1/4 h-full w-3/4 bg-gradient-to-r from-indigo-600 via-cyan-500 to-emerald-400 opacity-60" />
      </div>

      <div className="mx-auto max-w-7xl px-6 py-20 sm:py-28 lg:py-32">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center"
        >
          <div className="max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-3 rounded-full bg-white/6 px-3 py-1 text-sm text-slate-200">
              <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
              Premium · AI-powered
            </div>

            <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
              Know who actually built the project.
            </h1>

            <p className="mt-6 text-lg text-slate-300">
              Ghostwriter AI uncovers hidden contributors, collaboration patterns, engineering risks, and knowledge silos from project artifacts using AI.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/analyze"
                className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M5 12h14" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M12 5v14" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Analyze Repository
              </Link>

              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-md bg-white/6 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-white/8"
              >
                <Eye size={16} />
                View Demo
              </button>
            </div>
          </div>

          <div className="relative">
            <div className="pointer-events-none absolute -inset-6 -z-10 rounded-2xl bg-gradient-to-br from-indigo-700/30 via-cyan-500/20 to-emerald-400/15 blur-2xl" />

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.06 }}
              className="rounded-2xl bg-white/6 p-6 backdrop-blur-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-slate-200">Engineering Snapshot</h3>
                  <p className="mt-1 text-xs text-slate-400">Live-simulated metrics for demo purposes</p>
                </div>
                <div className="rounded-full bg-white/3 px-3 py-1 text-xs text-slate-200">Beta</div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4">
                {metrics.map((m) => {
                  const Icon = m.icon;
                  return (
                    <div key={m.id} className="rounded-lg bg-white/3 p-3">
                      <div className="flex items-start gap-3">
                        <div className="rounded-md bg-slate-800/40 p-2 text-slate-100">
                          <Icon size={18} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-baseline justify-between gap-4">
                            <div className="text-sm font-medium text-slate-200">{m.label}</div>
                            <div className="text-sm font-semibold text-white">{m.value}</div>
                          </div>

                          {m.label === "Knowledge Coverage" ? (
                            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-800/50">
                              <div className="h-2 rounded-full bg-emerald-400" style={{ width: m.value }} />
                            </div>
                          ) : m.label === "Project Risk" ? (
                            <div className="mt-3 text-xs text-slate-300">Risk inferred from change patterns</div>
                          ) : (
                            <div className="mt-3 text-xs text-slate-300">Recent activity and derived signals</div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
