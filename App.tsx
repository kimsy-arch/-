
import React, { useState, useEffect, useCallback, useRef } from 'react';
import * as fflate from 'fflate';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
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

const STORAGE_KEY = 'medigate_engine_v7_persistent';

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
  const [showToast, setShowToast] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  
  const resultRef = useRef<HTMLDivElement>(null);

  // Core States
  const [catalog, setCatalog] = useState<CatalogItem[]>(DEFAULT_CATALOG);
  const [budget, setBudget] = useState<number>(20000000);
  const [commission, setCommission] = useState<number>(20);
  const [discountRate, setDiscountRate] = useState<number>(0);
  const [durationDays, setDurationDays] = useState<number>(28);
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [currentLines, setCurrentLines] = useState<MediaMixLine[]>([]);
  const [isManualMode, setIsManualMode] = useState(false);

  // 1. Robust Data Compression
  const compress = (data: any) => {
    try {
      const json = JSON.stringify(data);
      const buf = new TextEncoder().encode(json);
      const compressed = fflate.zlibSync(buf, { level: 9 });
      
      // btoa stack overflow 방지 로직
      let binary = '';
      const len = compressed.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(compressed[i]);
      }
      
      return btoa(binary)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
    } catch (e) {
      console.error("Compression Error", e);
      return "";
    }
  };

  const decompress = (str: string) => {
    try {
      let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
      while (base64.length % 4) base64 += '=';
      const binaryString = atob(base64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const decompressed = fflate.unzlibSync(bytes);
      const decoded = new TextDecoder().decode(decompressed);
      return JSON.parse(decoded);
    } catch (e) {
      console.error("Decompression Error", e);
      return null;
    }
  };

  // 2. Persistent Storage & URL Load Logic
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const s = params.get('s');

    if (s) {
      const d = decompress(s);
      if (d) {
        // 데이터가 유효할 때만 상태 업데이트
        if (Array.isArray(d.c)) setCatalog(d.c);
        if (typeof d.b === 'number') setBudget(d.b);
        if (typeof d.cm === 'number') setCommission(d.cm);
        if (typeof d.dr === 'number') setDiscountRate(d.dr);
        if (typeof d.dd === 'number') setDurationDays(d.dd);
        if (d.sd) setStartDate(d.sd);
        if (Array.isArray(d.bk)) setBookings(d.bk);
        console.log("Shared data successfully loaded from URL");
      } else {
        console.warn("Shared data corrupted or incomplete. Falling back to local storage.");
        loadFromLocalStorage();
      }
    } else {
      loadFromLocalStorage();
    }
  }, []);

  const loadFromLocalStorage = () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const d = JSON.parse(saved);
        if (d.catalog) setCatalog(d.catalog);
        if (d.budget !== undefined) setBudget(d.budget);
        if (d.commission !== undefined) setCommission(d.commission);
        if (d.discountRate !== undefined) setDiscountRate(d.discountRate);
        if (d.durationDays !== undefined) setDurationDays(d.durationDays);
        if (d.startDate) setStartDate(d.startDate);
        if (d.bookings) setBookings(d.bookings);
      } catch (e) {
        console.error("Failed to parse local storage", e);
      }
    }
  };

  // 3. Auto-Save to LocalStorage
  useEffect(() => {
    const stateToSave = {
      catalog, budget, commission, discountRate, durationDays, startDate, bookings
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
  }, [catalog, budget, commission, discountRate, durationDays, startDate, bookings]);

  // 4. Handle Share
  const handleShare = () => {
    // URL 길이를 최대한 줄이기 위해 필수 데이터만 압축
    const state = { 
      c: catalog, 
      b: budget, 
      cm: commission, 
      dr: discountRate, 
      dd: durationDays, 
      sd: startDate, 
      bk: bookings 
    };
    const compressed = compress(state);
    if (!compressed) {
      alert("공유 데이터 생성 중 오류가 발생했습니다.");
      return;
    }
    const shareUrl = `${window.location.origin}${window.location.pathname}?s=${compressed}`;
    
    // Vercel 등 배포 환경에서 URL 길이 제한이 있을 수 있으므로 알림 추가
    if (shareUrl.length > 3500) {
      console.warn("Shared URL is very long. It might be truncated in some browsers.");
    }

    navigator.clipboard.writeText(shareUrl).then(() => {
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    });
  };

  const handleDownloadPDF = async () => {
    if (!resultRef.current || currentLines.length === 0) return;
    setIsDownloading(true);
    window.scrollTo(0, 0);
    
    setTimeout(async () => {
      try {
        const canvas = await html2canvas(resultRef.current!, {
          scale: 3, 
          useCORS: true,
          backgroundColor: '#f8fafc',
          ignoreElements: (el) => el.classList.contains('pdf-hide'),
        });
        const imgData = canvas.toDataURL('image/png', 1.0);
        const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4', compress: true });
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const imgWidth = pdfWidth - 14; 
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        pdf.addImage(imgData, 'PNG', 7, 10, imgWidth, imgHeight);
        pdf.save(`미디어믹스_제안서_${new Date().toISOString().split('T')[0]}.pdf`);
      } catch (e) { alert('PDF 생성 실패'); } finally { setIsDownloading(false); }
    }, 150);
  };

  const handleGenerate = useCallback(() => {
    if (!catalog.length) return;
    const input: MediaMixInput = {
      budget_total: budget, catalog, priority_order: catalog.map(c => c.id),
      commission_rate: commission, discount: { type: "none", rate: discountRate },
      duration_days: durationDays, start_date: startDate, existing_bookings: bookings,
      rules: { min_total_weeks: 1, line_week_options: [4], allow_duplicate_lines: false, max_lines: 10, big_residual_threshold: 0.1 }
    };
    const newMix = generateMediaMix(input);
    setCurrentLines(newMix.lines);
    setIsManualMode(false);
  }, [budget, commission, discountRate, durationDays, startDate, bookings, catalog]);

  const result = calculateResult(currentLines, budget, discountRate, durationDays);

  useEffect(() => { 
    if (!isManualMode) handleGenerate(); 
  }, [budget, durationDays, discountRate, catalog, handleGenerate, isManualMode]);

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-['Pretendard'] text-slate-800">
      {showToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 text-white px-5 py-2.5 rounded-full shadow-2xl font-bold text-[10px] animate-bounce">
          ✅ 모든 데이터가 포함된 안전한 공유 링크가 복사되었습니다
        </div>
      )}

      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-12 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-black text-sm shadow-md">M</div>
            <div>
              <h1 className="text-xs font-black text-slate-900 leading-none">메디게이트 믹스</h1>
              <p className="text-[7px] font-bold text-indigo-500 uppercase tracking-widest">v7.2 Cloud Stable</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <nav className="hidden lg:flex bg-slate-100 p-0.5 rounded-lg mr-1">
              {['mixer', 'bookings', 'schedule', 'catalog'].map((id) => (
                <button key={id} onClick={() => setActiveTab(id as any)} className={`px-2 py-1 rounded-md text-[9px] font-black transition-all uppercase ${activeTab === id ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>
                  {id === 'mixer' ? '믹스' : id === 'bookings' ? '부킹' : id === 'schedule' ? '현황' : '상품'}
                </button>
              ))}
            </nav>
            <button onClick={handleDownloadPDF} disabled={isDownloading || currentLines.length === 0} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[9px] font-black bg-white hover:bg-rose-50 text-rose-600 border border-rose-100 shadow-sm transition-all">
              {isDownloading ? '...' : 'PDF 제안서'}
            </button>
            <button onClick={handleShare} className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[9px] font-black shadow-md transition-all">
              스마트 링크 공유
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 mt-5">
        {activeTab === 'mixer' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-slate-900 px-4 py-2.5 flex items-center justify-between">
                  <h2 className="text-white font-black text-[10px] uppercase tracking-widest">Campaign Setup</h2>
                </div>
                <div className="p-5 space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between items-end"><label className="text-[9px] font-black text-slate-500 uppercase">가용 예산</label><span className="text-base font-black text-indigo-600 tracking-tighter">{(budget/10000).toLocaleString()}만원</span></div>
                    <input type="range" min="1000000" max="100000000" step="500000" value={budget} onChange={(e) => setBudget(Number(e.target.value))} className="w-full h-1 bg-slate-100 rounded-full appearance-none accent-indigo-600" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-500 uppercase">시작 날짜</label>
                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-black text-slate-800 outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-500 uppercase">집행 기간: {Math.floor(durationDays/7)}주 {durationDays%7}일</label>
                    <input type="range" min="1" max="90" step="1" value={durationDays} onChange={(e) => setDurationDays(Number(e.target.value))} className="w-full h-1 bg-slate-100 rounded-full appearance-none accent-indigo-600" />
                  </div>
                  <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-3">
                    <div className="space-y-1.5"><label className="text-[8px] font-black text-slate-400 uppercase">수수료 {commission}%</label><input type="range" min="0" max="30" step="5" value={commission} onChange={(e) => setCommission(Number(e.target.value))} className="w-full accent-rose-500" /></div>
                    <div className="space-y-1.5"><label className="text-[8px] font-black text-slate-400 uppercase">할인율 {discountRate}%</label><input type="range" min="0" max="50" step="1" value={discountRate} onChange={(e) => setDiscountRate(Number(e.target.value))} className="w-full accent-indigo-500" /></div>
                  </div>
                  <button onClick={handleGenerate} className="w-full py-2.5 bg-slate-900 text-white rounded-lg text-[9px] font-black hover:bg-slate-800 transition-all shadow-lg">AI 제안 스마트 생성</button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-8 space-y-5" ref={resultRef}>
              {result && (
                <>
                  <SummaryCard result={result} budgetTotal={budget} commissionRate={commission} />
                  
                  <div className="bg-white p-5 rounded-xl shadow-lg shadow-slate-200/40 border border-slate-200 space-y-5">
                    <div className="flex justify-between items-center">
                      <h3 className="text-slate-900 font-black text-[12px] flex items-center gap-1.5">
                        <span className="w-1 h-4 bg-indigo-600 rounded-full"></span>
                        제안 미디어믹스 리스트
                      </h3>
                      {!isDownloading && (
                        <select className="pdf-hide text-[9px] font-black border border-slate-200 rounded-lg px-2 py-1 bg-slate-50 outline-none hover:border-indigo-500 cursor-pointer shadow-sm" onChange={(e) => { if(e.target.value) { const item = catalog.find(c => c.id === e.target.value); if(item) { setIsManualMode(true); setCurrentLines(prev => [...prev, createLine(item, durationDays)]); e.target.value = ""; } } }}>
                          <option value="">+ 상품 직접 추가</option>
                          {catalog.filter(c => !currentLines.find(l => l.id === c.id)).map(c => <option key={c.id} value={c.id}>[{c.screen}] {c.placement}</option>)}
                        </select>
                      )}
                    </div>

                    <div className="overflow-x-auto rounded-lg border border-slate-100 overflow-hidden shadow-sm">
                      <table className="min-w-full text-[9.5px]">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100">
                            <th className="p-3 text-left font-black text-slate-400 uppercase tracking-tight">화면 | 위치</th>
                            <th className="p-3 text-center font-black text-slate-400 uppercase tracking-tight">배너 사이즈</th>
                            <th className="p-3 text-right font-black text-slate-400 uppercase tracking-tight">금액 (NET)</th>
                            <th className="p-3 text-center font-black text-slate-400 uppercase tracking-tight">기간</th>
                            <th className="p-3 text-left font-black text-slate-400 uppercase tracking-tight">예상 노출량</th>
                            <th className="p-3 text-center font-black text-slate-400 uppercase tracking-tight">예상 CTR</th>
                            {!isDownloading && <th className="pdf-hide p-3 text-right font-black text-slate-400">관리</th>}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {result.lines.map((l, i) => (
                            <tr key={`${l.id}-${i}`} className="hover:bg-indigo-50/10 transition-colors">
                              <td className="p-3">
                                <span className="font-black text-slate-900">{l.screen}</span><br/>
                                <span className="text-slate-400 text-[8px] font-bold uppercase">{l.placement}</span>
                              </td>
                              <td className="p-3 text-center text-slate-500 font-medium">{l.size}</td>
                              <td className="p-3 text-right font-black text-indigo-600">{l.price_actual.toLocaleString()}원</td>
                              <td className="p-3 text-center font-black text-slate-400">{l.days}일</td>
                              <td className="p-3 text-slate-700 font-bold tracking-tight">{l.impressions_actual_text}</td>
                              <td className="p-3 text-center"><span className="bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded font-black text-[8px]">{l.ctr}</span></td>
                              {!isDownloading && (
                                <td className="pdf-hide p-3 text-right">
                                  <button onClick={() => { setIsManualMode(true); setCurrentLines(prev => prev.filter((_, idx) => idx !== i)); }} className="text-slate-200 hover:text-rose-500 transition-all transform hover:scale-125">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                  </button>
                                </td>
                              )}
                            </tr>
                          ))}
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
        {activeTab === 'bookings' && <BookingManager catalog={catalog} bookings={bookings} onAddBooking={b => setBookings(p => [...p, b])} onAddBookings={bks => setBookings(p => [...p, ...bks])} onUpdateBooking={u => setBookings(p => p.map(b => b.id === u.id ? u : b))} onDeleteBooking={id => setBookings(p => p.filter(b => b.id !== id))} />}
        {activeTab === 'schedule' && <ScheduleChart catalog={catalog} bookings={bookings} />}
        {activeTab === 'catalog' && <CatalogManager catalog={catalog} onUpdateCatalog={setCatalog} />}
      </main>
    </div>
  );
};

export default App;
