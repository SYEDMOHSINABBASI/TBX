'use client';

import React from 'react';
import { Download } from 'lucide-react';

interface CSVExportButtonProps {
  data: any[];
  filename?: string;
}

export const CSVExportButton: React.FC<CSVExportButtonProps> = ({
  data,
  filename = 'tbx_truth_engine_evidence.csv'
}) => {
  const exportToCSV = () => {
    if (!data || data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvRows: string[] = [];
    csvRows.push(headers.join(','));

    for (const row of data) {
      const values = headers.map(header => {
        const val = row[header];
        const escaped = ('' + (val ?? '')).replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    }

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <button
      onClick={exportToCSV}
      disabled={!data || data.length === 0}
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-border/60 hover:bg-surface-border text-xs text-slate-300 hover:text-white transition-all border border-white/5 shadow-sm disabled:opacity-50"
    >
      <Download className="w-3.5 h-3.5 text-blue-400" />
      Export Evidence (CSV)
    </button>
  );
};
