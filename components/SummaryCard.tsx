
import React from 'react';
import { MediaMixResult } from '../types';

interface Props {
  result: MediaMixResult;
  budgetTotal: number;
  commissionRate: number;
}

const SummaryCard: React.FC<Props> = ({ result, budgetTotal, commissionRate }) => {
  // 수수료는 이제 '표기용'이므로 총 집행액 계산에서는 제외하고 정보로만 노출
  const commissionAmount = Math.floor(result.discounted_subtotal * (commissionRate / 100));
  const totalEstimatedCost = result.discounted_subtotal; // 수수료 합산 제외 (순 매체비 기준)

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="bg-slate-800 px-6 py-4 flex justify-between items-center">
        <h3 className="text-white font-bold text-lg">📊 미디어믹스 요약</h3>
        <span className="bg-indigo-500 text-[10px] text-white px-2 py-0.5 rounded font-black uppercase tracking-widest">Performance Summary</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-6 border-b border-slate-100">
        <div className="space-y-1">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-tighter">구성 라인 / 총 기간</p>
          <p className="text-xl font-bold text-slate-900">{result.lines.length}개 / {Math.floor(result.total_days / 7)}주 {result.total_days % 7}일</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-tighter">순 매체비 (NET)</p>
          <p className="text-xl font-bold text-indigo-600">{result.discounted_subtotal.toLocaleString()}원</p>
          <p className="text-[10px] text-slate-400">예산 대비 잔액: {result.residual.toLocaleString()}원 ({result.residual_percent.toFixed(1)}%)</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-tighter">대행 수수료 ({commissionRate}%)</p>
          <p className="text-xl font-bold text-slate-400">
            - {commissionAmount.toLocaleString()}원
          </p>
          <p className="text-[10px] text-slate-400 italic">※ 매체비 내 포함 (정보용 표기)</p>
        </div>
        <div className="space-y-1 bg-indigo-50 p-3 rounded-xl border border-indigo-100">
          <p className="text-xs text-indigo-500 font-black uppercase tracking-widest">최종 집행 금액</p>
          <p className="text-xl font-black text-indigo-900">{totalEstimatedCost.toLocaleString()}원</p>
          <p className="text-[10px] text-indigo-400 leading-tight">VAT 별도 / 순 매체비 합계</p>
        </div>
      </div>
      <div className="px-6 py-3 bg-slate-50 flex justify-between items-center text-sm">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></span>
          <span className="text-slate-600 font-medium italic text-[11px]">모든 제안가는 10만 단위 올림(Ceil) 정책이 적용되었습니다.</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-slate-400 text-[11px]">적용 할인율:</span>
          <span className="text-indigo-600 font-black text-xs px-2 py-0.5 bg-white border border-indigo-100 rounded-full">{result.discount_label}</span>
        </div>
      </div>
    </div>
  );
};

export default SummaryCard;
