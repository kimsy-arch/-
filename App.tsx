
import React, { useState, useEffect, useCallback } from 'react';
import { 
  MediaMixInput, 
  MediaMixResult, 
  CatalogItem,
  Booking,
  MediaMixLine
} from './types';
import { generateMediaMix, calculateResult, createLine } from './services/mediaMixLogic';
import SummaryCard from './components/SummaryCard';
import VisualBars from './components/VisualBars';
import ScheduleChart from './components/ScheduleChart';
import BookingManager from './components/BookingManager';
import CatalogManager from './components/CatalogManager';

const STORAGE_KEY = 'medigate_engine_data_v6';

const DEFAULT_CATALOG: CatalogItem[] = [
  { id: "A1", screen: "PC Main", placement: "A1", size: "560 X 187", ad_type: "JPEG, GIF", price_4w: 5000000, rotation: "6 구좌", total_slots: 6, impressions_4w: 100000, ctr: "0.21%" },
  { id: "A2", screen: "PC Main", placement: "A2", size: "270 X 187", ad_type: "JPEG", price_4w: 4000000, rotation: "6 구좌", total_slots: 6, impressions_4w: 100000, ctr: "0.21%" },
  { id: "TOP", screen: "PC Main", placement: "TOP", size: "800 X 80", ad_type: "JPEG", price_4w: 4000000, rotation: "5 구좌", total_slots: 5, impressions_4w: 140000, ctr: "0.14%" },
  { id: "BL", screen: "PC Main", placement: "BL", size: "200 X 420", ad_type: "JPEG, GIF", price_4w: 5000000, rotation: "2 구좌", total_slots: 2, impressions_4w: 200000, ctr: "0.05%" },
  { id: "B", screen: "PC Main", placement: "B", size: "200 X 210", ad_type: "JPEG, GIF", price_4w: 3000000, rotation: "10 구좌", total_slots: 10, impressions_4w: 180000, ctr: "0.05%" },
  { id: "COMM_MID", screen: "Mobile Sub", placement: "커뮤 Middle", size: "750 X 240", ad_type: "JPEG", price_4w: 4000000, rotation: "10 구좌", total_slots: 10, impressions_4w: "30만 보장", ctr: "0.15%" },
  { id: "COMM_LOW", screen: "Mobile Sub", placement: "커뮤 Lower", size: "750 X 240", ad_type: "JPEG, GIF, VOD", price_4w: 2500000, rotation: "6 구좌", total_slots: 6, impressions_4w: 400000, ctr: "0.04%" },
  { id: "MID", screen: "Mobile Main", placement: "Middle", size: "750 X 240", ad_type: "JPEG, GIF, VOD", price_4w: 2500000, rotation: "5 구좌", total_slots: 5, impressions_4w: 130000, ctr: "0.01%" },
  { id: "LOW", screen: "Mobile Main", placement: "Lower", size: "750 X 240", ad_type: "JPEG", price_4w: 2000000, rotation: "5 구좌 슬라이드", total_slots: 5, impressions_4w: 130000, ctr: "0.03%" }
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'mixer' | 'bookings' | 'schedule' | 'catalog'>('mixer');
  
  // 상태 초기화
  const [catalog, setCatalog] = useState<CatalogItem[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_catalog`);
    return saved ? JSON.parse(saved) : DEFAULT_CATALOG;
  });
  const [budget, setBudget] = useState<number>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_budget`);
    return saved ? Number(saved) : 20000000;
  });
  const [commission, setCommission] = useState<number>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_commission`);
    return saved ? Number(saved) : 20;
  });
  const [discountRate, setDiscountRate] = useState<number>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_discount`);
    return saved ? Number(saved) : 0;
  });
  const [durationDays, setDurationDays] = useState<number>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_duration`);
    return saved ? Number(saved) : 28;
  });
  const [startDate, setStartDate] = useState<string>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_start_date`);
    return saved || new Date().toISOString().split('T')[0];
  });
  const [bookings, setBookings] = useState<Booking[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_bookings`);
    return saved ? JSON.parse(saved) : [];
  });

  const [currentLines, setCurrentLines] = useState<MediaMixLine[]>([]);
  const [isManualMode, setIsManualMode] = useState(false);

  // 데이터 변경 시 LocalStorage 저장
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_catalog`, JSON.stringify(catalog));
    localStorage.setItem(`${STORAGE_KEY}_budget`, budget.toString());
    localStorage.setItem(`${STORAGE_KEY}_commission`, commission.toString());
    localStorage.setItem(`${STORAGE_KEY}_discount`, discountRate.toString());
    localStorage.setItem(`${STORAGE_KEY}_duration`, durationDays.toString());
    localStorage.setItem(`${STORAGE_KEY}_start_date`, startDate);
    localStorage.setItem(`${STORAGE_KEY}_bookings`, JSON.stringify(bookings));
  }, [catalog, budget, commission, discountRate, durationDays, startDate, bookings]);

  const handleGenerate = useCallback(() => {
    const input: MediaMixInput = {
      budget_total: budget,
      catalog: catalog,
      priority_order: catalog.map(c => c.id),
      commission_rate: commission,
      discount: { type: "none", rate: discountRate },
      duration_days: durationDays,
      start_date: startDate,
      existing_bookings: bookings,
      rules: {
        min_total_weeks: 1,
        line_week_options: [4],
        allow_duplicate_lines: false,
        max_lines: 10,
        big_residual_threshold: 0.1
      }
    };
    const newMix = generateMediaMix(input);
    setCurrentLines(newMix.lines);
    setIsManualMode(false);
  }, [budget, commission, discountRate, durationDays, startDate, bookings, catalog]);

  // 부킹 업데이트 핸들러 (Fix for: Cannot find name 'updateBooking')
  const updateBooking = useCallback((updated: Booking) => {
    setBookings(prev => prev.map(b => b.id === updated.id ? updated : b));
  }, []);

  // 최초 로드 및 주요 설정 변경 시 자동 제안 (단, 수동 모드가 아닐 때만)
  useEffect(() => { 
    if (!isManualMode) {
      handleGenerate(); 
    }
  }, [budget, durationDays, discountRate, catalog, handleGenerate, isManualMode]);

  // 수동 편집: 라인 삭제
  const handleRemoveLine = (idx: number) => {
    setIsManualMode(true);
    setCurrentLines(prev => prev.filter((_, i) => i !== idx));
  };

  // 수동 편집: 라인 추가
  const handleAddLine = (productId: string) => {
    const item = catalog.find(c => c.id === productId);
    if (!item) return;
    
    // 이미 추가된 상품인지 체크 (중복 방지 룰 적용 시)
    if (currentLines.find(l => l.id === productId)) {
      alert('이미 믹스에 포함된 상품입니다.');
      return;
    }

    setIsManualMode(true);
    const newLine = createLine(item, durationDays);
    setCurrentLines(prev => [...prev, newLine]);
  };

  // 최종 결과 계산 (currentLines 기반)
  const result = calculateResult(currentLines, budget, discountRate, durationDays);

  const formatDuration = (days: number) => {
    const weeks = Math.floor(days / 7);
    const rem = days % 7;
    return weeks > 0 ? `${weeks}주 ${rem > 0 ? rem + '일' : ''}` : `${days}일`;
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-['Pretendard']">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-xl italic shadow-indigo-100 shadow-lg">M</div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-slate-900 leading-tight">메디게이트 믹스 엔진</h1>
              <div className="flex items-center gap-2">
                <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Advanced Studio v6.0</p>
                <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                <p className="text-[9px] font-bold text-green-500 uppercase tracking-widest animate-pulse">Auto-Saving On</p>
              </div>
            </div>
          </div>
          <nav className="flex bg-slate-100 p-1 rounded-lg">
            {[
              {id: 'mixer', label: '믹스 생성'},
              {id: 'bookings', label: '부킹 관리'},
              {id: 'schedule', label: '부킹 현황'},
              {id: 'catalog', label: '상품 관리'}
            ].map((tab) => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-md text-[11px] font-black transition-all uppercase tracking-tighter ${activeTab === tab.id ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 mt-8">
        {activeTab === 'mixer' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* 좌측 컨트롤러 */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-slate-800 px-5 py-4 flex items-center justify-between">
                  <h2 className="text-white font-bold text-sm">Campaign Control</h2>
                  <div className="flex items-center gap-2">
                    {isManualMode && <span className="text-[10px] bg-rose-500 text-white px-1.5 py-0.5 rounded font-bold">수동 편집중</span>}
                  </div>
                </div>
                <div className="p-6 space-y-8">
                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <label className="text-sm font-bold text-slate-700">순 매체비 예산</label>
                      <span className="text-lg font-black text-indigo-600">{(budget/10000).toLocaleString()}만원</span>
                    </div>
                    <input type="range" min="1000000" max="100000000" step="500000" value={budget} onChange={(e) => setBudget(Number(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                  </div>

                  <div className="space-y-4">
                    <label className="text-sm font-bold text-slate-700">집행 시작일</label>
                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-indigo-500 cursor-pointer" />
                  </div>

                  <div className="space-y-4">
                    <label className="text-sm font-bold text-slate-700">집행 기간: {formatDuration(durationDays)}</label>
                    <input type="range" min="1" max="90" step="1" value={durationDays} onChange={(e) => {
                      setDurationDays(Number(e.target.value));
                      setIsManualMode(false); // 기간 변경 시에는 전체 척도가 바뀌므로 자동 제안 모드로 복귀 추천
                    }} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                  </div>

                  <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">수수료 ({commission}%)</label>
                      <input type="range" min="0" max="30" step="5" value={commission} onChange={(e) => setCommission(Number(e.target.value))} className="w-full accent-rose-400" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">할인율 ({discountRate}%)</label>
                      <input type="range" min="0" max="50" step="1" value={discountRate} onChange={(e) => setDiscountRate(Number(e.target.value))} className="w-full accent-indigo-400" />
                    </div>
                  </div>

                  <button 
                    onClick={handleGenerate}
                    className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-black transition-all uppercase tracking-tighter flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                    AI 제안 다시받기 (초기화)
                  </button>
                </div>
              </div>
            </div>

            {/* 우측 결과창 */}
            <div className="lg:col-span-8 space-y-6">
              {result && (
                <>
                  <SummaryCard result={result} budgetTotal={budget} commissionRate={commission} />
                  
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-slate-800 font-bold text-md flex items-center gap-2">
                        <span className="w-1.5 h-4 bg-indigo-600 rounded-full"></span>
                        맞춤 미디어믹스 리스트
                      </h3>
                      <div className="flex gap-2">
                        <select 
                          className="text-[11px] font-bold border border-slate-200 rounded-lg px-2 py-1 bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-500"
                          onChange={(e) => {
                            if(e.target.value) {
                              handleAddLine(e.target.value);
                              e.target.value = "";
                            }
                          }}
                        >
                          <option value="">+ 지면 직접 추가</option>
                          {catalog
                            .filter(c => !currentLines.find(l => l.id === c.id))
                            .map(c => (
                              <option key={c.id} value={c.id}>[{c.screen}] {c.placement}</option>
                            ))
                          }
                        </select>
                      </div>
                    </div>

                    <div className="overflow-x-auto border border-slate-100 rounded-xl">
                      <table className="min-w-full text-xs">
                        <thead className="bg-slate-50 text-slate-500 font-bold">
                          <tr>
                            <th className="p-3 text-left">화면 | 위치</th>
                            <th className="p-3 text-left">사이즈 | 타입</th>
                            <th className="p-3 text-right">금액(VAT별도)</th>
                            <th className="p-3 text-center">기간</th>
                            <th className="p-3 text-left">예상 노출량</th>
                            <th className="p-3 text-right">관리</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {result.lines.map((l, i) => (
                            <tr key={`${l.id}-${i}`} className="hover:bg-indigo-50/20 transition-colors group">
                              <td className="p-3"><span className="font-bold text-slate-900">{l.screen}</span><br/><span className="text-slate-400 text-[10px]">{l.placement}</span></td>
                              <td className="p-3"><span className="text-slate-700 font-medium">{l.ad_type}</span><br/><span className="text-slate-400 text-[10px]">{l.size}</span></td>
                              <td className="p-3 text-right font-black text-indigo-600">{l.price_actual.toLocaleString()}원</td>
                              <td className="p-3 text-center font-bold text-slate-400">{formatDuration(l.days)}</td>
                              <td className="p-3 text-slate-600 font-medium">{l.impressions_actual_text}</td>
                              <td className="p-3 text-right">
                                <button 
                                  onClick={() => handleRemoveLine(i)}
                                  className="text-slate-300 hover:text-rose-500 transition-colors p-1"
                                  title="삭제"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                </button>
                              </td>
                            </tr>
                          ))}
                          {result.lines.length === 0 && (
                            <tr>
                              <td colSpan={6} className="p-10 text-center text-slate-400 font-medium">선택된 광고 지면이 없습니다.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <VisualBars lines={result.lines} subtotal={result.subtotal} />
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === 'bookings' && (
          <BookingManager 
            catalog={catalog} 
            bookings={bookings} 
            onAddBooking={(b) => setBookings([...bookings, b])}
            onUpdateBooking={updateBooking}
            onDeleteBooking={(id) => setBookings(bookings.filter(b => b.id !== id))}
          />
        )}

        {activeTab === 'schedule' && (
          <ScheduleChart catalog={catalog} bookings={bookings} />
        )}

        {activeTab === 'catalog' && (
          <CatalogManager 
            catalog={catalog} 
            onUpdateCatalog={setCatalog} 
          />
        )}
      </main>
    </div>
  );
};

export default App;
