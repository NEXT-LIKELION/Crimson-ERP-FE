// src/utils/orderUtils.ts

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
