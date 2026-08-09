"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, GitBranch, Users } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-white/10 bg-slate-900/100 text-slate-400">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 py-8 md:flex-row">
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center justify-center rounded-md bg-white/3 p-2 text-indigo-300">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="text-sm font-semibold text-white">Ghostwriter AI</span>
        </div>

        <nav className="flex gap-6">
          <Link href="#" className="hover:text-white">
            Home
          </Link>
          <Link href="#features" className="hover:text-white">
            Features
          </Link>
          <Link href="#how-it-works" className="hover:text-white">
            How It Works
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <Link href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white">
            <GitBranch className="h-5 w-5" />
          </Link>
          <Link href="https://www.linkedin.com" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white">
            <Users className="h-5 w-5" />
          </Link>
        </div>
      </div>

      <div className="border-t border-white/6 px-6 py-4">
        <div className="mx-auto max-w-7xl text-center text-sm text-slate-500">
          © 2026 Ghostwriter AI. Built for engineering leaders.
        </div>
      </div>
    </footer>
  );
}
