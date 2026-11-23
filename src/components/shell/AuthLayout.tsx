import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";

import { BrandWordmark } from "@/components/brand/BrandMark";
import { JunctionGraphic } from "@/components/brand/JunctionGraphic";
import { HeaderChips } from "@/components/shell/HeaderChips";
import { PreferenceToggles } from "@/components/shell/PreferenceToggles";

export function AuthLayout({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_1.1fr]">
      <aside className="relative hidden overflow-hidden bg-hero text-navy-foreground lg:flex lg:flex-col lg:justify-between lg:p-10">
        <div className="absolute inset-0 bg-grid" aria-hidden="true" />
        <Link to="/" className="relative">
          <BrandWordmark tone="inverse" />
        </Link>
        <JunctionGraphic className="relative mx-auto max-w-md" />
        <HeaderChips tone="inverse" className="relative" />
      </aside>

      <div className="flex flex-col">
        <div className="flex items-center justify-between gap-3 border-b px-4 py-3 sm:px-6 lg:justify-end lg:border-b-0">
          <Link to="/" className="lg:hidden">
            <BrandWordmark />
          </Link>
          <PreferenceToggles />
        </div>
        <div className="flex gap-2 overflow-x-auto border-b px-4 py-2 lg:hidden">
          <HeaderChips />
        </div>
        <main className="flex flex-1 items-start justify-center px-4 py-10 sm:px-6 lg:items-center">
          <div className="w-full max-w-md animate-rise">
            <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
            <p className="mt-1.5 text-muted-foreground">{subtitle}</p>
            <div className="mt-8">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}
