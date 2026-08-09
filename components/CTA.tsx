"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export function CTA() {
  return (
    <section id="cta" className="relative isolate overflow-hidden px-6 py-20 text-white">
      <div className="absolute inset-0 -z-10 bg-slate-950/90" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-violet-500/20 blur-3xl" />
      <div className="pointer-events-none absolute right-10 top-20 h-64 w-64 rounded-full bg-cyan-400/15 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.18),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.16),_transparent_24%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[length:56px_56px]" />

      <motion.div
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="mx-auto flex max-w-5xl flex-col items-center rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-slate-800/80 p-10 shadow-2xl shadow-slate-950/40 backdrop-blur-2xl"
      >
        <div className="flex items-center gap-3 rounded-full bg-white/5 px-4 py-2 text-sm text-slate-200 shadow-sm shadow-slate-950/20">
          <Sparkles className="h-4 w-4 text-violet-300" />
          ✨ Ready to see your engineering team clearly?
        </div>

        <h2 className="mt-8 text-center text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Turn engineering activity into actionable intelligence.
        </h2>

        <p className="mx-auto mt-5 max-w-2xl text-center text-base leading-8 text-slate-300 sm:text-lg">
          Ghostwriter AI reveals collaboration, ownership, hidden contributors and project risks so engineering leaders can make confident decisions.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link href="/analyze" className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:shadow-cyan-500/30">
            Analyze Repository
          </Link>
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-slate-100 shadow-sm shadow-slate-950/10 transition hover:border-white/25 hover:bg-white/10"
          >
            View Demo
          </motion.button>
        </div>
      </motion.div>
    </section>
  );
}
