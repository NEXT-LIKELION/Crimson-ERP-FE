declare module 'xlsx-populate/browser/xlsx-populate' {
  interface XlsxWorkbook {
    sheet(index: number): XlsxWorksheet;
    outputAsync(): Promise<Blob>;
  }

  interface XlsxWorksheet {
    cell(address: string): XlsxCell;
    row(index: number): XlsxRow;
  }

  interface XlsxRow {
    copyTo(targetRow: XlsxRow): XlsxRow;
  }

  interface XlsxCell {
    value(): string | number | boolean | Date | null | undefined;
    value(val: string | number | boolean | Date | null | undefined): XlsxCell;
    style(property: string, value: string): XlsxCell;
  }

  interface XlsxPopulateModule {
    fromFileAsync(file: File): Promise<XlsxWorkbook>;
    fromBlankAsync(): Promise<XlsxWorkbook>;
    fromDataAsync(data: ArrayBuffer): Promise<XlsxWorkbook>;
  }
  const XlsxPopulate: XlsxPopulateModule;
  export default XlsxPopulate;
}

declare module 'xlsx-populate/browser/xlsx-populate-no-encryption' {
  interface XlsxWorkbook {
    sheet(index: number): XlsxWorksheet;
    outputAsync(): Promise<Blob>;
  }

  interface XlsxWorksheet {
    cell(address: string): XlsxCell;
    row(index: number): XlsxRow;
  }

  interface XlsxRow {
    copyTo(targetRow: XlsxRow): XlsxRow;
  }

  interface XlsxCell {
    value(): string | number | boolean | Date | null | undefined;
    value(val: string | number | boolean | Date | null | undefined): XlsxCell;
    style(property: string, value: string): XlsxCell;
  }

  interface XlsxPopulateNoEncModule {
    fromFileAsync(file: File): Promise<XlsxWorkbook>;
    fromBlankAsync(): Promise<XlsxWorkbook>;
    fromDataAsync(data: ArrayBuffer): Promise<XlsxWorkbook>;
  }
  const XlsxPopulateNoEnc: XlsxPopulateNoEncModule;
  export default XlsxPopulateNoEnc;
}

// API 에러 타입 정의
interface ApiErrorResponse {
  message?: string;
  error?: string;
  detail?: string;
  [key: string]: string | string[] | undefined; // 필드별 에러 메시지를 위한 인덱스 시그니처
}

interface ApiError {
  response?: {
    data?: ApiErrorResponse;
    status?: number;
  };
  message?: string;
}

// Authentication API 타입들
interface LoginRequest {
  username: string;
  password: string;
}

interface SignupRequest {
  username: string;
  email: string;
  password: string;
  first_name: string;
  contact: string;
}

interface AuthResponse {
  message: string;
  access_token: string;
  refresh_token: string;
  user?: {
    username: string;
    email: string;
    first_name: string;
    contact: string;
    role: string;
    status: string;
  };
}

interface LogoutRequest {
  refresh_token: string;
}

interface ApproveRequest {
  username: string;
  status: 'approved' | 'denied';
}

// HR API 타입들
interface Employee {
  id: number;
  username: string;
  email: string;
  role: 'MANAGER' | 'STAFF' | 'ADMIN';
  contact: string;
  status: 'approved' | 'pending';
  first_name: string;
  is_active: boolean;
  hire_date: string;
  annual_leave_days?: number;
  allowed_tabs: string[];
  remaining_leave_days: string;
  vacation_days?: string;
  vacation_pending_days?: string;
  gender?: 'MALE' | 'FEMALE';
}

interface EmployeeList {
  id: number;
  username: string;
  email: string;
  role: 'MANAGER' | 'STAFF' | 'ADMIN';
  contact: string;
  status: 'approved' | 'pending';
  first_name: string;
  is_active: boolean;
  hire_date: string;
  remaining_leave_days: string;
  gender?: 'MALE' | 'FEMALE';
}

type EmployeeDetail = Employee;

interface EmployeeUpdateRequest {
  email?: string;
  first_name?: string;
  contact?: string;
  is_active?: boolean;
  annual_leave_days?: number;
  allowed_tabs?: string[];
  hire_date?: string;
  role?: 'MANAGER' | 'STAFF' | 'ADMIN';
  gender?: 'MALE' | 'FEMALE';
}

interface VacationRequest {
  id: number;
  employee: number;
  employee_name: string;
  start_date: string;
  end_date: string;
  leave_type: 'VACATION' | 'SICK' | 'PERSONAL' | 'MATERNITY' | 'OTHER';
  reason?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  status_display: string;
  created_at: string;
  reviewed_at?: string;
}

interface VacationCreateRequest {
  employee: number;
  leave_type: 'VACATION' | 'SICK' | 'PERSONAL' | 'MATERNITY' | 'OTHER';
  start_date: string;
  end_date: string;
  reason?: string;
}

interface VacationReviewRequest {
  status: 'APPROVED' | 'REJECTED';
}

// Orders API 타입들
interface OrderItem {
  id: number;
  variant_code: string;
  item_name: string;
  quantity: number;
  unit?: string;
  unit_price: number;
  remark?: string;
  spec?: string;
}

interface OrderCompact {
  id: number;
  supplier: string;
  manager: string;
  status: 'PENDING' | 'CONFIRMED' | 'DELIVERED' | 'CANCELLED';
  note?: string;
  order_date: string;
  expected_delivery_date: string;
  total_quantity: string;
  total_price: string;
  product_names: string;
}

interface OrderRead {
  id: number;
  supplier: string;
  manager: string;
  order_date: string;
  expected_delivery_date?: string;
  status: 'PENDING' | 'CONFIRMED' | 'DELIVERED' | 'CANCELLED';
  instruction_note?: string;
  note?: string;
  created_at: string;
  vat_included: boolean;
  packaging_included: boolean;
  items: OrderItem[];
}

interface OrderDetail extends OrderRead {
  manager_name?: string; // 프론트엔드에서 사용하는 추가 필드
}

interface OrderCreateRequest {
  supplier: number;
  manager_name: string;
  order_date: string;
  expected_delivery_date: string;
  status: 'PENDING' | 'CONFIRMED' | 'DELIVERED' | 'CANCELLED';
  instruction_note?: string;
  note?: string;
  vat_included: boolean;
  packaging_included: boolean;
  items: {
    variant_code: string;
    quantity: number;
    unit_price: number;
    unit?: string;
    remark?: string;
    spec?: string;
  }[];
}

interface OrderStatusUpdateRequest {
  status: 'PENDING' | 'CONFIRMED' | 'DELIVERED' | 'CANCELLED';
}

// Form 관련 타입들
interface SupplierForm {
  name: string;
  contact: string;
  manager: string;
  email: string;
  address: string;
  variant_codes?: string[];
  is_primary?: boolean; // 옵셔널로 변경
}

// 타입 가드 함수들
declare global {
  function isApiError(error: unknown): error is ApiError;
}
