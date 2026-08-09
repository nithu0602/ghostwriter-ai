"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-colors duration-200`}
      aria-hidden={false}
    >
      <nav
        className={`mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6 lg:px-8
          ${
            scrolled
              ? "backdrop-blur-sm bg-slate-900/70 border-b border-slate-800/40 shadow-sm"
              : "bg-transparent"
          }`}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-gradient-to-br from-indigo-600 to-cyan-500">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden
              >
                <path d="M12 2C7.58 2 4 5.58 4 10c0 4.42 3.58 8 8 8s8-3.58 8-8c0-4.42-3.58-8-8-8z" fill="white" opacity="0.12" />
                <path d="M8 12c0-2.21 1.79-4 4-4v8c-2.21 0-4-1.79-4-4z" fill="white" />
              </svg>
            </span>
            <span className="flex flex-col leading-none">
              <span className="text-sm font-semibold text-white">Ghostwriter AI</span>
              <span className="text-xs text-slate-300">Developer assistant</span>
            </span>
          </Link>
        </div>

        <div className="hidden md:flex md:items-center md:gap-8">
          <ul className="flex items-center gap-6 text-sm text-slate-200">
            <li>
              <Link href="#" className="hover:text-white">
                Home
              </Link>
            </li>
            <li>
              <Link href="#features" className="hover:text-white">
                Features
              </Link>
            </li>
            <li>
              <Link href="#about" className="hover:text-white">
                About
              </Link>
            </li>
          </ul>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:block">
            <button
              type="button"
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
            >
              Analyze Project
            </button>
          </div>

          <div className="md:hidden">
            <button
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-slate-800/40 text-slate-100 hover:bg-slate-800/60"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile panel */}
      <div
        className={`md:hidden transition-[max-height,opacity] duration-200 ease-in-out overflow-hidden bg-slate-900/95
          ${menuOpen ? "max-h-[320px] opacity-100" : "max-h-0 opacity-0"}`}
      >
        <div className="mx-auto max-w-7xl px-4 py-4">
          <ul className="flex flex-col gap-3 text-sm text-slate-200">
            <li>
              <Link href="#" onClick={() => setMenuOpen(false)} className="block w-full rounded-md px-3 py-2 hover:bg-slate-800/50">
                Home
              </Link>
            </li>
            <li>
              <Link href="#features" onClick={() => setMenuOpen(false)} className="block w-full rounded-md px-3 py-2 hover:bg-slate-800/50">
                Features
              </Link>
            </li>
            <li>
              <Link href="#about" onClick={() => setMenuOpen(false)} className="block w-full rounded-md px-3 py-2 hover:bg-slate-800/50">
                About
              </Link>
            </li>
            <li className="pt-2">
              <button
                onClick={() => {
                  setMenuOpen(false);
                }}
                className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
              >
                Analyze Project
              </button>
            </li>
          </ul>
        </div>
      </div>
    </header>
  );
}
