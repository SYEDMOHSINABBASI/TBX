'use client';

import React from 'react';
import { CheckCircle2, AlertTriangle, ShieldAlert, Sparkles, Layers, Sliders, ArrowUpRight } from 'lucide-react';
import { VerifiedResultPackage, TruthVerdict } from '@/lib/types';
import { EvidenceTable } from './EvidenceTable';

interface TruthPanelProps {
  pkg: VerifiedResultPackage;
}

export const TruthPanel: React.FC<TruthPanelProps> = ({ pkg }) => {
  const getVerdictBadge = (verdict: TruthVerdict) => {
    switch (verdict) {
      case 'Stable':
        return (
          <div className="badge-stable inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>STABLE (&lt; 5% Variance)</span>
          </div>
        );
      case 'Sensitive':
        return (
          <div className="badge-sensitive inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>SENSITIVE (5-15% Variance)</span>
          </div>
        );
      case 'Fragile':
        return (
          <div className="badge-fragile inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>FRAGILE (&gt; 15% Variance)</span>
          </div>
        );
    }
  };

  const formatCurrency = (val: number) => {
    if (val >= 100000 || val <= -100000) return `₹${(val / 100000).toFixed(2)} Lakh`;
    return `₹${val.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="mt-4 p-6 rounded-2xl lyzr-card border border-white/10 space-y-6 shadow-2xl">
      {/* Primary Result & Verdict Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-5">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-cyan-400 font-bold mb-1 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            Primary Result (Deterministic Default Reading)
          </div>
          <div className="text-3xl font-extrabold text-gradient-cyan tracking-tight">
            {formatCurrency(pkg.primary_value)}
          </div>
          <div className="text-xs text-slate-400 mt-1 font-medium">
            {pkg.primary_label || 'Calculated metric'}
          </div>
        </div>

        <div>
          {getVerdictBadge(pkg.verdict)}
        </div>
      </div>

      {/* Documented Primary Interpretation Note */}
      <div className="bg-[#0b0e18] p-3.5 rounded-xl border border-white/5 flex items-start gap-2.5 text-xs">
        <Sliders className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
        <div>
          <span className="font-semibold text-slate-200">Documented Primary Interpretation:</span>{' '}
          <span className="text-slate-400">{pkg.interpretation_used}</span>
        </div>
      </div>

      {/* Alternatives Comparison Matrix */}
      <div>
        <div className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          Alternative Readings &amp; Interpretation Stability Matrix
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {pkg.alternatives.map((alt, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-[#0d101b] border border-white/5 space-y-2 hover:border-cyan-500/30 transition-all lyzr-card-hover"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">{alt.axis}</span>
                <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                  alt.variance_pct > 15 ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : alt.variance_pct > 5 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}>
                  {alt.variance_pct.toFixed(1)}% var
                </span>
              </div>
              <div className="text-sm font-bold text-white flex items-center justify-between">
                <span>{alt.reading}</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
              </div>
              <div className="text-lg font-mono font-semibold text-cyan-300">{formatCurrency(alt.value)}</div>
              <div className="text-[11px] text-slate-400 leading-relaxed">{alt.description}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Confidence Analysis Banner */}
      <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/20 text-xs text-cyan-200 leading-relaxed">
        <span className="font-semibold text-cyan-300 mr-1">Confidence Analysis:</span>
        {pkg.confidence_explanation}
      </div>

      {/* Evidence Table Component */}
      <EvidenceTable
        breakdown={pkg.breakdown_table}
        records={pkg.underlying_records}
        sql={pkg.query_executed}
        filters={pkg.filters_applied}
      />
    </div>
  );
};
