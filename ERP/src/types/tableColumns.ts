// 테이블 컬럼 정의 타입
export interface TableColumn {
  id: string;
  label: string;
  required?: boolean; // 필수 컬럼 (항상 표시되어야 함)
  defaultVisible?: boolean; // 기본 표시 여부
}

// 컬럼 표시 상태 타입
export type ColumnVisibility = Record<string, boolean>;

// 테이블 타입
export type TableType = 'inventory' | 'variantStatus';

