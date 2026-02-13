
import React from 'react';
import { MediaMixLine } from '../types';

interface Props {
  lines: MediaMixLine[];
  subtotal: number;
}

const VisualBars: React.FC<Props> = ({ lines, subtotal }) => {
  if (subtotal === 0) return null;

  return (
    <div className="space-y-4 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <h3 className="text-slate-800 font-bold text-md mb-4 flex items-center gap-2">
        <span className="w-1 h-4 bg-indigo-500 rounded-full"></span>
        라인별 예산 비중
      </h3>
      <div className="space-y-3">
        {lines.map((line, idx) => {
          const ratio = (line.price_actual / subtotal) * 100;
          return (
            <div key={idx} className="space-y-1">
              <div className="flex justify-between text-xs font-medium text-slate-600">
                <span>[{line.ad_type}] {line.screen} - {line.placement}</span>
                <span>{ratio.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <div 
                  className="bg-indigo-500 h-full transition-all duration-500" 
                  style={{ width: `${ratio}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default VisualBars;
