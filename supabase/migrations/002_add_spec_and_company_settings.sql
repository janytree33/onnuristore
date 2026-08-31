-- 002_add_spec_and_company_settings.sql
-- 1. 발주 테이블에 '규격(포장단위)' 컬럼 추가
ALTER TABLE public.onnuri_orders ADD COLUMN spec VARCHAR(100);

-- 2. 거래처(공급자/공급받는자) 정보 관리용 테이블 생성
CREATE TABLE public.company_settings (
    id VARCHAR(20) PRIMARY KEY, -- 'supplier' (공급자) 또는 'receiver' (공급받는자)
    company_name VARCHAR(100),
    business_number VARCHAR(50),
    representative VARCHAR(50),
    address VARCHAR(255),
    business_type VARCHAR(100),
    business_item VARCHAR(100)
);

-- RLS(Row Level Security) 설정
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users" 
    ON public.company_settings FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert access for authenticated users" 
    ON public.company_settings FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update access for authenticated users" 
    ON public.company_settings FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete access for authenticated users" 
    ON public.company_settings FOR DELETE USING (auth.role() = 'authenticated');

-- 초기 기본 데이터 삽입
INSERT INTO public.company_settings (id, company_name, business_number, representative, address, business_type, business_item)
VALUES 
('supplier', '(주)제니트리', '123-45-67890', '대표자명', '서울특별시 강남구', '제조/도소매', '화장품'),
('receiver', '온누리스토어 귀하', '', '', '', '', '');
