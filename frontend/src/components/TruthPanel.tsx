'use client';

import React from 'react';
import { CheckCircle2, AlertTriangle, ShieldAlert, Sparkles, Layers, Sliders } from 'lucide-react';
import { VerifiedResultPackage, TruthVerdict } from '@/lib/types';
import { EvidenceTable } from './EvidenceTable';
import { AnomalyCallout } from './AnomalyCallout';

interface TruthPanelProps {
  pkg: VerifiedResultPackage;
}

export const TruthPanel: React.FC<TruthPanelProps> = ({ pkg }) => {
  const getVerdictBadge = (verdict: TruthVerdict) => {
    switch (verdict) {
      case 'Stable':
        return (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-semibold shadow-sm">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Truth Status: STABLE (&lt; 5% Variance)</span>
          </div>
        );
      case 'Sensitive':
        return (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-semibold shadow-sm animate-pulse-glow">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Truth Status: SENSITIVE (5-15% Variance)</span>
          </div>
        );
      case 'Fragile':
        return (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 text-xs font-semibold shadow-sm">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Truth Status: FRAGILE (&gt; 15% Variance)</span>
          </div>
        );
    }
  };

  const formatCurrency = (val: number) => {
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)} Lakh`;
    return `₹${val.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="mt-3 p-5 rounded-2xl glass-card border border-surface-border space-y-5 shadow-2xl">
      {/* Header Verdict & Primary Result */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-surface-border/60 pb-4">
        <div>
          <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            Primary Result (Default Reading)
          </div>
          <div className="text-3xl font-extrabold text-white tracking-tight">
            {formatCurrency(pkg.primary_value)}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            {pkg.primary_label || 'Calculated metric'}
          </div>
        </div>

        <div>
          {getVerdictBadge(pkg.verdict)}
        </div>
      </div>

      {/* Primary Interpretation Note */}
      <div className="bg-slate-900/60 p-3 rounded-xl border border-white/5 flex items-start gap-2 text-xs">
        <Sliders className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
        <div>
          <span className="font-semibold text-slate-300">Documented Primary Interpretation:</span>{' '}
          <span className="text-slate-400">{pkg.interpretation_used}</span>
        </div>
      </div>

      {/* Alternatives Comparison Matrix */}
      <div>
        <div className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-blue-400" />
          Alternative Readings &amp; Interpretation Stability Matrix
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {pkg.alternatives.map((alt, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl bg-surface-border/30 border border-white/5 space-y-1.5 hover:border-blue-500/30 transition-all"
            >
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-medium">{alt.axis}</span>
                <span className={`px-2 py-0.5 rounded font-mono font-semibold text-[10px] ${
                  alt.variance_pct > 15 ? 'bg-rose-500/20 text-rose-300' : alt.variance_pct > 5 ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
                }`}>
                  {alt.variance_pct.toFixed(1)}% var
                </span>
              </div>
              <div className="text-sm font-bold text-white">{alt.reading}</div>
              <div className="text-base font-mono font-semibold text-blue-300">{formatCurrency(alt.value)}</div>
              <div className="text-[11px] text-slate-400 leading-snug">{alt.description}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Confidence Explanation */}
      <div className="p-3.5 rounded-xl bg-blue-950/20 border border-blue-500/20 text-xs text-blue-200">
        <span className="font-semibold text-blue-300">Confidence Analysis:</span>{' '}
        {pkg.confidence_explanation}
      </div>

      {/* Anomaly Callouts */}
      <AnomalyCallout anomalies={pkg.anomalies} />

      {/* Evidence Table */}
      <EvidenceTable
        breakdown={pkg.breakdown_table}
        records={pkg.underlying_records}
        sql={pkg.query_executed}
        filters={pkg.filters_applied}
      />
    </div>
  );
};
