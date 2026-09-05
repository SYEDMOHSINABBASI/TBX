'use client';

import React from 'react';
import { AlertTriangle, TrendingUp, AlertCircle } from 'lucide-react';
import { AnomalyCallout as AnomalyType } from '@/lib/types';

interface AnomalyCalloutProps {
  anomalies: AnomalyType[];
}

export const AnomalyCallout: React.FC<AnomalyCalloutProps> = ({ anomalies }) => {
  if (!anomalies || anomalies.length === 0) return null;

  return (
    <div className="space-y-2 mt-3">
      {anomalies.map((anom, idx) => {
        const isHigh = anom.severity === 'High';
        return (
          <div
            key={idx}
            className={`p-3 rounded-lg border flex items-start gap-3 text-xs leading-relaxed transition-all ${
              isHigh
                ? 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                : 'bg-blue-950/40 border-blue-500/40 text-blue-200'
            }`}
          >
            <div className="p-1 rounded bg-black/30 mt-0.5">
              {isHigh ? (
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              ) : (
                <TrendingUp className="w-4 h-4 text-blue-400" />
              )}
            </div>
            <div>
              <span className="font-semibold text-white mr-1">[{anom.type}]:</span>
              {anom.message}
            </div>
          </div>
        );
      })}
    </div>
  );
};
