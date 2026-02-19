
import React from 'react';
import { MediaMixResult } from '../types';

interface Props {
  result: MediaMixResult;
  budgetTotal: number;
  commissionRate: number;
}

const SummaryCard: React.FC<Props> = ({ result, budgetTotal, commissionRate }) => {
  const commissionAmount = Math.floor(result.discounted_subtotal * (commissionRate / 100));
  const totalEstimatedCost = result.discounted_subtotal; 

  return (
    <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/40 border border-slate-200 overflow-hidden mb-5">
      {/* Header Area */}
      <div className="bg-[#1e293b] px-6 py-3.5 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-xl">📊</span>
          <h3 className="text-white font-bold text-lg tracking-tight">미디어믹스 요약</h3>
        </div>
        <div className="bg-[#6366f1] text-[9px] text-white px-2.5 py-0.5 rounded font-black uppercase tracking-[0.15em] shadow-md shadow-indigo-500/20">
          Performance Summary
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 p-0">
        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-3 p-6 gap-6">
          <div className="space-y-1">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">구성 라인 / 총 기간</p>
            <p className="text-xl font-black text-slate-900 tracking-tighter">
              {result.lines.length}개 / <span className="text-slate-700">{Math.floor(result.total_days / 7)}주 {result.total_days % 7}일</span>
            </p>
          </div>
          
          <div className="space-y-1">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">순 매체비 (NET)</p>
            <div className="space-y-0.5">
              <p className="text-xl font-black text-[#6366f1] tracking-tighter">{result.discounted_subtotal.toLocaleString()}원</p>
              <p className="text-[10px] text-slate-400 font-medium">잔액: {result.residual.toLocaleString()}원 ({result.residual_percent.toFixed(1)}%)</p>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">대행 수수료 ({commissionRate}%)</p>
            <div className="space-y-0.5">
              <p className="text-xl font-black text-slate-400 tracking-tighter">- {commissionAmount.toLocaleString()}원</p>
              <p className="text-[9px] text-slate-400 italic font-medium">※ 매체비 내 포함</p>
            </div>
          </div>
        </div>

        {/* Final Price Box */}
        <div className="lg:col-span-4 p-5 bg-slate-50/30 flex items-center justify-center border-l border-slate-100">
          <div className="w-full bg-[#eef2ff] p-5 rounded-xl border border-[#e0e7ff] text-center shadow-inner">
            <p className="text-[10px] text-[#6366f1] font-black uppercase tracking-widest mb-1">최종 집행 금액</p>
            <p className="text-2xl font-black text-[#1e1b4b] tracking-tighter mb-0.5">{totalEstimatedCost.toLocaleString()}원</p>
            <p className="text-[9px] text-[#a5b4fc] font-bold">VAT 별도 / 순 매체비 합계</p>
          </div>
        </div>
      </div>

      {/* Footer Info Bar */}
      <div className="px-6 py-3 bg-slate-50/50 border-t border-slate-100 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-[#6366f1] rounded-full"></div>
          <p className="text-slate-500 font-bold italic text-[10px] tracking-tight">
            모든 제안가는 10만 단위 올림(Ceil) 정책이 적용되었습니다.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-[10px] font-bold">적용 할인율:</span>
          <div className="px-3 py-1 bg-white border border-slate-200 rounded-full shadow-sm">
            <span className="text-[#6366f1] font-black text-[10px] tracking-tight">{result.discount_label}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummaryCard;
