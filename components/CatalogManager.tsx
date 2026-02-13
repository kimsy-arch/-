
import React, { useState } from 'react';
import { CatalogItem } from '../types';

interface Props {
  catalog: CatalogItem[];
  onUpdateCatalog: (newCatalog: CatalogItem[]) => void;
}

const CatalogManager: React.FC<Props> = ({ catalog, onUpdateCatalog }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<CatalogItem | null>(null);
  
  const [newItem, setNewItem] = useState<Partial<CatalogItem>>({
    screen: '',
    placement: '',
    size: '',
    ad_type: '',
    price_4w: 0,
    rotation: '',
    total_slots: 1,
    impressions_4w: '',
    ctr: ''
  });

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.screen || !newItem.placement || !newItem.price_4w) return;
    
    const itemToAdd: CatalogItem = {
      ...newItem as CatalogItem,
      id: `prod-${Date.now()}`
    };
    
    onUpdateCatalog([...catalog, itemToAdd]);
    setNewItem({ screen: '', placement: '', size: '', ad_type: '', price_4w: 0, rotation: '', total_slots: 1, impressions_4w: '', ctr: '' });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('정말 이 상품을 삭제하시겠습니까? 관련 부킹 데이터에 영향을 줄 수 있습니다.')) {
      onUpdateCatalog(catalog.filter(item => item.id !== id));
    }
  };

  const startEdit = (item: CatalogItem) => {
    setEditingId(item.id);
    setEditData({ ...item });
  };

  const saveEdit = () => {
    if (editingId && editData) {
      onUpdateCatalog(catalog.map(item => item.id === editingId ? editData : item));
      setEditingId(null);
      setEditData(null);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      {/* 신규 상품 등록 섹션 */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-slate-800 font-bold text-md mb-6 flex items-center gap-2">
          <span className="w-1.5 h-4 bg-indigo-600 rounded-full"></span>
          신규 광고 상품 등록
        </h3>
        <form onSubmit={handleAddItem} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">화면명 (PC/Mobile)</label>
            <input 
              type="text" placeholder="예: PC Main"
              value={newItem.screen} onChange={e => setNewItem({...newItem, screen: e.target.value})}
              className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">위치명 (Placement)</label>
            <input 
              type="text" placeholder="예: TOP Banner"
              value={newItem.placement} onChange={e => setNewItem({...newItem, placement: e.target.value})}
              className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">4주 가격 (VAT 별도)</label>
            <input 
              type="number" placeholder="0"
              value={newItem.price_4w} onChange={e => setNewItem({...newItem, price_4w: Number(e.target.value)})}
              className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">총 구좌수</label>
            <input 
              type="number" placeholder="1"
              value={newItem.total_slots} onChange={e => setNewItem({...newItem, total_slots: Number(e.target.value)})}
              className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="md:col-span-4 grid grid-cols-1 md:grid-cols-4 gap-4 mt-2">
            <input 
              type="text" placeholder="사이즈 (예: 800X80)"
              value={newItem.size} onChange={e => setNewItem({...newItem, size: e.target.value})}
              className="h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none"
            />
            <input 
              type="text" placeholder="타입 (예: JPEG, GIF)"
              value={newItem.ad_type} onChange={e => setNewItem({...newItem, ad_type: e.target.value})}
              className="h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none"
            />
            <input 
              type="text" placeholder="노출량 (예: 10만)"
              value={newItem.impressions_4w} onChange={e => setNewItem({...newItem, impressions_4w: e.target.value})}
              className="h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none"
            />
            <button type="submit" className="h-10 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
              상품 등록하기
            </button>
          </div>
        </form>
      </div>

      {/* 상품 리스트 편집 섹션 */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-slate-800 font-black text-md">📦 등록된 상품 리스트 ({catalog.length})</h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Master Product Database</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50/50 text-[10px] text-slate-400 font-bold uppercase tracking-widest border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-left">화면/위치</th>
                <th className="px-6 py-4 text-left">사이즈/타입</th>
                <th className="px-6 py-4 text-right">4주 가격</th>
                <th className="px-6 py-4 text-center">구좌수</th>
                <th className="px-6 py-4 text-left">노출/CTR</th>
                <th className="px-6 py-4 text-right">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {catalog.map(item => (
                <tr 
                  key={item.id} 
                  className={`transition-colors ${editingId === item.id ? 'bg-white ring-2 ring-indigo-500 z-10' : 'hover:bg-slate-50/50'}`}
                >
                  <td className="px-6 py-4">
                    {editingId === item.id ? (
                      <div className="space-y-1">
                        <input className="w-full p-2 border border-slate-200 rounded bg-white text-[11px] font-medium outline-none focus:border-indigo-500" value={editData?.screen} onChange={e => setEditData({...editData!, screen: e.target.value})} />
                        <input className="w-full p-2 border border-slate-200 rounded bg-white text-[11px] font-black outline-none focus:border-indigo-500" value={editData?.placement} onChange={e => setEditData({...editData!, placement: e.target.value})} />
                      </div>
                    ) : (
                      <div>
                        <p className="text-[10px] text-slate-400">{item.screen}</p>
                        <p className="font-bold text-slate-800">{item.placement}</p>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingId === item.id ? (
                      <div className="space-y-1">
                        <input className="w-full p-2 border border-slate-200 rounded bg-white text-[11px] outline-none focus:border-indigo-500" value={editData?.size} onChange={e => setEditData({...editData!, size: e.target.value})} />
                        <input className="w-full p-2 border border-slate-200 rounded bg-white text-[11px] outline-none focus:border-indigo-500" value={editData?.ad_type} onChange={e => setEditData({...editData!, ad_type: e.target.value})} />
                      </div>
                    ) : (
                      <div>
                        <p className="text-slate-600">{item.size}</p>
                        <p className="text-[10px] text-slate-400">{item.ad_type}</p>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {editingId === item.id ? (
                      <input type="number" className="w-28 p-2 border border-slate-200 rounded bg-white text-right font-black text-indigo-600 outline-none focus:border-indigo-500" value={editData?.price_4w} onChange={e => setEditData({...editData!, price_4w: Number(e.target.value)})} />
                    ) : (
                      <p className="font-black text-indigo-600">{(item.price_4w/10000).toLocaleString()}만원</p>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {editingId === item.id ? (
                      <input type="number" className="w-16 p-2 border border-slate-200 rounded bg-white text-center font-bold outline-none focus:border-indigo-500" value={editData?.total_slots} onChange={e => setEditData({...editData!, total_slots: Number(e.target.value)})} />
                    ) : (
                      <p className="font-bold text-slate-700">{item.total_slots} <span className="text-[10px] text-slate-300 font-normal">Slots</span></p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingId === item.id ? (
                      <div className="space-y-1">
                        <input className="w-full p-2 border border-slate-200 rounded bg-white text-[11px] outline-none focus:border-indigo-500" value={editData?.impressions_4w} onChange={e => setEditData({...editData!, impressions_4w: e.target.value})} />
                        <input className="w-full p-2 border border-slate-200 rounded bg-white text-[11px] outline-none focus:border-indigo-500" value={editData?.ctr} onChange={e => setEditData({...editData!, ctr: e.target.value})} />
                      </div>
                    ) : (
                      <div>
                        <p className="text-slate-600 font-medium">{item.impressions_4w}</p>
                        <p className="text-[10px] text-slate-400">{item.ctr}</p>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {editingId === item.id ? (
                      <div className="flex gap-2 justify-end">
                        <button onClick={saveEdit} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold text-[11px] hover:bg-indigo-700 shadow-md">저장</button>
                        <button onClick={() => setEditingId(null)} className="bg-slate-100 text-slate-500 px-4 py-2 rounded-lg font-bold text-[11px] hover:bg-slate-200">취소</button>
                      </div>
                    ) : (
                      <div className="flex gap-4 justify-end items-center">
                        <button onClick={() => startEdit(item)} className="text-slate-400 hover:text-indigo-600 transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                        </button>
                        <button onClick={() => handleDelete(item.id)} className="text-slate-400 hover:text-rose-500 transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CatalogManager;
