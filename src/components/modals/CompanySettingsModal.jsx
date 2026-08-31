import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

export default function CompanySettingsModal({ isOpen, onClose }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [supplier, setSupplier] = useState({
    company_name: '', business_number: '', representative: '',
    address: '', business_type: '', business_item: ''
  });
  
  const [receiver, setReceiver] = useState({
    company_name: '', business_number: '', representative: '',
    address: '', business_type: '', business_item: ''
  });

  useEffect(() => {
    if (isOpen) {
      fetchSettings();
    }
  }, [isOpen]);

  const fetchSettings = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('company_settings').select('*');
    if (!error && data) {
      const sup = data.find(d => d.id === 'supplier');
      if (sup) setSupplier(sup);
      const rec = data.find(d => d.id === 'receiver');
      if (rec) setReceiver(rec);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const updates = [
      { id: 'supplier', ...supplier },
      { id: 'receiver', ...receiver }
    ];
    
    const { error } = await supabase.from('company_settings').upsert(updates);
    setSaving(false);
    
    if (error) {
      alert('저장 실패: ' + error.message);
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      zIndex: 9999
    }}>
      <div style={{
        backgroundColor: 'var(--jt-bg-container, #ffffff)',
        padding: '2rem', borderRadius: 'var(--jt-r-xl, 16px)',
        boxShadow: 'var(--jt-shadow-2xl)',
        width: '90%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #E5E7EB', paddingBottom: '1rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>명세서 거래처 정보 설정</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <span className="material-symbols-rounded">close</span>
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>데이터를 불러오는 중입니다...</div>
        ) : (
          <div style={{ display: 'flex', gap: '2rem' }}>
            {/* 공급자 정보 */}
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: '1.1rem', color: 'var(--jt-color-primary)', borderBottom: '2px solid var(--jt-color-primary)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>공급자 (우리 회사)</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>상호명</label>
                  <input type="text" value={supplier.company_name || ''} onChange={e => setSupplier({...supplier, company_name: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid #D1D5DB', borderRadius: '6px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>사업자등록번호</label>
                  <input type="text" value={supplier.business_number || ''} onChange={e => setSupplier({...supplier, business_number: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid #D1D5DB', borderRadius: '6px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>대표자 성명</label>
                  <input type="text" value={supplier.representative || ''} onChange={e => setSupplier({...supplier, representative: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid #D1D5DB', borderRadius: '6px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>사업장 주소</label>
                  <input type="text" value={supplier.address || ''} onChange={e => setSupplier({...supplier, address: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid #D1D5DB', borderRadius: '6px' }} />
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>업태</label>
                    <input type="text" value={supplier.business_type || ''} onChange={e => setSupplier({...supplier, business_type: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid #D1D5DB', borderRadius: '6px' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>종목</label>
                    <input type="text" value={supplier.business_item || ''} onChange={e => setSupplier({...supplier, business_item: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid #D1D5DB', borderRadius: '6px' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* 공급받는자 정보 */}
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: '1.1rem', color: '#4B5563', borderBottom: '2px solid #4B5563', paddingBottom: '0.5rem', marginBottom: '1rem' }}>공급받는자 (고객사)</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>상호명 (예: 온누리스토어 귀하)</label>
                  <input type="text" value={receiver.company_name || ''} onChange={e => setReceiver({...receiver, company_name: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid #D1D5DB', borderRadius: '6px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>사업자등록번호 (선택)</label>
                  <input type="text" value={receiver.business_number || ''} onChange={e => setReceiver({...receiver, business_number: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid #D1D5DB', borderRadius: '6px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>대표자 성명 (선택)</label>
                  <input type="text" value={receiver.representative || ''} onChange={e => setReceiver({...receiver, representative: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid #D1D5DB', borderRadius: '6px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>사업장 주소 (선택)</label>
                  <input type="text" value={receiver.address || ''} onChange={e => setReceiver({...receiver, address: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid #D1D5DB', borderRadius: '6px' }} />
                </div>
              </div>
            </div>
          </div>
        )}

        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button onClick={onClose} style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', border: '1px solid #D1D5DB', background: 'white', fontWeight: 600, cursor: 'pointer' }}>취소</button>
          <button onClick={handleSave} disabled={saving || loading} style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', border: 'none', background: 'var(--jt-color-primary, #1F2328)', color: 'white', fontWeight: 600, cursor: 'pointer' }}>
            {saving ? '저장 중...' : '저장하기'}
          </button>
        </div>
      </div>
    </div>
  );
}
