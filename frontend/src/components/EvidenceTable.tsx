'use client';

import React, { useState } from 'react';
import { Database, Table, Filter, Code2, ChevronDown, ChevronUp } from 'lucide-react';
import { BreakdownRecord, UnderlyingRecord } from '@/lib/types';
import { CSVExportButton } from './CSVExportButton';

interface EvidenceTableProps {
  breakdown: BreakdownRecord[];
  records: UnderlyingRecord[];
  sql: string;
  filters: Record<string, any>;
}

export const EvidenceTable: React.FC<EvidenceTableProps> = ({
  breakdown,
  records,
  sql,
  filters
}) => {
  const [activeTab, setActiveTab] = useState<'breakdown' | 'records' | 'sql'>('breakdown');
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const formatCurrency = (val: number) => {
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)} Lakh`;
    return `₹${val.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="mt-4 border border-surface-border/80 rounded-xl bg-surface/60 overflow-hidden text-xs">
      {/* Header Toggle */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 bg-surface-border/40 hover:bg-surface-border/70 flex items-center justify-between transition-colors border-b border-white/5"
      >
        <div className="flex items-center gap-2 font-medium text-slate-200">
          <Database className="w-4 h-4 text-blue-400" />
          <span>Evidence & Underlying Records ({records?.length || 0} items)</span>
        </div>
        <div className="flex items-center gap-2 text-slate-400 text-xs">
          <span>{isExpanded ? 'Hide details' : 'Show evidence'}</span>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Navigation Tabs + Export */}
          <div className="flex items-center justify-between border-b border-surface-border/80 pb-2">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveTab('breakdown')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all font-medium ${
                  activeTab === 'breakdown'
                    ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Table className="w-3.5 h-3.5" />
                Breakdown Table ({breakdown?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('records')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all font-medium ${
                  activeTab === 'records'
                    ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Filter className="w-3.5 h-3.5" />
                Underlying Records ({records?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('sql')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all font-medium ${
                  activeTab === 'sql'
                    ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                DuckDB SQL Query
              </button>
            </div>

            <CSVExportButton data={records} />
          </div>

          {/* Active Tab View */}
          {activeTab === 'breakdown' && (
            <div className="overflow-x-auto max-h-60 overflow-y-auto rounded-lg border border-surface-border/50">
              {breakdown && breakdown.length > 0 ? (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-border/40 text-slate-300 border-b border-surface-border/80 sticky top-0">
                      <th className="p-2.5 font-semibold">Group / Item</th>
                      <th className="p-2.5 font-semibold text-right">Computed Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border/30 text-slate-300">
                    {breakdown.map((row, idx) => (
                      <tr key={idx} className="hover:bg-white/5 transition-colors">
                        <td className="p-2.5 font-medium text-white">{row.group_label}</td>
                        <td className="p-2.5 text-right font-mono text-blue-300">{formatCurrency(row.metric_value)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-4 text-center text-slate-400 italic">No category/group breakdown required for this single aggregate query.</div>
              )}
            </div>
          )}

          {activeTab === 'records' && (
            <div className="overflow-x-auto max-h-60 overflow-y-auto rounded-lg border border-surface-border/50">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-border/40 text-slate-300 border-b border-surface-border/80 sticky top-0">
                    <th className="p-2 font-semibold">Txn ID</th>
                    <th className="p-2 font-semibold">Vendor</th>
                    <th className="p-2 font-semibold">Category</th>
                    <th className="p-2 font-semibold text-right">Amount</th>
                    <th className="p-2 font-semibold">Txn Date</th>
                    <th className="p-2 font-semibold">Stl Date</th>
                    <th className="p-2 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border/30 text-slate-300 font-mono text-[11px]">
                  {records && records.map((r, idx) => (
                    <tr key={idx} className="hover:bg-white/5 transition-colors">
                      <td className="p-2 text-slate-400">{r.transaction_id}</td>
                      <td className="p-2 font-medium text-white">{r.vendor_name}</td>
                      <td className="p-2 text-slate-400">{r.category}</td>
                      <td className="p-2 text-right text-emerald-400">{formatCurrency(r.amount)}</td>
                      <td className="p-2 text-slate-400">{r.tx_date}</td>
                      <td className="p-2 text-slate-400">{r.st_date}</td>
                      <td className="p-2">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${
                          r.status === 'completed' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-amber-950 text-amber-300 border border-amber-800'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'sql' && (
            <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 font-mono text-xs text-blue-300 overflow-x-auto">
              <div className="text-slate-500 mb-1 text-[11px]">// Approved DuckDB Read-Only Query Executed:</div>
              <pre className="whitespace-pre-wrap">{sql}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
