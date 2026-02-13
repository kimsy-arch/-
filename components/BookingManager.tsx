
import React, { useState } from 'react';
import { CatalogItem, Booking } from '../types';

interface Props {
  catalog: CatalogItem[];
  bookings: Booking[];
  onAddBooking: (booking: Booking) => void;
  onUpdateBooking: (booking: Booking) => void;
  onDeleteBooking: (id: string) => void;
}

const BookingManager: React.FC<Props> = ({ catalog, bookings, onAddBooking, onUpdateBooking, onDeleteBooking }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Booking>>({});
  
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
      onUpdateBooking(editData as Booking);
      setEditingId(null);
    }
  };

  // 광고주별로 부킹 내역 그룹화
  const groupedBookings = bookings.reduce((acc, booking) => {
    if (!acc[booking.clientName]) {
      acc[booking.clientName] = [];
    }
    acc[booking.clientName].push(booking);
    return acc;
  }, {} as Record<string, Booking[]>);

  const advertisers = Object.keys(groupedBookings).sort();

  return (
    <div className="space-y-8">
      {/* 신규 등록 폼 */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-slate-800 font-bold text-md mb-4 flex items-center gap-2">
          <span className="w-1.5 h-4 bg-indigo-600 rounded-full"></span>
          신규 부킹 등록
        </h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">상품 선택</label>
            <select 
              value={formData.productId} 
              onChange={e => setFormData({...formData, productId: e.target.value})}
              className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none appearance-none cursor-pointer"
            >
              {catalog.map(item => <option key={item.id} value={item.id}>{item.placement} ({item.screen})</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">광고주명 (업체)</label>
            <input 
              type="text" value={formData.clientName} placeholder="예: A제약"
              onChange={e => setFormData({...formData, clientName: e.target.value})}
              className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div className="space-y-1 md:col-span-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">집행 기간 (박스 클릭)</label>
            <div className="flex gap-1 h-10">
              <input 
                type="date" 
                value={formData.start_date} 
                onChange={e => setFormData({...formData, start_date: e.target.value})} 
                className="flex-1 px-2 bg-slate-50 border border-slate-200 rounded-lg text-[10px] cursor-pointer hover:border-indigo-400 transition-colors focus:ring-2 focus:ring-indigo-500 outline-none block w-full" 
              />
              <input 
                type="date" 
                value={formData.end_date} 
                onChange={e => setFormData({...formData, end_date: e.target.value})} 
                className="flex-1 px-2 bg-slate-50 border border-slate-200 rounded-lg text-[10px] cursor-pointer hover:border-indigo-400 transition-colors focus:ring-2 focus:ring-indigo-500 outline-none block w-full" 
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">구좌수</label>
            <input 
              type="number" min="1" max="10" value={formData.slots_used}
              onChange={e => setFormData({...formData, slots_used: Number(e.target.value)})}
              className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div className="flex items-end">
            <button type="submit" className="w-full h-10 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-lg text-xs transition-colors shadow-lg shadow-indigo-100">부킹 추가</button>
          </div>
        </form>
      </div>

      {/* 업체별 그룹화 리스트 */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-slate-800 font-black text-lg flex items-center gap-2">
            📋 업체별 부킹 관리
            <span className="text-xs font-bold bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">{advertisers.length}개 업체</span>
          </h3>
        </div>

        {advertisers.length === 0 ? (
          <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-20 text-center text-slate-400">
            <p className="font-bold">등록된 부킹 내역이 없습니다.</p>
            <p className="text-[10px] mt-1 uppercase tracking-widest font-medium">Please add a new booking above</p>
          </div>
        ) : (
          advertisers.map(advertiser => {
            const items = groupedBookings[advertiser];
            const totalSlots = items.reduce((sum, i) => sum + i.slots_used, 0);
            
            return (
              <div key={advertiser} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                {/* 업체 헤더 */}
                <div className="bg-slate-50 px-6 py-3 border-b border-slate-100 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center shadow-sm">
                      <span className="text-indigo-600 font-black text-sm">{advertiser.charAt(0)}</span>
                    </div>
                    <h4 className="text-slate-900 font-black text-sm">{advertiser}</h4>
                  </div>
                  <div className="flex gap-4">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">
                      배너 수: <span className="text-indigo-600">{items.length}개</span>
                    </div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">
                      총 점유구좌: <span className="text-indigo-600">{totalSlots} Slots</span>
                    </div>
                  </div>
                </div>

                {/* 업체별 부킹 내역 테이블 */}
                <table className="w-full text-xs">
                  <thead className="bg-slate-50/50 text-[10px] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-50">
                    <tr>
                      <th className="px-6 py-2 text-left w-1/4">상품명 / 위치</th>
                      <th className="px-6 py-2 text-center w-1/3">집행 기간</th>
                      <th className="px-6 py-2 text-center">구좌</th>
                      <th className="px-6 py-2 text-right">관리</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {items.map(b => {
                      const product = catalog.find(c => c.id === b.productId);
                      return (
                        <tr key={b.id} className="hover:bg-indigo-50/30 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-800">{product?.placement}</span>
                              <span className="text-[10px] text-slate-400 font-medium">{product?.screen}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            {editingId === b.id ? (
                              <div className="flex items-center gap-1 justify-center">
                                <input 
                                  type="date" 
                                  value={editData.start_date} 
                                  onChange={e => setEditData({...editData, start_date: e.target.value})}
                                  className="p-1.5 border border-indigo-200 rounded text-[10px] cursor-pointer outline-none focus:ring-2 focus:ring-indigo-500 w-28"
                                />
                                <span className="text-slate-300">~</span>
                                <input 
                                  type="date" 
                                  value={editData.end_date} 
                                  onChange={e => setEditData({...editData, end_date: e.target.value})}
                                  className="p-1.5 border border-indigo-200 rounded text-[10px] cursor-pointer outline-none focus:ring-2 focus:ring-indigo-500 w-28"
                                />
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-2 bg-slate-100/50 px-3 py-1 rounded-full text-slate-600 font-bold tracking-tighter">
                                {b.start_date} <span className="text-slate-300">→</span> {b.end_date}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="font-black text-indigo-600 text-sm">{b.slots_used}</span>
                            <span className="text-[9px] text-slate-400 ml-0.5">Slots</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {editingId === b.id ? (
                              <div className="flex gap-2 justify-end">
                                <button onClick={handleSaveEdit} className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg font-bold text-[10px] hover:bg-indigo-700 shadow-sm transition-all">완료</button>
                                <button onClick={cancelEditing} className="bg-slate-100 text-slate-500 px-3 py-1.5 rounded-lg font-bold text-[10px] hover:bg-slate-200 transition-all">취소</button>
                              </div>
                            ) : (
                              <div className="flex gap-3 justify-end items-center">
                                <button onClick={() => startEditing(b)} className="text-slate-400 hover:text-indigo-600 font-bold transition-colors">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                                </button>
                                <button onClick={() => onDeleteBooking(b.id)} className="text-slate-400 hover:text-rose-500 font-bold transition-colors">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default BookingManager;
