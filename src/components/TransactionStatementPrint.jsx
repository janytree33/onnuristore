import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import './TransactionStatementPrint.css';

export default function TransactionStatementPrint({ orders, onClose }) {
  
  // 명세서 상의 '납품일자' (기본값: 오늘)
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().split('T')[0]);
  const [supplier, setSupplier] = useState({});
  const [receiver, setReceiver] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompanySettings = async () => {
      const { data, error } = await supabase.from('company_settings').select('*');
      if (!error && data) {
        const sup = data.find(d => d.id === 'supplier');
        const rec = data.find(d => d.id === 'receiver');
        if (sup) setSupplier(sup);
        if (rec) setReceiver(rec);
      }
      setLoading(false);
    };
    fetchCompanySettings();
  }, []);

  // 브라우저 인쇄 창 띄우기
  const handlePrint = () => {
    window.print();
  };

  // 총 합계 계산
  let grandTotal = 0;
  let grandSupplyValue = 0;
  let grandTax = 0;

  const processedOrders = orders.map(o => {
    const total = o.total_amount;
    const supplyValue = Math.round(total / 1.1);
    const tax = total - supplyValue;
    
    grandTotal += total;
    grandSupplyValue += supplyValue;
    grandTax += tax;

    return { ...o, supplyValue, tax };
  });

  // 날짜 포맷팅
  const [yyyy, mm, dd] = deliveryDate.split('-');
  const dateString = `${yyyy}년 ${parseInt(mm, 10)}월 ${parseInt(dd, 10)}일`;

  if (loading) {
    return <div style={{ padding: '3rem', textAlign: 'center', background: 'white', minHeight: '100vh' }}>명세서 데이터를 준비 중입니다...</div>;
  }

  return (
    <div className="print-wrapper">
      {/* 인쇄 화면에서만 숨겨지는 액션 버튼 */}
      <div className="print-actions">
        <div style={{ 
          display: 'flex', alignItems: 'center', gap: '8px', background: 'white', 
          padding: '6px 12px', borderRadius: '6px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' 
        }}>
          <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#111827' }}>납품일자 지정:</label>
          <input 
            type="date" 
            value={deliveryDate} 
            onChange={(e) => setDeliveryDate(e.target.value)} 
            style={{ border: '1px solid #D1D5DB', borderRadius: '4px', padding: '4px', fontSize: '13px' }}
          />
        </div>
        <button className="close-btn" onClick={onClose}>취소(돌아가기)</button>
        <button className="print-btn" onClick={handlePrint}>인쇄하기</button>
      </div>

      {/* A4 용지 영역 */}
      <div className="a4-paper">
        
        <div className="print-header">
          <div className="print-title">거 래 명 세 서</div>
          <div style={{ width: '100%', textAlign: 'right', fontSize: '13px', marginBottom: '5px' }}>
            {dateString}
          </div>
        </div>

        {/* 공급자 / 공급받는자 정보 */}
        <div className="company-info-container">
          <div style={{ width: '48%' }}>
            <table className="info-table">
              <tbody>
                <tr>
                  <th rowSpan="4" style={{ width: '30px', writingMode: 'vertical-rl', letterSpacing: '5px' }}>공급자</th>
                  <th style={{ width: '80px' }}>등록번호</th>
                  <td colSpan="3" style={{ fontWeight: 'bold' }}>{supplier.business_number}</td>
                </tr>
                <tr>
                  <th>상 호</th>
                  <td>{supplier.company_name}</td>
                  <th style={{ width: '60px' }}>성 명</th>
                  <td>{supplier.representative}</td>
                </tr>
                <tr>
                  <th>주 소</th>
                  <td colSpan="3">{supplier.address}</td>
                </tr>
                <tr>
                  <th>업 태</th>
                  <td>{supplier.business_type}</td>
                  <th>종 목</th>
                  <td>{supplier.business_item}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style={{ width: '48%' }}>
            <table className="info-table">
              <tbody>
                <tr>
                  <th rowSpan="4" style={{ width: '30px', writingMode: 'vertical-rl', letterSpacing: '2px' }}>공급받는자</th>
                  <th style={{ width: '80px' }}>등록번호</th>
                  <td colSpan="3" style={{ fontWeight: 'bold' }}>{receiver.business_number || ''}</td>
                </tr>
                <tr>
                  <th>상 호</th>
                  <td colSpan="3" style={{ fontSize: '16px', fontWeight: 'bold' }}>{receiver.company_name || '온누리스토어 귀하'}</td>
                </tr>
                <tr>
                  <th>주 소</th>
                  <td colSpan="3">{receiver.address || ''}</td>
                </tr>
                <tr>
                  <th>업 태</th>
                  <td></td>
                  <th style={{ width: '60px' }}>성 명</th>
                  <td>{receiver.representative || ''}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 품목 리스트 */}
        <table className="item-table">
          <thead>
            <tr>
              <th style={{ width: '8%' }}>월/일</th>
              <th style={{ width: '22%' }}>품목명</th>
              <th style={{ width: '13%' }}>규격</th>
              <th style={{ width: '7%' }}>수량</th>
              <th style={{ width: '12%' }}>단가</th>
              <th style={{ width: '14%' }}>공급가액</th>
              <th style={{ width: '11%' }}>세액</th>
              <th style={{ width: '13%' }}>비고</th>
            </tr>
          </thead>
          <tbody>
            {processedOrders.map((o, idx) => (
              <tr key={idx}>
                <td className="text-center">{parseInt(mm, 10)}/{parseInt(dd, 10)}</td>
                <td>{o.product_name}</td>
                <td style={{ fontSize: '11px', textAlign: 'center', color: '#4B5563' }}>{o.spec || ''}</td>
                <td className="text-right">{o.quantity}</td>
                <td className="text-right">{o.supply_price.toLocaleString()}</td>
                <td className="text-right">{o.supplyValue.toLocaleString()}</td>
                <td className="text-right">{o.tax.toLocaleString()}</td>
                <td></td>
              </tr>
            ))}
            
            {/* 빈 칸 채우기 */}
            {Array.from({ length: Math.max(0, 15 - processedOrders.length) }).map((_, i) => (
              <tr key={`empty-${i}`}>
                <td>&nbsp;</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th colSpan="3">합 계</th>
              <th className="text-right">{processedOrders.reduce((sum, o) => sum + o.quantity, 0)}</th>
              <th></th>
              <th className="text-right">{grandSupplyValue.toLocaleString()}</th>
              <th className="text-right">{grandTax.toLocaleString()}</th>
              <th></th>
            </tr>
            <tr>
              <th colSpan="3">총 청구금액 (VAT포함)</th>
              <th colSpan="5" style={{ fontSize: '18px', textAlign: 'center', letterSpacing: '2px' }}>
                ￦ {grandTotal.toLocaleString()}
              </th>
            </tr>
          </tfoot>
        </table>

        <div style={{ marginTop: '30px', textAlign: 'center', fontSize: '12px', color: '#555' }}>
          위와 같이 계산(영수) 합니다.
        </div>

      </div>
    </div>
  );
}
