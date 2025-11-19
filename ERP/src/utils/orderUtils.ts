// src/utils/orderUtils.ts
import XlsxPopulate from 'xlsx-populate/browser/xlsx-populate';
import { saveAs } from 'file-saver';

/**
 * 부가세 계산 유틸리티
 * @param price 원가
 * @param includesTax 부가세 포함 여부
 * @returns 최종 가격
 */
export const calculateVATPrice = (price: number, includesTax: boolean): number => {
  if (includesTax) {
    return price;
  }
  return Math.round(price * 1.1);
};

/**
 * 총액 계산 유틸리티
 * @param items 발주 아이템 배열
 * @param includesTax 부가세 포함 여부
 * @returns 총액
 */
export const calculateTotalAmount = (
  items: Array<{ quantity: number; cost_price: number }>,
  includesTax: boolean
): number => {
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.cost_price, 0);
  return calculateVATPrice(subtotal, includesTax);
};

/**
 * variant_code 추출 유틸리티
 * @param item 발주 아이템
 * @param variantsByProduct 상품별 variants 맵
 * @returns variant_code 또는 빈 문자열
 */
export const extractVariantCode = (
  item: {
    product_id: string | null;
    variant: string | null;
    variant_code: string;
  },
  variantsByProduct: Record<string, Array<{ option: string; variant_code: string }>>
): string => {
  // 이미 variant_code가 있으면 그대로 반환
  if (item.variant_code) {
    return item.variant_code;
  }

  // product_id와 variant가 없으면 빈 문자열
  if (!item.product_id || !item.variant) {
    return '';
  }

  // variants에서 찾기
  const variants = variantsByProduct[item.product_id] || [];
  const variantObj = variants.find((v) => v.option === item.variant);

  return variantObj?.variant_code || '';
};

/**
 * 발주 아이템 유효성 검증
 * @param item 발주 아이템
 * @param index 아이템 인덱스 (에러 메시지용)
 * @returns 에러 메시지 배열
 */
export const validateOrderItem = (
  item: {
    product_id: string | null;
    variant: string | null;
    variant_code: string;
    quantity: number;
    unit_price: number;
    spec: string;
  },
  index: number
): string[] => {
  const errors: string[] = [];
  const itemNum = index + 1;

  if (!item.product_id) {
    errors.push(`${itemNum}번 항목의 상품을 선택해주세요.`);
  }

  if (!item.variant) {
    errors.push(`${itemNum}번 항목의 품목을 선택해주세요.`);
  }

  if (!item.variant_code) {
    errors.push(`${itemNum}번 항목의 품목 코드가 누락되었습니다.`);
  }

  if (item.quantity <= 0) {
    errors.push(`${itemNum}번 항목의 수량은 0보다 커야 합니다.`);
  }

  if (item.unit_price <= 0) {
    errors.push(`${itemNum}번 항목의 단가는 0보다 커야 합니다.`);
  }

  return errors;
};

/**
 * 발주 폼 전체 유효성 검증
 * @param formData 발주 폼 데이터
 * @returns 에러 메시지 배열
 */
export const validateOrderForm = (formData: {
  supplier: number;
  orderDate: Date | null;
  items: Array<{
    product_id: string | null;
    variant: string | null;
    variant_code: string;
    quantity: number;
    unit_price: number;
    spec: string;
  }>;
  workInstructions: string;
}): string[] => {
  const errors: string[] = [];

  // 기본 필드 검증
  if (!formData.supplier) {
    errors.push('공급업체를 선택해주세요.');
  }

  if (!formData.orderDate) {
    errors.push('발주일자를 선택해주세요.');
  }

  if (!formData.workInstructions.trim()) {
    errors.push('작업지시사항을 입력해주세요.');
  }

  // 아이템 검증
  if (!formData.items || formData.items.length === 0) {
    errors.push('최소 하나의 발주 항목이 필요합니다.');
  } else {
    formData.items.forEach((item, index) => {
      const itemErrors = validateOrderItem(item, index);
      errors.push(...itemErrors);
    });
  }

  return errors;
};

/**
 * 상태 표시명 변환 유틸리티
 * @param status API 상태값
 * @returns 한글 표시명
 */
export const getStatusDisplayName = (status: string): string => {
  const statusMap: Record<string, string> = {
    PENDING: '승인 대기',
    APPROVED: '승인됨',
    COMPLETED: '완료',
    CANCELLED: '취소됨',
  };

  return statusMap[status] || status;
};

/**
 * 표시명을 API 상태값으로 변환
 * @param displayName 한글 표시명
 * @returns API 상태값
 */
export const getStatusFromDisplayName = (displayName: string): string => {
  const reverseMap: Record<string, string> = {
    '승인 대기': 'PENDING',
    승인됨: 'APPROVED',
    완료: 'COMPLETED',
    취소됨: 'CANCELLED',
  };

  return reverseMap[displayName] || displayName;
};

// 타입 정의
export interface OrderDetailItem {
  id: number;
  variant_code: string;
  item_name: string;
  spec?: string;
  unit?: string;
  unit_price: number;
  quantity: number;
  remark?: string;
}

export interface OrderDetail {
  id: number;
  supplier: string;
  manager: string;
  order_date: string;
  expected_delivery_date?: string;
  status: string;
  note?: string;
  instruction_note?: string;
  created_at: string;
  vat_included?: boolean;
  packaging_included?: boolean;
  items: OrderDetailItem[];
}

export interface SupplierDetail {
  id?: number;
  name: string;
  contact: string;
  manager: string;
  email: string;
  address?: string;
}

/**
 * 숫자 → 한글 금액 변환 함수
 * @param num 변환할 숫자
 * @returns 한글 금액 문자열
 */
export const numberToKorean = (num: number): string => {
  if (num === 0) return '영';
  const hanA = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'];
  const danA = ['', '십', '백', '천'];
  const unitA = ['', '만', '억', '조', '경'];
  let result = '';
  let unit = 0;
  while (num > 0) {
    let str = '';
    let part = num % 10000;
    num = Math.floor(num / 10000);
    if (part > 0) {
      let digit = 0;
      while (part > 0) {
        const n = part % 10;
        if (n > 0) str = hanA[n] + danA[digit] + str;
        part = Math.floor(part / 10);
        digit++;
      }
      result = str + unitA[unit] + result;
    }
    unit++;
  }
  return result;
};

/**
 * 발주서 엑셀 다운로드 함수
 * @param orderDetail 발주 상세 정보
 * @param supplierDetail 공급업체 상세 정보
 * @param options 옵션 (파일명 형식 등)
 */
export const handleDownloadExcel = async (
  orderDetail: OrderDetail,
  supplierDetail: SupplierDetail,
  options?: {
    fileName?: string; // 파일명 (기본값: orderDetail.id 사용)
    includeNote?: boolean; // A33 셀에 note 포함 여부 (기본값: false)
  }
) => {
  if (!orderDetail || !supplierDetail) {
    alert('주문 정보 또는 공급업체 정보가 없습니다.');
    return;
  }

  try {
    // 1. 템플릿 파일 fetch (blob → arrayBuffer)
    const response = await fetch('/data/template.xlsx');
    const arrayBuffer = await response.arrayBuffer();

    // 2. xlsx-populate로 workbook 로드
    const workbook = await XlsxPopulate.fromDataAsync(arrayBuffer);
    const sheet = workbook.sheet(0);

    // 3. 셀 값 매핑 (스타일/병합/수식 유지)
    sheet.cell('I10').value(orderDetail.manager);
    sheet.cell('I11').value(supplierDetail.name);
    sheet.cell('W11').value(supplierDetail.contact);
    sheet.cell('I12').value(supplierDetail.manager);
    sheet.cell('W12').value(supplierDetail.email);

    sheet.cell('E16').value(orderDetail.order_date);
    sheet
      .cell('R16')
      .value(orderDetail.expected_delivery_date ? `${orderDetail.expected_delivery_date}` : '');
    sheet.cell('E17').value('고려대학교 100주년기념관(크림슨스토어)');

    const totalAmount = orderDetail.items.reduce(
      (sum, item) => sum + item.quantity * item.unit_price,
      0
    );
    sheet.cell('G18').value(numberToKorean(totalAmount));
    sheet.cell('Q18').value(`${totalAmount.toLocaleString()})`);

    // 부가세 체크박스 LinkedCell: 포함(AG18), 비포함(AH18)
    sheet
      .cell('AB18')
      .value(orderDetail.vat_included ? '있음' : '없음')
      .style('bold', true);
    // 포장 체크박스는 기존 LinkedCell(Z101 등) 사용
    sheet
      .cell('AB31')
      .value(orderDetail.packaging_included ? '있음' : '없음')
      .style('bold', true);

    // 작업지시
    sheet.cell('A30').value(orderDetail.instruction_note || '');

    // 발주 이유 (내부 공유용) - 옵션에 따라 포함
    if (options?.includeNote && orderDetail.note) {
      sheet.cell('A33').value(orderDetail.note);
    }

    // 4. 품목 테이블 (행 복제 및 데이터 입력)
    const startRow = 21;
    const templateRow = 22;
    const itemCount = orderDetail.items.length;

    // 품목이 6개 초과면, 합계행 바로 위까지만 복제
    if (itemCount > 6) {
      for (let i = 6; i < itemCount; i++) {
        sheet.row(templateRow).copyTo(sheet.row(startRow + i));
      }
    }

    // 품목 데이터 입력 (합계행은 건드리지 않음)
    orderDetail.items.forEach((item, idx) => {
      const row = startRow + idx;
      sheet.cell(`C${row}`).value(item.item_name);
      sheet.cell(`H${row}`).value(item.spec || '');
      sheet.cell(`K${row}`).value('EA');
      sheet.cell(`N${row}`).value(item.quantity);
      sheet.cell(`Q${row}`).value(item.unit_price);
      sheet.cell(`X${row}`).value(item.quantity * item.unit_price);
      sheet.cell(`AD${row}`).value(item.remark || '');
    });

    // 불필요한 빈 행을 셀 값 초기화로 대체 (브라우저 환경 호환)
    const templateRows = 6;
    if (orderDetail.items.length < templateRows) {
      for (let i = orderDetail.items.length; i < templateRows; i++) {
        const row = startRow + i;
        ['C', 'H', 'K', 'N', 'Q', 'X', 'AD'].forEach((col) => {
          sheet.cell(`${col}${row}`).value('');
        });
      }
    }

    // 5. 파일 저장
    const blob = await workbook.outputAsync();
    const fileName = options?.fileName || `(주)고대미래_발주서_${orderDetail.order_date}.xlsx`;
    saveAs(blob, fileName);
  } catch (error) {
    console.error('엑셀 다운로드 실패:', error);
    alert('엑셀 파일 생성 중 오류가 발생했습니다.');
  }
};
