import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { supabase } from '../supabaseClient';
import AlertModal from '../components/modals/AlertModal';
import TransactionStatementPrint from '../components/TransactionStatementPrint';
import './ItemList.css';

export default function ItemList({ session }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState('master');
  const [orders, setOrders] = useState([]); 
  const [isUploading, setIsUploading] = useState(false);
  const [printOrders, setPrintOrders] = useState([]); // 명세서 출력할 주문 목록
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  // 모달 상태
  const [modalState, setModalState] = useState({ isOpen: false, title: '', message: '', type: 'info' });

  const showAlert = (title, message, type = 'info') => {
    setModalState({ isOpen: true, title, message, type });
  };

  useEffect(() => {
    const loadItems = async () => {
      try {
        const response = await fetch('/물품등록서_제니트리_온누리스토어_260819.xlsx');
        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        
        const rawData = XLSX.utils.sheet_to_json(sheet, { defval: null });
        
        const getOrderIndex = (name) => {
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
          return 99;
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

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('onnuri_orders')
        .select('*')
        .order('order_date', { ascending: false })
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error("발주 데이터 로드 실패:", err);
    }
  };

  useEffect(() => {
    if (session && activeTab === 'orders') {
      fetchOrders();
    }
  }, [session, activeTab]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) {
      setIsUploading(false);
      return;
    }

    const dateMatch = file.name.match(/(\d{6})\.xlsx$/i);
    let orderDate = new Date().toISOString().split('T')[0];
    if (dateMatch) {
      const yy = dateMatch[1].substring(0, 2);
      const mm = dateMatch[1].substring(2, 4);
      const dd = dateMatch[1].substring(4, 6);
      orderDate = `20${yy}-${mm}-${dd}`;
    }

    setIsUploading(true);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const arrayBuffer = evt.target.result;
        const workbook = XLSX.read(arrayBuffer, { type: 'array' }); // 더 안정적인 array 버퍼 사용
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        
        const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        let headerIndex = -1;
        for (let i = 0; i < rawRows.length; i++) {
          const rowArr = rawRows[i];
          if (rowArr && rowArr.some(cell => cell && typeof cell === 'string' && cell.includes('품목'))) {
            headerIndex = i;
            break;
          }
        }

        if (headerIndex === -1) {
          throw new Error("발주서 양식에서 '품목' 헤더를 찾을 수 없습니다.");
        }

        const data = XLSX.utils.sheet_to_json(sheet, { range: headerIndex, defval: null });
        
        const parsedOrders = data
          .filter(row => row['품목'])
          .map(row => ({
            order_date: orderDate,
            product_name: row['품목'],
            quantity: row['최종 발주수량'] || 0,
            supply_price: row['공급가\n(VAT 포함)'] || row['공급가'] || 0,
            total_amount: row['합계'] || 0,
            shipping_method: '택배발송',
            tracking_number: '',
            status: '발주등록'
          }))
          .filter(order => order.quantity > 0);

        if (parsedOrders.length === 0) {
          showAlert('파싱 실패', '저장할 발주 품목이 없습니다.\n(수량이 0인 항목은 제외됩니다)', 'error');
          setIsUploading(false);
          return;
        }

        const { error } = await supabase
          .from('onnuri_orders')
          .insert(parsedOrders);

        if (error) {
          console.error("DB 저장 오류:", error);
          showAlert('DB 저장 실패', '데이터베이스 저장 중 오류가 발생했습니다.\n' + error.message, 'error');
        } else {
          showAlert('저장 성공!', `엑셀 파싱 및 DB 저장 완료!\n총 ${parsedOrders.length}건의 발주가 등록되었습니다.`, 'success');
          fetchOrders();
        }
      } catch (err) {
        console.error(err);
        showAlert('오류 발생', '엑셀 파싱 중 오류가 발생했습니다.\n온누리스토어 발주서 형식이 맞는지 확인해주세요.\n' + err.message, 'error');
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    
    // 에러 핸들링 보강
    reader.onerror = () => {
      showAlert('파일 읽기 오류', '파일을 읽는 도중 오류가 발생했습니다.', 'error');
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };

    reader.readAsArrayBuffer(file);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // 인쇄 모드일 때는 인쇄 화면만 렌더링
  if (printOrders.length > 0) {
    return <TransactionStatementPrint orders={printOrders} onClose={() => setPrintOrders([])} />;
  }

  return (
    <div style={{ backgroundColor: 'var(--jt-bg-layout, #F3F4F6)', minHeight: '100vh', paddingBottom: '4rem', color: 'var(--jt-color-text, #111827)' }}>
      {/* 🔹 상단 헤더 */}
      <header style={{ 
        backgroundColor: 'var(--jt-bg-container, #ffffff)', 
        padding: '1.5rem 2rem', 
        borderBottom: '1px solid var(--jt-color-border, #E5E7EB)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>온누리스토어 B2B 발주관리</h1>
          <span style={{ fontSize: '0.85rem', color: 'var(--jt-color-text-secondary, #6B7280)', marginTop: '0.3rem' }}>
            납품 단가 확인 및 발주·출고 이력 관리
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

      {/* 🔹 탭 네비게이션 */}
      <div style={{ backgroundColor: 'white', borderBottom: '1px solid var(--jt-color-border, #E5E7EB)', marginBottom: '2rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', gap: '2rem', padding: '0 1rem' }}>
          <button 
            onClick={() => setActiveTab('master')}
            style={{
              padding: '1rem 0.5rem',
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '1.05rem', fontWeight: activeTab === 'master' ? 800 : 500,
              color: activeTab === 'master' ? 'var(--jt-color-primary, #1F2328)' : 'var(--jt-color-text-secondary, #6B7280)',
              borderBottom: activeTab === 'master' ? '3px solid var(--jt-color-primary, #1F2328)' : '3px solid transparent',
            }}
          >
            기준정보 (단가조회)
          </button>
          <button 
            onClick={() => {
              if (!session) { alert('로그인이 필요합니다.'); return; }
              setActiveTab('orders');
            }}
            style={{
              padding: '1rem 0.5rem',
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '1.05rem', fontWeight: activeTab === 'orders' ? 800 : 500,
              color: activeTab === 'orders' ? 'var(--jt-color-primary, #1F2328)' : 'var(--jt-color-text-secondary, #6B7280)',
              borderBottom: activeTab === 'orders' ? '3px solid var(--jt-color-primary, #1F2328)' : '3px solid transparent',
              display: 'flex', alignItems: 'center', gap: '4px'
            }}
          >
            발주 / 납품내역 관리
            {!session && <span className="material-symbols-rounded" style={{ fontSize: '16px' }}>lock</span>}
          </button>
        </div>
      </div>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1rem' }}>
        
        {/* ==================================================== */}
        {/* 탭 1: 기준정보 (마스터 데이터) */}
        {/* ==================================================== */}
        {activeTab === 'master' && (
          <section className="product-list-container">
            <h2 style={{ fontSize: '1.3rem', fontWeight: '800', marginBottom: '0.5rem' }}>제품 기준정보</h2>
            <p style={{ color: 'var(--jt-color-text-secondary, #6B7280)', marginBottom: '1.5rem', fontWeight: '600', fontSize: '0.9rem' }}>
              온누리스토어에 납품되는 11종 화장품의 기본 정보와 공급 단가를 확인합니다. (장바구니 기능 제거됨)
            </p>

            {loading ? (
              <div style={{ padding: '2rem', textAlign: 'center' }}>데이터를 불러오는 중입니다...</div>
            ) : (
              <div className="product-grid">
                {items.map((item, idx) => (
                  <div key={idx} className="product-card" style={{ paddingBottom: '1.5rem' }}>
                    {/* 상단: 타이틀 & 이미지 */}
                    <div style={{
                      padding: '1.25rem 1.25rem 1rem 1.25rem',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      gap: '1rem', borderBottom: '1.5px solid var(--jt-color-border, #E5E7EB)'
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', wordBreak: 'keep-all', lineHeight: '1.4' }}>
                          {item.name}
                        </h3>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button 
                            onClick={() => alert('전자라벨 페이지 연결 예정')}
                            title="전자라벨 팝업 보기"
                            style={{
                              background: 'var(--jt-color-primary, #1F2328)', border: 'none', borderRadius: '50%',
                              width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              cursor: 'pointer', boxShadow: 'var(--jt-shadow-sm)'
                            }}
                          >
                            <span className="material-symbols-rounded" style={{ color: 'white', fontSize: '15px' }}>search</span>
                          </button>
                        </div>
                      </div>
                      
                      <div style={{
                        width: '100px', height: '100px', minWidth: '100px', minHeight: '100px',
                        backgroundColor: '#f8f9fa', border: '1px solid #f1f5f9', borderRadius: '12px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                         <span className="material-symbols-rounded" style={{ fontSize: '32px', color: '#d1d5db' }}>inventory_2</span>
                      </div>
                    </div>

                    {/* 하단 단가 정보 (장바구니 폼 제거) */}
                    <div style={{ padding: '1.5rem 1.25rem 0 1.25rem' }}>
                      <div style={{ 
                        backgroundColor: 'var(--jt-bg-layout, #F3F4F6)', 
                        padding: '1rem', borderRadius: '8px',
                        display: 'flex', flexDirection: 'column', gap: '0.8rem'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
                          {!session && (
                            <div style={{
                              position: 'absolute', top: -5, left: -5, right: -5, bottom: -5,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              background: 'rgba(255, 255, 255, 0.5)', backdropFilter: 'blur(3px)',
                              zIndex: 2, borderRadius: '8px', color: 'var(--jt-color-primary, #1F2328)',
                              fontWeight: 'bold', fontSize: '13px'
                            }}>
                              <span className="material-symbols-rounded" style={{ fontSize: '18px', marginRight: '4px' }}>lock</span>
                              로그인 후 단가 확인
                            </div>
                          )}
                          <span style={{ fontSize: '0.9rem', color: 'var(--jt-color-text-secondary, #6B7280)' }}>소비자가:</span>
                          <span style={{ fontSize: '1rem', color: '#9CA3AF', textDecoration: 'line-through' }}>{item.consumerPrice.toLocaleString()}원</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
                          <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>온누리 납품가 (45%):</span>
                          <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--jt-color-accent, #305CDE)' }}>{item.supplyPrice.toLocaleString()}원</span>
                        </div>
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ==================================================== */}
        {/* 탭 2: 발주 / 납품내역 관리 (관리자 전용) */}
        {/* ==================================================== */}
        {activeTab === 'orders' && session && (
          <section>
            {/* 엑셀 업로드 구역 */}
            <div style={{ 
              backgroundColor: 'var(--jt-bg-container, #ffffff)', 
              borderRadius: 'var(--jt-r-lg, 12px)', padding: '1.5rem', marginBottom: '2rem',
              border: '1px solid var(--jt-color-border, #E5E7EB)',
              boxShadow: 'var(--jt-shadow-sm, 0 1px 2px rgba(0,0,0,0.05))'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="material-symbols-rounded" style={{ color: 'var(--jt-color-primary)' }}>publish</span>
                    새로운 발주서 등록 (엑셀 업로드)
                  </h2>
                  <p style={{ color: 'var(--jt-color-text-secondary, #6B7280)', fontSize: '0.9rem', margin: 0 }}>
                    온누리스토어 발주서 파일을 업로드하면 데이터를 추출하여 DB에 안전하게 보관합니다.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <input 
                    type="file" accept=".xlsx, .xls" 
                    onChange={handleFileUpload} 
                    onClick={(e) => { e.target.value = null; }} // 동일 파일 재업로드 버그 방지
                    ref={fileInputRef} style={{ display: 'none' }}
                  />
                  <button 
                    onClick={() => fileInputRef.current.click()}
                    disabled={isUploading}
                    style={{ 
                      background: 'var(--jt-color-primary, #1F2328)', color: 'white', padding: '0.6rem 1.2rem', 
                      borderRadius: '8px', border: 'none', cursor: isUploading ? 'not-allowed' : 'pointer', fontWeight: 600,
                      display: 'flex', alignItems: 'center', gap: '6px'
                    }}
                  >
                    <span className="material-symbols-rounded" style={{ fontSize: '20px' }}>upload_file</span>
                    {isUploading ? '저장 중...' : '엑셀 첨부하기'}
                  </button>
                </div>
              </div>
            </div>

            {/* 발주 이력 리스트 */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginBottom: '1rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.3rem', fontWeight: '800', margin: 0, marginBottom: '0.4rem' }}>발주 이력 및 출고 관리</h2>
                  <span style={{ fontSize: '0.9rem', color: 'var(--jt-color-text-secondary)' }}>총 {orders.length}건의 데이터</span>
                </div>
                <button 
                  onClick={() => {
                    // 현재는 데모로 전체 목록을 명세서로 띄웁니다.
                    // 추후 체크박스로 선택된 항목만 띄우도록 확장 가능
                    if (orders.length === 0) {
                      showAlert('알림', '출력할 발주 내역이 없습니다.', 'info');
                      return;
                    }
                    setPrintOrders(orders);
                  }}
                  style={{
                    background: 'white', color: 'var(--jt-color-primary, #1F2328)', padding: '0.6rem 1rem', 
                    borderRadius: '8px', border: '1px solid var(--jt-color-primary, #1F2328)', cursor: 'pointer', fontWeight: 600,
                    display: 'flex', alignItems: 'center', gap: '4px'
                  }}
                >
                  <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>print</span>
                  전체 거래명세서 인쇄
                </button>
              </div>
              
              <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #E5E7EB', backgroundColor: 'white' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead style={{ backgroundColor: 'var(--jt-bg-layout, #F3F4F6)' }}>
                    <tr>
                      <th style={{ padding: '1rem', borderBottom: '1px solid #E5E7EB', fontSize: '0.9rem' }}>발주일자</th>
                      <th style={{ padding: '1rem', borderBottom: '1px solid #E5E7EB', fontSize: '0.9rem' }}>품목명</th>
                      <th style={{ padding: '1rem', borderBottom: '1px solid #E5E7EB', fontSize: '0.9rem', textAlign: 'right' }}>수량</th>
                      <th style={{ padding: '1rem', borderBottom: '1px solid #E5E7EB', fontSize: '0.9rem', textAlign: 'right' }}>합계금액</th>
                      <th style={{ padding: '1rem', borderBottom: '1px solid #E5E7EB', fontSize: '0.9rem', textAlign: 'center' }}>상태</th>
                      <th style={{ padding: '1rem', borderBottom: '1px solid #E5E7EB', fontSize: '0.9rem', textAlign: 'center' }}>관리</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ padding: '3rem', textAlign: 'center', color: '#6B7280' }}>
                          등록된 발주 내역이 없습니다. 상단에서 엑셀을 업로드해주세요.
                        </td>
                      </tr>
                    ) : (
                      orders.map((o) => (
                        <tr key={o.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                          <td style={{ padding: '1rem', fontSize: '0.95rem' }}>{o.order_date}</td>
                          <td style={{ padding: '1rem', fontSize: '0.95rem', fontWeight: 600 }}>{o.product_name}</td>
                          <td style={{ padding: '1rem', fontSize: '0.95rem', textAlign: 'right' }}>{o.quantity}개</td>
                          <td style={{ padding: '1rem', fontSize: '0.95rem', textAlign: 'right' }}>{o.total_amount.toLocaleString()}원</td>
                          <td style={{ padding: '1rem', textAlign: 'center' }}>
                            <span style={{ 
                              padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 600,
                              backgroundColor: o.status === '출고완료' ? '#DEF7EC' : '#F3F4F6',
                              color: o.status === '출고완료' ? '#03543F' : '#4B5563'
                            }}>
                              {o.status}
                            </span>
                          </td>
                          <td style={{ padding: '1rem', textAlign: 'center' }}>
                             <button onClick={() => setPrintOrders([o])} style={{ background: 'none', border: '1px solid #D1D5DB', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', fontSize: '0.85rem' }}>
                               개별인쇄
                             </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

      </main>

      {/* 내부 모달 마운트 */}
      <AlertModal 
        isOpen={modalState.isOpen}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
        onClose={() => setModalState({ ...modalState, isOpen: false })}
      />
    </div>
  );
}
