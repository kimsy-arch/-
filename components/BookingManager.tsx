
import React, { useState } from 'react';
import { CatalogItem, Booking } from '../types';

interface Props {
  catalog: CatalogItem[];
  bookings: Booking[];
  onAddBooking: (booking: Booking) => void;
  onAddBookings: (bookings: Booking[]) => void;
  onUpdateBooking: (booking: Booking) => void;
  onDeleteBooking: (id: string) => void;
}

const BookingManager: React.FC<Props> = ({ catalog, bookings, onAddBooking, onAddBookings, onUpdateBooking, onDeleteBooking }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Booking>>({});
  const [excelInput, setExcelInput] = useState('');
  
  const [formData, setFormData] = useState({
    productId: catalog[0]?.id || '',
    clientName: '',
    start_date: '',
    end_date: '',
    slots_used: 1
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.productId || !formData.clientName || !formData.start_date || !formData.end_date) return;
    
    onAddBooking({
      ...formData,
      id: `book-${Date.now()}`
    });
    setFormData({ ...formData, clientName: '', start_date: '', end_date: '', slots_used: 1 });
  };

  const isValidDate = (dateStr: string) => {
    if (!dateStr) return false;
    const normalizedDate = dateStr.trim().replace(/[\.\/]/g, '-');
    const reg = /^\d{4}-\d{2}-\d{2}$/;
    return reg.test(normalizedDate);
  };

  /**
   * 엑셀에서 복사한 데이터를 분석하여 일괄 등록
   */
  const handleSmartImport = () => {
    if (!excelInput.trim()) return;

    const lines = excelInput.trim().split('\n');
    let newBookings: Booking[] = [];
    let failCount = 0;
    let errorDetails: string[] = [];

    lines.forEach((line, index) => {
      // 헤더 및 빈 줄 스킵
      if (index === 0 && (line.includes('업체명') || line.includes('상품') || line.includes('기간'))) return;
      if (!line.trim()) return;

      // 탭(\t), 쉼표(,), 세로바(|)를 모두 구분자로 사용
      const parts = line.split(/\t|,|\|/).map(p => p.trim());
      
      if (parts.length < 3) {
        failCount++;
        errorDetails.push(`라인 ${index + 1}: 데이터 컬럼 부족`);
        return;
      }

      const clientName = parts[0];
      const productCode = parts[1].toUpperCase();
      const periodStr = parts[2];

      // 기간 분해 (2026-01-19 ~ 2026-01-31)
      const dates = periodStr.split('~').map(d => d.trim().replace(/[\.\/]/g, '-'));
      const startDate = dates[0];
      const endDate = dates[1] || dates[0];

      if (!clientName || !productCode || !isValidDate(startDate) || !isValidDate(endDate)) {
        failCount++;
        errorDetails.push(`라인 ${index + 1}: 형식 오류 (${clientName || '업체명없음'})`);
        return;
      }

      // 상품 ID 매칭
      const matchedProduct = catalog.find(p => 
        p.id.toUpperCase() === productCode || 
        productCode.includes(p.id.toUpperCase())
      );

      if (!matchedProduct) {
        failCount++;
        errorDetails.push(`라인 ${index + 1}: 매칭 상품 없음 (${productCode})`);
        return;
      }

      newBookings.push({
        id: `book-ex-${Date.now()}-${index}`,
        productId: matchedProduct.id,
        clientName: clientName,
        start_date: startDate,
        end_date: endDate,
        slots_used: 1
      });
    });

    if (newBookings.length > 0) {
      onAddBookings(newBookings);
      alert(`${newBookings.length}건이 성공적으로 등록되었습니다.\n(실패: ${failCount}건)`);
    } else if (failCount > 0) {
      alert(`등록 가능한 데이터가 없습니다.\n\n[오류 내역]\n${errorDetails.slice(0, 5).join('\n')}${errorDetails.length > 5 ? '\n...' : ''}`);
    }

    setExcelInput('');
  };

  const startEditing = (b: Booking) => {
    setEditingId(b.id);
    setEditData(b);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleSaveEdit = () => {
    if (editingId && editData.start_date && editData.end_date) {
      if (!isValidDate(editData.start_date) || !isValidDate(editData.end_date)) {
        alert('날짜 형식이 올바르지 않습니다 (YYYY-MM-DD)');
        return;
      }
      onUpdateBooking(editData as Booking);
      setEditingId(null);
    }
  };

  const groupedBookings = bookings.reduce((acc, booking) => {
    if (!acc[booking.clientName]) acc[booking.clientName] = [];
    acc[booking.clientName].push(booking);
    return acc;
  }, {} as Record<string, Booking[]>);

  const advertisers = Object.keys(groupedBookings).sort();

  return (
    <div className="space-y-8 pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-full">
          <h3 className="text-slate-800 font-bold text-md mb-4 flex items-center gap-2">
            <span className="w-1.5 h-4 bg-indigo-600 rounded-full"></span>
            신규 부킹 개별 등록
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">상품 선택</label>
                <select value={formData.productId} onChange={e => setFormData({...formData, productId: e.target.value})} className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none">
                  {catalog.map(item => <option key={item.id} value={item.id}>{item.placement} ({item.screen})</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">광고주명</label>
                <input type="text" value={formData.clientName} placeholder="업체명 입력" onChange={e => setFormData({...formData, clientName: e.target.value})} className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">시작일</label>
                <input type="date" value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none cursor-pointer" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">종료일</label>
                <input type="date" value={formData.end_date} onChange={e => setFormData({...formData, end_date: e.target.value})} className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none cursor-pointer" />
              </div>
            </div>
            <button type="submit" className="w-full h-10 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs transition-colors shadow-lg shadow-indigo-100">부킹 추가하기</button>
          </form>
        </div>
        <div className="bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-700 h-full">
          <h3 className="text-white font-bold text-md mb-4 flex items-center gap-2">
            <span className="w-1.5 h-4 bg-green-500 rounded-full"></span>
            엑셀 데이터 스마트 붙여넣기
          </h3>
          <div className="space-y-4">
            <textarea value={excelInput} onChange={(e) => setExcelInput(e.target.value)} placeholder="여러 줄을 한 번에 붙여넣으세요.&#10;업체명 | 상품 | 게재 기간 순서로 인식합니다." className="w-full h-32 p-4 bg-slate-900 border border-slate-700 rounded-xl text-[11px] text-slate-300 font-medium placeholder:text-slate-600 focus:ring-2 focus:ring-green-500 outline-none resize-none"></textarea>
            <div className="flex justify-between items-center">
              <p className="text-[10px] text-slate-500 font-medium">※ 구분자 상관없이 모든 행을 한 번에 등록합니다.</p>
              <button onClick={handleSmartImport} className="px-6 h-10 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg text-xs transition-colors flex items-center gap-2 shadow-lg shadow-green-900/20">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                분석 후 일괄 등록 (여러 건 처리)
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="space-y-6">
        <h3 className="text-slate-800 font-black text-lg flex items-center gap-2">📋 현재 부킹 리스트 <span className="text-xs font-bold bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">{bookings.length}개 항목</span></h3>
        {advertisers.length === 0 ? (
          <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-20 text-center text-slate-400 font-bold">등록된 부킹 내역이 없습니다.</div>
        ) : (
          advertisers.map(advertiser => (
            <div key={advertiser} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-slate-50 px-6 py-3 border-b border-slate-100 flex justify-between items-center">
                <h4 className="text-slate-900 font-black text-sm">{advertiser}</h4>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{groupedBookings[advertiser].length} Banners</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs min-w-[600px]">
                  <thead className="bg-slate-50/50 text-[10px] text-slate-400 font-bold border-b border-slate-50">
                    <tr><th className="px-6 py-2 text-left">상품/위치</th><th className="px-6 py-2 text-center">집행 기간</th><th className="px-6 py-2 text-right">관리</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {groupedBookings[advertiser].map(b => {
                      const product = catalog.find(c => c.id === b.productId);
                      return (
                        <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4"><p className="font-bold text-slate-800">{product?.placement}</p><p className="text-[10px] text-slate-400">{product?.screen}</p></td>
                          <td className="px-6 py-4 text-center">
                            {editingId === b.id ? (
                              <div className="flex items-center gap-1 justify-center">
                                <input type="date" value={editData.start_date} onChange={e => setEditData({...editData, start_date: e.target.value})} className="p-1 border rounded text-[10px]" />
                                <span className="text-slate-300">~</span>
                                <input type="date" value={editData.end_date} onChange={e => setEditData({...editData, end_date: e.target.value})} className="p-1 border rounded text-[10px]" />
                              </div>
                            ) : <span className="font-bold text-slate-600">{b.start_date} ~ {b.end_date}</span>}
                          </td>
                          <td className="px-6 py-4 text-right">
                            {editingId === b.id ? (
                              <div className="flex gap-2 justify-end">
                                <button onClick={handleSaveEdit} className="bg-indigo-600 text-white px-2 py-1 rounded font-bold text-[10px]">완료</button>
                                <button onClick={cancelEditing} className="text-slate-400 font-bold text-[10px]">취소</button>
                              </div>
                            ) : (
                              <div className="flex gap-4 justify-end">
                                <button onClick={() => startEditing(b)} className="text-slate-400 hover:text-indigo-600">수정</button>
                                <button onClick={() => onDeleteBooking(b.id)} className="text-slate-400 hover:text-rose-500">삭제</button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default BookingManager;
