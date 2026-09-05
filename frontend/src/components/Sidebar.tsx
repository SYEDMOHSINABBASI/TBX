'use client';

import React from 'react';
import { Sparkles, MessageSquare, Database, ShieldCheck, Cpu, Plus, Layers, ChevronRight, Activity } from 'lucide-react';

interface SidebarProps {
  onNewChat: () => void;
  onOpenBenchmark: () => void;
  recordCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ onNewChat, onOpenBenchmark, recordCount }) => {
  return (
    <aside className="w-72 h-screen bg-[#090c15] border-r border-white/5 flex flex-col justify-between p-4 shrink-0 select-none hidden md:flex">
      {/* Top Branding & New Chat */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 px-2 py-1">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-violet-600 p-[1px] shadow-lg shadow-cyan-500/20">
            <div className="w-full h-full bg-[#090c15] rounded-[11px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-base font-extrabold tracking-tight text-white">TBX Engine</h2>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Lyzr Financial Intelligence</p>
          </div>
        </div>

        {/* New Chat Button */}
        <button
          onClick={onNewChat}
          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs shadow-lg shadow-cyan-500/20 flex items-center justify-between transition-all group"
        >
          <span className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Financial Query
          </span>
          <ChevronRight className="w-4 h-4 text-cyan-200 group-hover:translate-x-0.5 transition-transform" />
        </button>

        {/* Navigation Categories */}
        <div className="space-y-1">
          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500 px-3 mb-2">
            Workspace Navigation
          </div>

          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl bg-white/5 text-cyan-400 text-xs font-medium border border-cyan-500/30 shadow-sm">
            <MessageSquare className="w-4 h-4 text-cyan-400" />
            <span>Financial Assistant</span>
          </button>

          <button
            onClick={onOpenBenchmark}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-white/5 text-xs font-medium transition-all"
          >
            <Cpu className="w-4 h-4 text-slate-400" />
            <span>Model Benchmarks (&lt;20B)</span>
          </button>

          <div className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-slate-400 text-xs font-medium opacity-75">
            <Database className="w-4 h-4 text-slate-400" />
            <span>3-Table Schema Explorer</span>
          </div>
        </div>

        {/* Recent Chat History */}
        <div className="space-y-2 pt-2">
          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500 px-3">
            Recent Queries
          </div>
          <div className="space-y-1 text-xs text-slate-400">
            <div className="px-3 py-2 rounded-lg hover:bg-white/5 cursor-pointer truncate transition-colors text-slate-300">
              Which bank received highest payout?
            </div>
            <div className="px-3 py-2 rounded-lg hover:bg-white/5 cursor-pointer truncate transition-colors">
              Total debit spend June 2026
            </div>
            <div className="px-3 py-2 rounded-lg hover:bg-white/5 cursor-pointer truncate transition-colors">
              Available balance across ICICI accounts
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Backend Engine Health Card */}
      <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-white/5 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>DuckDB Engine</span>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        </div>

        <div className="text-[11px] text-slate-400 flex items-center justify-between font-mono">
          <span>Records Loaded:</span>
          <span className="text-emerald-400 font-bold">{recordCount.toLocaleString()}</span>
        </div>

        <div className="text-[10px] text-slate-500 pt-1 border-t border-white/5">
          Read-Only Parquet Data Store
        </div>
      </div>
    </aside>
  );
};
