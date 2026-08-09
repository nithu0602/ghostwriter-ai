"use client";

import React from "react";
import { motion } from "framer-motion";
import { FolderGit2, ScanSearch, Network, BarChart3 } from "lucide-react";

type Step = {
  id: number;
  title: string;
  description: string;
  Icon: React.ComponentType<{ size?: number }>;
};

const STEPS: Step[] = [
  {
    id: 1,
    title: "Connect Repository",
    description: "Import a GitHub repository or upload a local Git project.",
    Icon: FolderGit2,
  },
  {
    id: 2,
    title: "Analyze Engineering Activity",
    description: "Read commits, pull requests, reviews and ownership signals.",
    Icon: ScanSearch,
  },
  {
    id: 3,
    title: "Build Collaboration Graph",
    description: "Detect contributor relationships, dependencies and knowledge flow.",
    Icon: Network,
  },
  {
    id: 4,
    title: "Generate AI Insights",
    description: "Reveal hidden contributors, project risks, bottlenecks and knowledge silos.",
    Icon: BarChart3,
  },
];

export function HowItWorks(){
  return (
    <section id="how-it-works" className="relative isolate overflow-hidden bg-slate-900/100 py-20 text-white">
      <div className="absolute -inset-32 -z-10 transform-gpu blur-3xl opacity-30">
        <div className="relative left-0 h-full w-full bg-gradient-to-r from-indigo-700 via-violet-600 to-cyan-500 opacity-40" />
      </div>

      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-4 inline-flex items-center gap-3 rounded-full bg-white/6 px-3 py-1 text-sm text-slate-200">
            HOW IT WORKS
          </div>

          <h2 className="text-3xl font-semibold sm:text-4xl">From Git activity to engineering intelligence.</h2>
          <p className="mt-4 text-lg text-slate-300">
            Ghostwriter AI combines commits, pull requests, reviews and repository ownership into a complete picture of how engineering teams really work.
          </p>
        </div>

        <div className="relative mt-12">
          {/* horizontal line on desktop, vertical on mobile */}
          <div className="hidden md:block absolute left-6 right-6 top-1/2 -z-0 h-[2px]">
            <div className="h-full w-full rounded-full bg-gradient-to-r from-indigo-600 to-violet-500 opacity-30" />
          </div>

          <div className="block md:hidden absolute left-12 top-0 bottom-0 w-[2px] -z-0 mx-auto">
            <div className="h-full w-full rounded-full bg-gradient-to-b from-indigo-600 to-violet-500 opacity-30" />
          </div>

          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            {STEPS.map((s, idx) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.08, ease: "easeOut" }}
                viewport={{ once: true, amount: 0.2 }}
                className="relative flex-1 rounded-2xl bg-white/4 p-6 backdrop-blur-sm hover:shadow-lg"
              >
                <div className="flex items-start gap-4">
                  <div className="relative">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-violet-500 text-white">
                      <s.Icon size={20} />
                    </div>
                    <div className="hidden md:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-slate-900 border border-white/10" />
                  </div>

                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-white">{s.title}</h3>
                    <p className="mt-2 text-sm text-slate-300">{s.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
