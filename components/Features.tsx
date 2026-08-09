"use client";

import React from "react";
import { motion } from "framer-motion";
import { Users, GitBranch, ShieldAlert, BrainCircuit, Database, Activity } from "lucide-react";

type Feature = {
  id: number;
  title: string;
  description: string;
  Icon: React.ComponentType<{ size?: number }>;
};

const FEATURES: Feature[] = [
  {
    id: 1,
    title: "Hidden Contributors",
    description: "Identify developers whose impact goes beyond commit counts.",
    Icon: Users,
  },
  {
    id: 2,
    title: "Collaboration Graph",
    description: "Visualize how engineers collaborate across repositories.",
    Icon: GitBranch,
  },
  {
    id: 3,
    title: "Risk Detection",
    description: "Spot projects dependent on only one engineer.",
    Icon: ShieldAlert,
  },
  {
    id: 4,
    title: "Engineering Intelligence",
    description: "Understand the story behind every pull request.",
    Icon: BrainCircuit,
  },
  {
    id: 5,
    title: "Knowledge Mapping",
    description: "Reveal undocumented expertise inside your team.",
    Icon: Database,
  },
  {
    id: 6,
    title: "Team Health",
    description: "Measure engineering health with meaningful metrics.",
    Icon: Activity,
  },
];

export function Features() {
  return (
    <section id="features" className="relative isolate overflow-hidden bg-slate-900/100 py-20 text-white">
      <div className="absolute -inset-32 -z-10 transform-gpu blur-3xl opacity-30">
        <div className="relative left-0 h-full w-full bg-gradient-to-r from-indigo-700 via-violet-600 to-cyan-500 opacity-40" />
      </div>

      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-semibold sm:text-4xl">Invisible work is finally visible.</h2>
          <p className="mt-4 text-lg text-slate-300">
            Ghostwriter AI analyzes engineering activity to reveal collaboration patterns, hidden contributors, knowledge silos, and project risks.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <motion.div
              key={f.id}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ y: -6, scale: 1.02 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              viewport={{ once: true, amount: 0.2 }}
              className="rounded-2xl bg-white/4 p-6 backdrop-blur-sm hover:shadow-lg"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-violet-500 text-white">
                  <f.Icon size={20} />
                </div>

                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-white">{f.title}</h3>
                  <p className="mt-2 text-sm text-slate-300">{f.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
