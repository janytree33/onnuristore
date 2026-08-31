import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { supabase } from '../supabaseClient';

export default function ItemList({ session }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadItems = async () => {
      try {
        const response = await fetch('/물품등록서_제니트리_온누리스토어_260819.xlsx');
        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        
        // 데이터는 2행부터 시작될 확률이 높음 (파이썬 확인시 'Unnamed: 0' 등 나옴)
        // json 파싱 후 필요한 필드(제품명, 소비자가) 추출
        const rawData = XLSX.utils.sheet_to_json(sheet, { defval: null });
        
        // 대략적인 제품명, 소비자가 추출 (파싱 로직은 실제 컬럼명에 맞게 유연하게 구성)
        const parsedItems = rawData
          .filter(row => row['제품명'] || row['품명'] || row['상품명'])
          .map(row => {
            const name = row['제품명'] || row['품명'] || row['상품명'];
            const consumerPrice = row['소비자가'] || row['정상가'] || 0;
            // 공급가는 소비자가의 45%
            const supplyPrice = consumerPrice * 0.45;
            
            return {
              name,
              consumerPrice,
              supplyPrice
            };
          })
          .filter(item => item.consumerPrice > 0);
          
        setItems(parsedItems);
      } catch (err) {
        console.error("엑셀 파일 로드 실패:", err);
      } finally {
        setLoading(false);
      }
    };
    
    loadItems();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div style={{ padding: 'var(--jt-space-6)', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--jt-space-6)' }}>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: 'var(--jt-color-text)' }}>
          온누리스토어 발주 품목
        </h1>
        <div>
          {session ? (
            <button className="jt-btn" onClick={handleLogout}>로그아웃</button>
          ) : (
            <button className="jt-btn" onClick={() => navigate('/login')} style={{ backgroundColor: 'var(--jt-color-primary)', color: 'white' }}>
              <span className="material-symbols-rounded" style={{ fontSize: '18px', marginRight: '4px' }}>lock</span>
              직원 로그인
            </button>
          )}
        </div>
      </header>

      {loading ? (
        <div>데이터를 불러오는 중입니다...</div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
          gap: 'var(--jt-space-5)' 
        }}>
          {items.map((item, idx) => (
            <div key={idx} style={{
              backgroundColor: 'var(--jt-bg-surface)',
              borderRadius: 'var(--jt-r-md)',
              padding: 'var(--jt-space-5)',
              boxShadow: 'var(--jt-shadow-sm)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--jt-space-4)'
            }}>
              
              <div>
                <h3 style={{ margin: '0 0 var(--jt-space-2) 0', fontSize: '16px', color: 'var(--jt-color-text)' }}>
                  {item.name}
                </h3>
                
                {/* 돋보기, 사진 아이콘 연동 */}
                <div style={{ display: 'flex', gap: 'var(--jt-space-2)' }}>
                  <button 
                    onClick={() => alert('전자라벨 페이지로 이동합니다.')}
                    title="전자라벨"
                    style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: '32px', height: '32px', borderRadius: '50%',
                      backgroundColor: 'var(--jt-bg-layout)', border: 'none', cursor: 'pointer',
                      color: 'var(--jt-color-text)'
                    }}
                  >
                    <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>search</span>
                  </button>
                  <button 
                    onClick={() => alert('상세페이지로 이동합니다.')}
                    title="상세페이지"
                    style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: '32px', height: '32px', borderRadius: '50%',
                      backgroundColor: 'var(--jt-bg-layout)', border: 'none', cursor: 'pointer',
                      color: 'var(--jt-color-text)'
                    }}
                  >
                    <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>image</span>
                  </button>
                </div>
              </div>

              <div style={{
                backgroundColor: 'var(--jt-bg-layout)',
                padding: 'var(--jt-space-4)',
                borderRadius: 'var(--jt-r-sm)',
                textAlign: 'center',
                minHeight: '60px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {session ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <div style={{ fontSize: '13px', color: 'var(--jt-color-text-secondary)' }}>공급가 (VAT 포함)</div>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--jt-color-accent)' }}>
                      {item.supplyPrice.toLocaleString()}원
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--jt-color-text)', filter: 'blur(0)' }}>
                    <span className="material-symbols-rounded" style={{ fontSize: '16px' }}>lock</span>
                    <span style={{ fontSize: '14px', fontWeight: 600 }}>로그인 후 확인</span>
                  </div>
                )}
              </div>

              <button 
                className="jt-btn" 
                disabled={!session}
                style={{
                  width: '100%', 
                  backgroundColor: session ? 'var(--jt-color-primary)' : 'var(--jt-color-text-secondary)',
                  color: 'white',
                  cursor: session ? 'pointer' : 'not-allowed'
                }}
              >
                {session ? '발주 수량 입력' : '로그인 후 이용 가능'}
              </button>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}
