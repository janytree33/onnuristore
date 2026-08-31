import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { supabase } from '../supabaseClient';

export default function ItemList({ session }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]); // 업로드된 발주 데이터
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  // 기존 물품등록서 로드 (UI용)
  useEffect(() => {
    const loadItems = async () => {
      try {
        const response = await fetch('/물품등록서_제니트리_온누리스토어_260819.xlsx');
        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        
        const rawData = XLSX.utils.sheet_to_json(sheet, { defval: null });
        const parsedItems = rawData
          .filter(row => row['제품명'] || row['품명'] || row['상품명'])
          .map(row => {
            const name = row['제품명'] || row['품명'] || row['상품명'];
            const consumerPrice = row['소비자가'] || row['정상가'] || 0;
            const supplyPrice = consumerPrice * 0.45;
            return { name, consumerPrice, supplyPrice };
          })
          .filter(item => item.consumerPrice > 0);
          
        setItems(parsedItems);
      } catch (err) {
        console.error("물품등록서 로드 실패:", err);
      } finally {
        setLoading(false);
      }
    };
    
    loadItems();
  }, []);

  // 엑셀 업로드 핸들러
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        // 발주서는 26행(인덱스 25)부터 데이터가 시작됨을 이전 파싱으로 확인
        const data = XLSX.utils.sheet_to_json(sheet, { range: 25, defval: null });
        
        const parsedOrders = data
          .filter(row => row['품목'])
          .map(row => ({
            name: row['품목'],
            qty: row['최종 발주수량'] || 0,
            date: row['입고일'] || '',
            total: row['합계'] || 0,
            shippingMethod: '택배발송', // 기본값
            trackingNumber: ''
          }));
        
        setOrders(parsedOrders);
        alert(`엑셀 파싱 성공! 총 ${parsedOrders.length}건의 발주가 확인되었습니다.\n(대시보드 하단에 목록이 표시됩니다.)`);
      } catch (err) {
        console.error(err);
        alert('엑셀 파싱 중 오류가 발생했습니다. 파일 형식을 확인해주세요.');
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div style={{ backgroundColor: 'var(--jt-bg-layout)', minHeight: '100vh', paddingBottom: 'var(--jt-space-10)' }}>
      {/* 헤더 */}
      <header style={{ 
        backgroundColor: 'white', 
        padding: 'var(--jt-space-4) var(--jt-space-6)', 
        borderBottom: '1px solid var(--jt-color-border)' 
      }}>
        <div style={{ 
          maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' 
        }}>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: 'var(--jt-color-text)' }}>
            온누리스토어 발주관리
          </h1>
          <div>
            {session ? (
              <button className="jt-btn" onClick={handleLogout} style={{ backgroundColor: 'white', border: '1px solid var(--jt-color-border)', color: 'var(--jt-color-text)' }}>
                로그아웃
              </button>
            ) : (
              <button className="jt-btn" onClick={() => navigate('/login')} style={{ backgroundColor: 'var(--jt-color-primary)', color: 'white' }}>
                <span className="material-symbols-rounded" style={{ fontSize: '18px', marginRight: '4px' }}>lock</span>
                직원 로그인
              </button>
            )}
          </div>
        </div>
      </header>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: 'var(--jt-space-6)' }}>
        
        {/* 발주서 업로드 섹션 */}
        {session && (
          <section style={{ 
            backgroundColor: 'white', 
            borderRadius: 'var(--jt-r-lg)', 
            padding: 'var(--jt-space-6)', 
            marginBottom: 'var(--jt-space-8)',
            border: '1px solid var(--jt-color-border)',
            boxShadow: 'var(--jt-shadow-sm, 0 1px 3px rgba(0,0,0,0.05))'
          }}>
            <h2 style={{ margin: '0 0 var(--jt-space-4) 0', fontSize: '18px', color: 'var(--jt-color-text)' }}>
              📥 온누리스토어 발주서 업로드
            </h2>
            <p style={{ color: 'var(--jt-color-text-secondary)', fontSize: '14px', marginBottom: 'var(--jt-space-4)' }}>
              엑셀(.xlsx) 발주서를 업로드하면 품목과 수량을 자동으로 인식하여 대시보드에 연동합니다.
            </p>
            <div style={{ display: 'flex', gap: 'var(--jt-space-3)' }}>
              <input 
                type="file" 
                accept=".xlsx, .xls" 
                onChange={handleFileUpload} 
                ref={fileInputRef}
                style={{ display: 'none' }}
              />
              <button 
                className="jt-btn" 
                onClick={() => fileInputRef.current.click()}
                style={{ backgroundColor: 'var(--jt-color-primary)', color: 'white' }}
              >
                엑셀 파일 선택
              </button>
              {orders.length > 0 && (
                <span style={{ display: 'flex', alignItems: 'center', fontSize: '14px', color: 'var(--jt-color-accent)', fontWeight: 600 }}>
                  <span className="material-symbols-rounded" style={{ fontSize: '18px', marginRight: '4px' }}>check_circle</span>
                  {orders.length}개 품목 파싱 완료
                </span>
              )}
            </div>
          </section>
        )}

        {/* 상품 목록 (참고용 쇼핑몰 스타일 뷰) */}
        <section>
          <h2 style={{ margin: '0 0 var(--jt-space-4) 0', fontSize: '18px', color: 'var(--jt-color-text)' }}>
            상품 목록
          </h2>
          <p style={{ color: 'var(--jt-color-text-secondary)', fontSize: '14px', marginBottom: 'var(--jt-space-5)' }}>
            원하시는 상품의 구매 대상과 수량을 선택한 후 장바구니에 담아주세요.
          </p>

          {loading ? (
            <div>데이터를 불러오는 중입니다...</div>
          ) : (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
              gap: 'var(--jt-space-5)' 
            }}>
              {items.map((item, idx) => (
                <div key={idx} style={{
                  backgroundColor: 'white',
                  borderRadius: 'var(--jt-r-md, 8px)',
                  padding: 'var(--jt-space-5)',
                  border: '1px solid var(--jt-color-border, #E5E7EB)',
                  boxShadow: 'var(--jt-shadow-sm, 0 1px 2px rgba(0,0,0,0.05))',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--jt-space-4)'
                }}>
                  
                  {/* 상단: 텍스트 및 이미지 레이아웃 */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, paddingRight: 'var(--jt-space-3)' }}>
                      <h3 style={{ margin: '0 0 var(--jt-space-3) 0', fontSize: '16px', fontWeight: 700, color: 'var(--jt-color-text)', wordBreak: 'keep-all' }}>
                        {item.name}
                      </h3>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          onClick={() => alert('전자라벨 페이지 연동')}
                          title="전자라벨"
                          style={{
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            width: '28px', height: '28px', borderRadius: '50%',
                            backgroundColor: 'var(--jt-color-text)', border: 'none', cursor: 'pointer',
                            color: 'white'
                          }}
                        >
                          <span className="material-symbols-rounded" style={{ fontSize: '16px' }}>search</span>
                        </button>
                        <button 
                          onClick={() => alert('상세페이지 연동')}
                          title="상세페이지"
                          style={{
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            width: '28px', height: '28px', borderRadius: '50%',
                            backgroundColor: '#9CA3AF', border: 'none', cursor: 'pointer',
                            color: 'white'
                          }}
                        >
                          <span className="material-symbols-rounded" style={{ fontSize: '16px' }}>image</span>
                        </button>
                      </div>
                    </div>
                    {/* 이미지 영역 (가상) */}
                    <div style={{ 
                      width: '80px', height: '80px', 
                      backgroundColor: 'var(--jt-bg-layout)', 
                      borderRadius: 'var(--jt-r-sm)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--jt-color-text-tertiary)'
                    }}>
                      <span className="material-symbols-rounded" style={{ fontSize: '32px' }}>inventory_2</span>
                    </div>
                  </div>

                  {/* 구매 대상 선택 */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '12px', color: 'var(--jt-color-text-secondary)' }}>구매 대상</label>
                    <select className="jt-input" style={{ width: '100%', fontSize: '14px', height: '36px' }}>
                      <option>본인구매 (월 1개 한정)</option>
                      <option>가족구매</option>
                      <option>지인구매</option>
                    </select>
                  </div>

                  {/* 가격 표시 블록 */}
                  <div style={{
                    backgroundColor: 'var(--jt-bg-layout)',
                    padding: 'var(--jt-space-4)',
                    borderRadius: 'var(--jt-r-sm)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: session ? 'space-between' : 'center',
                    minHeight: '44px'
                  }}>
                    {session ? (
                      <>
                        <span style={{ fontSize: '13px', color: 'var(--jt-color-text-secondary)' }}>적용 단가:</span>
                        <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--jt-color-accent)' }}>
                          {item.supplyPrice.toLocaleString()}원
                        </span>
                      </>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--jt-color-text)', filter: 'blur(0)' }}>
                        <span className="material-symbols-rounded" style={{ fontSize: '16px' }}>lock</span>
                        <span style={{ fontSize: '14px', fontWeight: 600 }}>로그인 후 확인</span>
                        {/* 흐린 텍스트 페이크 */}
                        <span style={{ color: 'transparent', textShadow: '0 0 8px rgba(0,0,0,0.2)', marginLeft: '8px' }}>5,000원</span>
                      </div>
                    )}
                  </div>

                  {/* 수량 선택 */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '12px', color: 'var(--jt-color-text-secondary)' }}>수량</label>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <button style={{ width: '32px', height: '32px', border: '1px solid var(--jt-color-border)', backgroundColor: 'white', cursor: 'pointer' }}>-</button>
                      <input type="text" value="0" readOnly style={{ width: '50px', height: '32px', borderTop: '1px solid var(--jt-color-border)', borderBottom: '1px solid var(--jt-color-border)', borderLeft: 'none', borderRight: 'none', textAlign: 'center' }} />
                      <button style={{ width: '32px', height: '32px', border: '1px solid var(--jt-color-border)', backgroundColor: 'white', cursor: 'pointer' }}>+</button>
                    </div>
                  </div>

                  {/* 하단 장바구니 버튼 */}
                  <button 
                    className="jt-btn" 
                    disabled={!session}
                    style={{
                      width: '100%', 
                      backgroundColor: session ? '#4B5563' : '#9CA3AF', /* Charcoal 톤 */
                      color: 'white',
                      border: 'none',
                      marginTop: 'var(--jt-space-2)',
                      cursor: session ? 'pointer' : 'not-allowed'
                    }}
                  >
                    {session ? '장바구니 담기' : '로그인 후 이용 가능'}
                  </button>

                </div>
              ))}
            </div>
          )}
        </section>

        {/* 발주 결과 테이블 (임시 대시보드 역할) */}
        {orders.length > 0 && (
          <section style={{ marginTop: 'var(--jt-space-8)' }}>
            <h2 style={{ margin: '0 0 var(--jt-space-4) 0', fontSize: '18px', color: 'var(--jt-color-text)' }}>
              발주서 파싱 결과 (대시보드)
            </h2>
            <div className="jt-table-wrap">
              <table className="jt-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>품목명</th>
                    <th className="jt-num">수량</th>
                    <th className="jt-num">합계금액</th>
                    <th>납품일자</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o, i) => (
                    <tr key={i}>
                      <td>{o.name}</td>
                      <td className="jt-num">{o.qty}</td>
                      <td className="jt-num">{o.total.toLocaleString()}원</td>
                      <td>{o.date}</td>
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
