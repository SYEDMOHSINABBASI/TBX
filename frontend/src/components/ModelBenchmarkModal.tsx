'use client';

import React, { useEffect, useState } from 'react';
import { Cpu, X, Check, Zap, Gauge, Award } from 'lucide-react';
import { ModelBenchmarkItem } from '@/lib/types';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ModelBenchmarkModal: React.FC<ModalProps> = ({ isOpen, onClose }) => {
  const [benchmarks, setBenchmarks] = useState<ModelBenchmarkItem[]>([]);
  const [justification, setJustification] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      fetch('/api/benchmark')
        .then(res => res.json())
        .then(data => {
          setBenchmarks(data.benchmarks || []);
          setJustification(data.justification || '');
        })
        .catch(err => console.error(err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface border border-surface-border rounded-2xl max-w-3xl w-full p-6 space-y-5 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white bg-white/5 hover:bg-white/10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Model Efficiency &amp; Benchmark Evaluation</h2>
            <p className="text-xs text-slate-400">Hackathon Requirement (20% Weight) - &lt; 20B Parameter Cap Justification</p>
          </div>
        </div>

        {/* Justification Banner */}
        <div className="p-4 rounded-xl bg-blue-950/30 border border-blue-500/30 text-xs text-blue-200 leading-relaxed">
          <div className="font-semibold text-blue-300 mb-1 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-blue-400" />
            Model Selection Justification:
          </div>
          {justification}
        </div>

        {/* Benchmark Table */}
        <div className="overflow-x-auto rounded-xl border border-surface-border">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-surface-border/50 text-slate-300 border-b border-surface-border">
                <th className="p-3 font-semibold">Model Class</th>
                <th className="p-3 font-semibold">Params</th>
                <th className="p-3 font-semibold">Intent Acc.</th>
                <th className="p-3 font-semibold">Filter Acc.</th>
                <th className="p-3 font-semibold">End-to-End Acc.</th>
                <th className="p-3 font-semibold">Median Latency</th>
                <th className="p-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border/40 text-slate-300">
              {benchmarks.map((b, idx) => (
                <tr key={idx} className={b.is_shipped ? 'bg-blue-600/10' : 'hover:bg-white/5'}>
                  <td className="p-3 font-medium text-white flex items-center gap-2">
                    {b.model_name}
                    {b.is_shipped && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-500 text-white font-bold uppercase">
                        Selected
                      </span>
                    )}
                  </td>
                  <td className="p-3 font-mono text-slate-400">{b.param_count}</td>
                  <td className="p-3 text-emerald-400 font-semibold">{b.intent_accuracy}</td>
                  <td className="p-3 text-emerald-400 font-semibold">{b.filter_accuracy}</td>
                  <td className="p-3 text-emerald-400 font-bold">{b.answer_accuracy}</td>
                  <td className="p-3 font-mono text-slate-300">{b.median_latency_ms} ms</td>
                  <td className="p-3">
                    {b.is_shipped ? (
                      <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                        <Check className="w-3.5 h-3.5" /> Shipped
                      </span>
                    ) : (
                      <span className="text-slate-500">Evaluated</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition-all"
          >
            Close Benchmark Details
          </button>
        </div>
      </div>
    </div>
  );
};
