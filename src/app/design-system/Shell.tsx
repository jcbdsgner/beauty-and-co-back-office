"use client";

import React from "react";
import Link from "next/link";
import { ThemeProvider } from "@/context/ThemeContext";
import { ThemeToggleButton } from "@/components/common/ThemeToggleButton";

export default function Shell({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gray-50 text-gray-800 dark:bg-gray-950 dark:text-white/90">
        <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/80 backdrop-blur dark:border-gray-800 dark:bg-gray-900/80">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-8">
            <div>
              <p className="text-theme-xs uppercase tracking-wide text-gray-400">Homonyme</p>
              <h1 className="text-lg font-semibold">Design system</h1>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-theme-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/[0.03]"
              >
                ← Dashboard
              </Link>
              <ThemeToggleButton />
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-10 md:px-8">{children}</main>
      </div>
    </ThemeProvider>
  );
}
