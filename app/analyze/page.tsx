"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function Page() {
  const router = useRouter();
  const [repoUrl, setRepoUrl] = useState("");

  const canSubmit = repoUrl.trim().length > 0;

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!canSubmit) return;
    router.push("/dashboard");
  };

  return (
    <main className="min-h-screen bg-[#07070d] text-white">
      <div className="flex min-h-screen items-center justify-center px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="w-full max-w-3xl rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/90 via-slate-900/80 to-slate-800/80 p-10 shadow-2xl backdrop-blur-2xl"
        >
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-2xl font-semibold sm:text-3xl">Analyze Repository</h1>
            <p className="mt-3 text-sm text-slate-300">
              Paste a GitHub repository URL to generate engineering insights.
            </p>

            <form onSubmit={handleSubmit} className="mt-8">
              <label htmlFor="repo" className="sr-only">
                GitHub repository URL
              </label>
              <input
                id="repo"
                name="repo"
                type="url"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/owner/repository"
                className="w-full rounded-xl border border-white/8 bg-white/3 px-4 py-3 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />

              <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  disabled={!canSubmit}
                  className={`inline-flex items-center justify-center rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-lg transition
                    ${canSubmit ? "bg-gradient-to-r from-indigo-500 to-cyan-500 hover:brightness-105" : "bg-slate-700/60 opacity-60 cursor-not-allowed"}`}
                >
                  Analyze Repository
                </motion.button>

                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  onClick={() => {
                    /* demo action — keep on-page */
                  }}
                  className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/3 px-5 py-3 text-sm font-semibold text-slate-100 hover:bg-white/5"
                >
                  View Demo
                </motion.button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
