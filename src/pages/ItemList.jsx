import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { supabase } from '../supabaseClient';
import './ItemList.css'; // 새로 만든 전용 CSS 적용

export default function ItemList({ session }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]); 
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadItems = async () => {
      try {
        const response = await fetch('/물품등록서_제니트리_온누리스토어_260819.xlsx');
        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        
        const rawData = XLSX.utils.sheet_to_json(sheet, { defval: null });
        const orderGuide = [
          '딥모이스처',
          '오일컨트롤',
          '오일-컨트롤',
          '인텐시브 베리어',
          '앰플런스 하이드로', // 주의: 하이드로 크림이나 버블폼보다 먼저 매칭되도록 처리 필요
          '하이드로 버블',
          '하이드로 크림',
          '라뉴필',
          '리쥬',
          '화이트',
          '클리닉스 하이드로',
          '에이치알'
        ];

        // 앰플런스 하이드로는 이름이 겹치므로 정확한 처리를 위해 별도 함수
        const getOrderIndex = (name) => {
          // 이름 내 띄어쓰기 무시하고 비교
          const normalized = name.replace(/\s+/g, '');
          if (normalized.includes('딥모이스처')) return 1;
          if (normalized.includes('오일-컨트롤') || normalized.includes('오일컨트롤')) return 2;
          if (normalized.includes('인텐시브베리어')) return 3;
          if (normalized.includes('앰플런스하이드로') && !normalized.includes('버블') && !normalized.includes('크림')) return 4;
          if (normalized.includes('하이드로버블')) return 5;
          if (normalized.includes('하이드로크림')) return 6;
          if (normalized.includes('라뉴필')) return 7;
          if (normalized.includes('리쥬')) return 8;
          if (normalized.includes('화이트')) return 9;
          if (normalized.includes('클리닉스하이드로')) return 10;
          if (normalized.includes('에이치알')) return 11;
          return 99; // 기타
        };

        const parsedItems = rawData
          .filter(row => row['제품명'] || row['품명'] || row['상품명'])
          .map(row => {
            const name = row['제품명'] || row['품명'] || row['상품명'];
            const consumerPrice = row['소비자가'] || row['정상가'] || 0;
            const supplyPrice = consumerPrice * 0.45;
            return { name, consumerPrice, supplyPrice, sortOrder: getOrderIndex(name) };
          })
          .filter(item => item.consumerPrice > 0)
          .sort((a, b) => a.sortOrder - b.sortOrder);
          
        setItems(parsedItems);
      } catch (err) {
        console.error("물품등록서 로드 실패:", err);
      } finally {
        setLoading(false);
      }
    };
    
    loadItems();
  }, []);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(sheet, { range: 25, defval: null });
        
        const parsedOrders = data
          .filter(row => row['품목'])
          .map(row => ({
            name: row['품목'],
            qty: row['최종 발주수량'] || 0,
            date: row['입고일'] || '',
            total: row['합계'] || 0,
            shippingMethod: '택배발송',
            trackingNumber: ''
          }));
        
        setOrders(parsedOrders);
        alert(`엑셀 파싱 성공! 총 ${parsedOrders.length}건의 발주가 확인되었습니다.\n(화면 맨 아래 대시보드를 확인하세요.)`);
      } catch (err) {
        console.error(err);
        alert('엑셀 파싱 중 오류가 발생했습니다. 온누리스토어 발주서 형식이 맞는지 확인해주세요.');
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div style={{ backgroundColor: 'var(--jt-bg-layout, #F3F4F6)', minHeight: '100vh', paddingBottom: '4rem', color: 'var(--jt-color-text, #111827)' }}>
      {/* 🔹 상단 헤더 (복지몰 스타일 유사하게) */}
      <header style={{ 
        backgroundColor: 'var(--jt-bg-container, #ffffff)', 
        padding: '1.5rem 2rem', 
        borderBottom: '1px solid var(--jt-color-border, #E5E7EB)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>온누리스토어 B2B 발주관리</h1>
          <span style={{ fontSize: '0.85rem', color: 'var(--jt-color-text-secondary, #6B7280)', marginTop: '0.3rem' }}>
            담당자 전용 발주 파싱 및 상품 목록
          </span>
        </div>
        
        <div>
          {session ? (
            <button onClick={handleLogout} style={{
              padding: '0.55rem 1.1rem', borderRadius: '9999px', border: '1px solid var(--jt-color-border, #D1D5DB)',
              background: 'white', cursor: 'pointer', fontWeight: 600
            }}>
              로그아웃
            </button>
          ) : (
            <button onClick={() => navigate('/login')} style={{
              padding: '0.55rem 1.1rem', borderRadius: '9999px', border: 'none',
              background: 'var(--jt-color-primary, #1F2328)', color: 'white', cursor: 'pointer', fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: '4px'
            }}>
              <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>lock</span>
              직원 로그인
            </button>
          )}
        </div>
      </header>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1rem' }}>
        
        {/* 📥 엑셀 업로드 섹션 */}
        {session && (
          <section style={{ 
            backgroundColor: 'var(--jt-bg-container, #ffffff)', 
            borderRadius: 'var(--jt-r-lg, 12px)', 
            padding: '1.5rem', 
            marginBottom: '2rem',
            border: '1px solid var(--jt-color-border, #E5E7EB)',
            boxShadow: 'var(--jt-shadow-sm, 0 1px 2px rgba(0,0,0,0.05))'
          }}>
            <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="material-symbols-rounded" style={{ color: 'var(--jt-color-primary)' }}>upload_file</span>
              온누리스토어 발주서 자동 파싱
            </h2>
            <p style={{ color: 'var(--jt-color-text-secondary, #6B7280)', fontSize: '0.9rem', marginBottom: '1rem' }}>
              발주서 엑셀 파일을 업로드하시면 하단 대시보드에 품목과 수량이 정리됩니다.
            </p>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <input 
                type="file" 
                accept=".xlsx, .xls" 
                onChange={handleFileUpload} 
                ref={fileInputRef}
                style={{ display: 'none' }}
              />
              <button 
                onClick={() => fileInputRef.current.click()}
                style={{ 
                  background: 'var(--jt-color-primary, #1F2328)', color: 'white', padding: '0.5rem 1rem', 
                  borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 600 
                }}
              >
                엑셀 첨부하기
              </button>
              {orders.length > 0 && (
                <span style={{ display: 'flex', alignItems: 'center', fontSize: '0.9rem', color: 'var(--jt-color-accent, #305CDE)', fontWeight: 600 }}>
                  <span className="material-symbols-rounded" style={{ fontSize: '18px', marginRight: '4px' }}>check_circle</span>
                  {orders.length}개 품목 파싱 완료 (하단 표 확인)
                </span>
              )}
            </div>
          </section>
        )}

        {/* 📦 상품 목록 (staff-mall 완벽 복제) */}
        <section className="product-list-container">
          <h2 style={{ fontSize: '1.3rem', fontWeight: '800', marginBottom: '0.5rem' }}>상품 목록</h2>
          <p style={{ color: 'var(--jt-color-text-secondary, #6B7280)', marginBottom: '1.5rem', fontWeight: '600', fontSize: '0.9rem' }}>
            원하시는 상품의 구매 대상과 수량을 선택한 후 장바구니에 담아주세요.
          </p>

          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center' }}>상품 데이터를 불러오는 중입니다...</div>
          ) : (
            <div className="product-grid">
              {items.map((item, idx) => (
                <div key={idx} className="product-card">
                  
                  {/* 상단: 타이틀 & 이미지 */}
                  <div style={{
                    padding: '1.25rem 1.25rem 1rem 1.25rem',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    gap: '1rem', borderBottom: '1.5px solid var(--jt-color-border, #E5E7EB)'
                  }}>
                    {/* 타이틀 및 아이콘 */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                      <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', wordBreak: 'keep-all', lineHeight: '1.4' }}>
                        {item.name}
                      </h3>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button 
                          onClick={() => alert('전자라벨 페이지 연결')}
                          title="전자라벨 팝업 보기"
                          style={{
                            background: 'var(--jt-color-primary, #1F2328)', border: 'none', borderRadius: '50%',
                            width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', boxShadow: 'var(--jt-shadow-sm)'
                          }}
                        >
                          <span className="material-symbols-rounded" style={{ color: 'white', fontSize: '15px' }}>search</span>
                        </button>
                        <button 
                          onClick={() => alert('상세페이지 이미지 보기')}
                          title="상세페이지 보기"
                          style={{
                            background: '#9ca3af', border: 'none', borderRadius: '50%',
                            width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', boxShadow: 'var(--jt-shadow-sm)'
                          }}
                        >
                          <span className="material-symbols-rounded" style={{ color: 'white', fontSize: '15px' }}>image</span>
                        </button>
                      </div>
                    </div>
                    
                    {/* 우측 썸네일 박스 (이미지가 없으므로 box 처리) */}
                    <div style={{
                      width: '100px', height: '100px', minWidth: '100px', minHeight: '100px',
                      backgroundColor: '#f8f9fa', border: '1px solid #f1f5f9', borderRadius: '12px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                       <span className="material-symbols-rounded" style={{ fontSize: '32px', color: '#d1d5db' }}>inventory_2</span>
                    </div>
                  </div>

                  {/* 하단 폼 영역 */}
                  <div className="product-options" style={{ padding: '1rem 1.25rem 0 1.25rem' }}>
                    
                    <div className="option-group">
                      <label>구매 대상</label>
                      <select className="jt-input" style={{ height: '38px', borderRadius: '6px', border: '1px solid #D1D5DB' }}>
                        <option>본인구매 (월 1개 한정)</option>
                        <option>가족구매</option>
                        <option>지인구매</option>
                      </select>
                    </div>

                    <div className="price-display" style={{ position: 'relative' }}>
                      {!session && (
                        <div style={{
                          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: 'rgba(255, 255, 255, 0.5)', backdropFilter: 'blur(3px)',
                          zIndex: 2, borderRadius: '8px', color: 'var(--jt-color-primary, #1F2328)',
                          fontWeight: 'bold', fontSize: '13px'
                        }}>
                          <span className="material-symbols-rounded" style={{ fontSize: '18px', marginRight: '4px' }}>lock</span>
                          로그인 후 확인
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', filter: !session ? 'blur(4px)' : 'none' }}>
                        <span className="price-label">적용 단가:</span>
                        <span className="price-value">{item.supplyPrice.toLocaleString()}원</span>
                      </div>
                    </div>

                    <div className="option-group quantity-group">
                      <label>수량</label>
                      <div className="quantity-controls">
                        <button className="qty-btn">-</button>
                        <input type="text" className="qty-input" value="0" readOnly />
                        <button className="qty-btn">+</button>
                      </div>
                    </div>

                  </div>

                  {/* 장바구니 버튼 */}
                  <button 
                    className="add-to-cart-btn" 
                    disabled={!session}
                    style={{
                      background: session ? 'var(--jt-color-text-secondary, #4B5563)' : '#9ca3af', // 원본앱의 차콜/회색 느낌
                      color: 'white'
                    }}
                  >
                    {!session ? '로그인 후 이용 가능' : '장바구니 담기'}
                  </button>

                </div>
              ))}
            </div>
          )}
        </section>

        {/* 📊 발주 파싱 결과 (대시보드) */}
        {orders.length > 0 && (
          <section style={{ marginTop: '2rem' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: '800', marginBottom: '1rem', borderBottom: '2px solid var(--jt-color-text)', paddingBottom: '0.5rem' }}>
              발주서 파싱 결과표
            </h2>
            <div className="jt-table-wrap">
              <table className="jt-table" style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--jt-bg-layout)' }}>
                    <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #D1D5DB' }}>품목명</th>
                    <th className="jt-num" style={{ padding: '0.75rem', borderBottom: '1px solid #D1D5DB' }}>최종 발주수량</th>
                    <th className="jt-num" style={{ padding: '0.75rem', borderBottom: '1px solid #D1D5DB' }}>합계금액</th>
                    <th style={{ padding: '0.75rem', borderBottom: '1px solid #D1D5DB' }}>입고(납품)일자</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #E5E7EB' }}>
                      <td style={{ padding: '0.75rem' }}>{o.name}</td>
                      <td className="jt-num" style={{ padding: '0.75rem' }}>{o.qty}개</td>
                      <td className="jt-num" style={{ padding: '0.75rem' }}>{o.total.toLocaleString()}원</td>
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>{o.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

      </main>
    </div>
  );
}
