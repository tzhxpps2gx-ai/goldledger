"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import TagManager from "@/components/TagManager";

type Tab = "tags" | "konto" | "profil";

const TABS: { id: Tab; label: string }[] = [
  { id: "tags", label: "Tags" },
  { id: "konto", label: "Konto" },
  { id: "profil", label: "Profil" },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("tags");

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
          Einstellungen
        </h1>
        <p className="text-zinc-400 text-sm mt-1">
          Verwalte deine Tags, Konto-Daten und Profil.
        </p>
      </div>

      {/* Tab-Navigation */}
      <div className="flex gap-1 bg-bg-card border border-bg-border rounded-xl p-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all",
              activeTab === tab.id
                ? "bg-gold-500/20 border border-gold-500/40 text-gold-400"
                : "text-zinc-400 hover:text-zinc-300"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab-Inhalt */}
      {activeTab === "tags" && <TagManager />}

      {activeTab === "konto" && (
        <div className="bg-bg-card border border-bg-border rounded-2xl p-8 text-center">
          <div className="text-3xl mb-3">🏦</div>
          <h2 className="text-base font-semibold text-white mb-2">Konto-Einstellungen</h2>
          <p className="text-zinc-500 text-sm">Kommt bald.</p>
        </div>
      )}

      {activeTab === "profil" && (
        <div className="bg-bg-card border border-bg-border rounded-2xl p-8 text-center">
          <div className="text-3xl mb-3">👤</div>
          <h2 className="text-base font-semibold text-white mb-2">Profil-Einstellungen</h2>
          <p className="text-zinc-500 text-sm">Kommt bald.</p>
        </div>
      )}
    </div>
  );
}
