
import React from 'react';
import { CatalogItem, Booking } from '../types';

interface Props {
  catalog: CatalogItem[];
  bookings: Booking[];
}

const ScheduleChart: React.FC<Props> = ({ catalog, bookings }) => {
  const months = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
  const currentYear = new Date().getFullYear();

  /**
   * 월간 점유율 계산 (하루 단위 합산 기반 %)
   */
  const getOccupancyRate = (productId: string, totalSlots: number, monthIdx: number) => {
    const firstDay = new Date(currentYear, monthIdx, 1);
    const lastDay = new Date(currentYear, monthIdx + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    let totalUsedSlotDays = 0;

    // 해당 월의 모든 날짜를 순회하며 사용된 구좌 합산
    for (let day = 1; day <= daysInMonth; day++) {
      const current = new Date(currentYear, monthIdx, day).toISOString().split('T')[0];
      
      const usedOnThisDay = bookings
        .filter(b => b.productId === productId && current >= b.start_date && current <= b.end_date)
        .reduce((acc, curr) => acc + curr.slots_used, 0);
      
      totalUsedSlotDays += usedOnThisDay;
    }

    const totalAvailableSlotDays = totalSlots * daysInMonth;
    if (totalAvailableSlotDays === 0) return 0;

    return (totalUsedSlotDays / totalAvailableSlotDays) * 100;
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mt-6">
      <div className="bg-slate-800 px-6 py-4 flex justify-between items-center">
        <div className="flex flex-col">
          <h3 className="text-white font-bold text-md flex items-center gap-2">
            📅 {currentYear}년 인벤토리 점유 현황 (Occupancy)
          </h3>
          <p className="text-[10px] text-slate-400 font-medium">※ 월간 총 구좌 일수 대비 실제 부킹 비중(%)</p>
        </div>
        <div className="flex gap-4 text-[10px] text-slate-400 font-bold uppercase tracking-tight">
          <div className="flex items-center gap-1"><span className="w-2 h-2 bg-slate-100 rounded-full border border-slate-200"></span> 0%</div>
          <div className="flex items-center gap-1"><span className="w-2 h-2 bg-indigo-400 rounded-full"></span> 50%</div>
          <div className="flex items-center gap-1"><span className="w-2 h-2 bg-rose-500 rounded-full"></span> 100%</div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[11px] border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="p-4 text-left font-bold text-slate-500 sticky left-0 bg-slate-50 z-10 w-48 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">상품명 (총 구좌)</th>
              {months.map(m => <th key={m} className="p-4 text-center text-slate-400 min-w-[65px]">{m}</th>)}
            </tr>
          </thead>
          <tbody>
            {catalog.map(item => (
              <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                <td className="p-4 font-bold text-slate-700 sticky left-0 bg-white z-10 border-r border-slate-50 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                  <div className="flex flex-col">
                    <span>{item.placement}</span>
                    <span className="text-[9px] text-slate-400 font-medium uppercase tracking-tighter">{item.screen} | {item.total_slots} Slots</span>
                  </div>
                </td>
                {months.map((_, i) => {
                  const rate = getOccupancyRate(item.id, item.total_slots, i);
                  const isHigh = rate > 80;
                  const isZero = rate === 0;
                  
                  return (
                    <td key={i} className="p-2">
                      <div className={`h-8 rounded-lg flex items-center justify-center relative overflow-hidden transition-all border ${isZero ? 'bg-slate-50 border-slate-100 text-slate-300' : 'bg-white border-slate-100 shadow-sm text-slate-700'}`}>
                        {!isZero && (
                          <div 
                            className={`absolute left-0 top-0 bottom-0 opacity-20 transition-all duration-700 ${isHigh ? 'bg-rose-500' : 'bg-indigo-500'}`}
                            style={{ width: `${rate}%` }}
                          ></div>
                        )}
                        <span className={`relative z-10 font-black text-[10px] ${rate >= 100 ? 'text-rose-600' : ''}`}>
                          {rate.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ScheduleChart;
