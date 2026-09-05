'use client';

import React from 'react';
import { Sparkles, MessageSquare, Database, ShieldCheck, Cpu, Plus, Layers, ChevronRight, Activity, FileText } from 'lucide-react';

interface SidebarProps {
  onNewChat: () => void;
  onOpenBenchmark: () => void;
  recordCount: number;
  resolverCoverage: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ onNewChat, onOpenBenchmark, recordCount, resolverCoverage }) => {
  return (
    <aside className="w-72 h-screen bg-[#07090e] border-r border-white/5 flex flex-col justify-between p-4 shrink-0 select-none hidden md:flex">
      {/* Top Branding & Workspace Switcher */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 px-2 py-1">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-600 to-cyan-600 p-[1px] shadow-lg shadow-emerald-500/20">
            <div className="w-full h-full bg-[#07090e] rounded-[11px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-lg font-extrabold tracking-tight text-white">Veritas</h2>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                LEDGER
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Company Ledger Intelligence</p>
          </div>
        </div>

        {/* New Question Button */}
        <button
          onClick={onNewChat}
          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-semibold text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-between transition-all group"
        >
          <span className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Ledger Question
          </span>
          <ChevronRight className="w-4 h-4 text-emerald-200 group-hover:translate-x-0.5 transition-transform" />
        </button>

        {/* Navigation Categories */}
        <div className="space-y-1">
          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500 px-3 mb-2">
            Veritas Pages
          </div>

          <a href="/workspace" className="w-full flex items-center gap-3 px-3 py-2 rounded-xl bg-white/5 text-emerald-400 text-xs font-medium border border-emerald-500/30 shadow-sm">
            <MessageSquare className="w-4 h-4 text-emerald-400" />
            <span>/workspace</span>
          </a>

          <a href="/workspace?replay=spend_last_month" className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-white/5 text-xs font-medium transition-all">
            <Layers className="w-4 h-4 text-slate-400" />
            <span>?replay=spend_last_month</span>
          </a>

          <a href="/workspace?replay=error" className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-white/5 text-xs font-medium transition-all">
            <FileText className="w-4 h-4 text-slate-400" />
            <span>?replay=error</span>
          </a>

          <button
            onClick={onOpenBenchmark}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-white/5 text-xs font-medium transition-all text-left"
          >
            <Cpu className="w-4 h-4 text-slate-400" />
            <span>/benchmark (&lt;20B Cap)</span>
          </button>
        </div>

        {/* Suggested Questions */}
        <div className="space-y-2 pt-2">
          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500 px-3">
            Questions That Work
          </div>
          <div className="space-y-1 text-xs text-slate-400">
            <div className="px-3 py-1.5 rounded-lg hover:bg-white/5 cursor-pointer truncate text-slate-300">
              What did we spend last month?
            </div>
            <div className="px-3 py-1.5 rounded-lg hover:bg-white/5 cursor-pointer truncate">
              Who were top 5 counterparties?
            </div>
            <div className="px-3 py-1.5 rounded-lg hover:bg-white/5 cursor-pointer truncate">
              Which accounts do not reconcile?
            </div>
            <div className="px-3 py-1.5 rounded-lg hover:bg-white/5 cursor-pointer truncate">
              Ref 7797183088 lookup
            </div>
          </div>
        </div>
      </div>

      {/* Engine Resolver Status */}
      <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-white/5 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>DuckDB &amp; Resolver</span>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        </div>

        <div className="text-[11px] text-slate-400 space-y-1 font-mono">
          <div className="flex justify-between">
            <span>Ledger Rows:</span>
            <span className="text-emerald-400 font-bold">{recordCount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Counterparty Coverage:</span>
            <span className="text-cyan-400 font-bold">{(resolverCoverage * 100).toFixed(1)}%</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
