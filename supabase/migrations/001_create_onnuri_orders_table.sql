-- 001_create_onnuri_orders_table.sql
-- 온누리스토어 발주 및 납품(출고) 이력 관리를 위한 테이블 생성

CREATE TABLE public.onnuri_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_date DATE NOT NULL, -- 파일명(YYMMDD)에서 추출한 발주일자
    product_name VARCHAR(255) NOT NULL, -- 품목명
    quantity INTEGER NOT NULL DEFAULT 0, -- 발주수량
    supply_price INTEGER NOT NULL DEFAULT 0, -- 공급단가 (할인 적용 등)
    total_amount INTEGER NOT NULL DEFAULT 0, -- 합계금액
    shipping_method VARCHAR(50) DEFAULT '택배발송', -- 발송방법
    tracking_number VARCHAR(100), -- 송장번호
    status VARCHAR(50) DEFAULT '발주등록', -- 상태 (발주등록, 출고완료 등)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS(Row Level Security) 설정
ALTER TABLE public.onnuri_orders ENABLE ROW LEVEL SECURITY;

-- 관리자(인증된 사용자)만 데이터에 접근 가능하도록 정책 추가
CREATE POLICY "Enable read access for authenticated users" 
    ON public.onnuri_orders FOR SELECT 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert access for authenticated users" 
    ON public.onnuri_orders FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update access for authenticated users" 
    ON public.onnuri_orders FOR UPDATE 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete access for authenticated users" 
    ON public.onnuri_orders FOR DELETE 
    USING (auth.role() = 'authenticated');
