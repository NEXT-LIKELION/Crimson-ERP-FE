import api from './axios';

// 직원 목록 조회
export const fetchEmployees = (): Promise<{ data: EmployeeList[] }> => api.get('/hr/employees/');

// 직원 상세 조회
export const fetchEmployee = (employeeId: number): Promise<{ data: EmployeeDetail }> =>
  api.get(`/hr/employees/${employeeId}/`);

// 직원 정보 부분 수정 (PATCH)
export const patchEmployee = (employeeId: number, data: EmployeePatchData) =>
  api.patch(`/hr/employees/${employeeId}/`, data);

// 직원 퇴사 처리 (is_active를 false로 설정)
export const terminateEmployee = (employeeId: number) =>
  api.patch(`/hr/employees/${employeeId}/`, { is_active: false });

// 직원 삭제 처리 (is_deleted를 true로 설정, 소프트 삭제)
export const deleteEmployee = (employeeId: number) =>
  api.patch(`/hr/employees/${employeeId}/`, { is_deleted: true });

// 대시보드 데이터 조회
export const fetchDashboardData = () => api.get('/');

// 직원 승인/거절
export const approveEmployee = (username: string, status: 'approved' | 'denied') =>
  api.post('/authentication/approve/', { username, status });

// 비밀번호 변경
export const changePassword = (employeeId: number, password: string) =>
  api.put(`/authentication/change-password/${employeeId}/`, { password });

// 직원 등록 (회원가입) - 기본 필드만 사용
export const registerEmployee = (data: EmployeeRegistrationData | {
  username: string;
  email: string;
  password: string;
  first_name: string;
  contact: string;
}) => {
  return api.post('/authentication/signup/', data);
}

// 사용자명 중복 체크
export const checkUsernameAvailability = async (username: string): Promise<{ available: boolean; message: string }> => {
  try {
    const response = await fetchEmployees();
    const existingUsernames = response.data.map(employee => employee.username);
    const isAvailable = !existingUsernames.includes(username);
    
    return {
      available: isAvailable,
      message: isAvailable ? '사용 가능한 아이디입니다.' : '이미 사용 중인 아이디입니다.'
    };
  } catch {
    throw new Error('중복 확인 중 오류가 발생했습니다.');
  }
}

// ===== 휴가 관련 API =====

// 휴가 전체 조회
export const fetchVacations = (): Promise<{ data: VacationRequest[] }> => api.get('/hr/vacations/');

// 휴가 신청
export const createVacation = (data: VacationCreateData): Promise<{ data: VacationRequest }> =>
  api.post('/hr/vacations/', data);

// 휴가 승인/거절/취소
export const reviewVacation = (
  vacationId: number,
  status: VacationStatus
): Promise<{ data: VacationRequest }> => {
  return api.patch(`/hr/vacations/review/${vacationId}/`, { status });
};

// 직원 목록 조회 응답 타입 (GET /hr/employees/) - API 스펙 정확히 반영
export interface EmployeeList {
  id: number;                    // readOnly
  username: string;              // required, pattern: ^[\w.@+-]+$, maxLength: 150
  email: string;                 // email format, maxLength: 254
  role: 'MANAGER' | 'STAFF' | 'INTERN';  // enum 값으로 정확히 정의
  contact: string | null;        // maxLength: 20, nullable
  status: 'APPROVED' | 'DENIED'; // enum 값으로 정확히 정의
  first_name: string;            // maxLength: 150
  is_active: boolean;            // 퇴사 여부
  hire_date: string | null;      // date format, nullable, readOnly
  remaining_leave_days: string;  // readOnly
  gender?: 'MALE' | 'FEMALE';    // 성별, nullable
}

// 직원 상세 조회 응답 타입 (GET /hr/employees/{id}/) - API 스펙 정확히 반영
export interface EmployeeDetail {
  id: number;                          // readOnly
  username: string;                    // required, pattern: ^[\w.@+-]+$, maxLength: 150
  email: string;                       // email format, maxLength: 254
  role: 'MANAGER' | 'STAFF' | 'INTERN'; // enum 값
  contact: string | null;              // maxLength: 20, nullable
  status: 'APPROVED' | 'DENIED';       // enum 값
  first_name: string;                  // maxLength: 150
  is_active: boolean;                  // 퇴사 여부
  hire_date: string | null;            // date format, nullable
  annual_leave_days: number;           // integer, max: 2147483647, min: 0
  allowed_tabs: string[];              // required, 접근 허용 탭 목록
  remaining_leave_days: string;        // readOnly
  vacation_days: string;               // readOnly
  vacation_pending_days: string;       // readOnly
  gender?: 'MALE' | 'FEMALE';          // 성별, nullable (Swagger 스펙 기준)
}

// 백엔드 API 응답에 맞는 Employee 타입 (하위 호환성을 위해 EmployeeDetail과 동일하게 유지)
export type Employee = EmployeeDetail;

// 프론트엔드에서 사용할 매핑된 Employee 타입 (HR 페이지에서 직접 정의)

// PATCH /hr/employees/{employee_id}/ 엔드포인트용 데이터 타입 (API 스펙 기준)
export interface EmployeeUpdateData {
  email?: string;                       // 직원 이메일
  first_name?: string;                  // 이름
  contact?: string;                     // 직원 연락처
  is_active?: boolean;                  // 퇴사 여부 (false이면 퇴사)
  annual_leave_days?: number;           // 연차일수
  allowed_tabs?: string[];              // 접근 허용 탭 목록
  hire_date?: string;                   // 입사일 (date format)
  role?: 'MANAGER' | 'STAFF' | 'INTERN'; // 직무 구분
  is_deleted?: boolean;                 // 삭제 여부 (소프트 삭제)
  gender?: 'MALE' | 'FEMALE';           // 성별
}

// EmployeePatchData는 EmployeeUpdateData와 동일 (하위 호환성을 위해 유지)
export type EmployeePatchData = EmployeeUpdateData;

// 직원 등록용 데이터 타입
export interface EmployeeRegistrationData {
  username: string;
  password: string;
  first_name: string;
  email: string;
  contact: string;
  role: string;
  hire_date: string;
  annual_leave_days?: number;
  allowed_tabs?: string[];
}

// 휴가 기록 타입
export interface VacationDay {
  start_date: string;
  end_date: string;
  leave_type: LeaveType;
}

// 휴가 데이터 파싱 유틸리티 함수
export const parseVacationDays = (vacationData: string | VacationDay[]): VacationDay[] => {
  if (!vacationData) return [];

  // 이미 배열인 경우
  if (Array.isArray(vacationData)) return vacationData;

  // 문자열인 경우 JSON 파싱 시도
  try {
    const parsed = JSON.parse(vacationData);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

// 허용된 탭 옵션
export const ALLOWED_TABS_OPTIONS = [
  { value: 'INVENTORY', label: '재고 관리' },
  { value: 'ORDER', label: '발주 관리' },
  { value: 'SUPPLIER', label: '업체 관리' },
] as const;

export type AllowedTab = (typeof ALLOWED_TABS_OPTIONS)[number]['value'];

// ===== 휴가 관련 타입 정의 =====

// 휴가 유형
export type LeaveType = 'VACATION' | 'HALF_DAY_AM' | 'HALF_DAY_PM' | 'SICK' | 'OTHER' | 'WORK';

// 휴가 상태
export type VacationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

// 백엔드 API 응답에 맞는 VacationRequest 타입 (GET /hr/vacations/, POST /hr/vacations/, PATCH /hr/vacations/review/{id}/)
export interface VacationRequest {
  id: number; // readOnly
  employee: number;
  employee_name: string; // readOnly
  start_date: string;
  end_date: string;
  leave_type: LeaveType; // readOnly
  reason: string | null; // nullable
  status: VacationStatus;
  status_display: string; // readOnly
  created_at: string; // readOnly
  reviewed_at: string | null; // readOnly, nullable
}

// 하위 호환성을 위해 Vacation 타입 유지 (VacationRequest와 동일)
export type Vacation = VacationRequest;

// 휴가 신청용 데이터 타입
export interface VacationCreateData {
  employee: number;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  reason?: string; // API 문서에 따르면 선택사항
}

// 휴가 유형 옵션
export const LEAVE_TYPE_OPTIONS = [
  { value: 'VACATION' as const, label: '연차', adminOnly: false },
  { value: 'HALF_DAY_AM' as const, label: '오전 반차', adminOnly: false },
  { value: 'HALF_DAY_PM' as const, label: '오후 반차', adminOnly: false },
  { value: 'SICK' as const, label: '병가', adminOnly: false },
  { value: 'OTHER' as const, label: '기타', adminOnly: false },
  { value: 'WORK' as const, label: '근무', adminOnly: true },
];

// 휴가 상태 옵션
export const VACATION_STATUS_OPTIONS = [
  { value: 'PENDING' as const, label: '대기중', color: 'yellow' },
  { value: 'APPROVED' as const, label: '승인됨', color: 'green' },
  { value: 'REJECTED' as const, label: '거절됨', color: 'red' },
  { value: 'CANCELLED' as const, label: '취소됨', color: 'gray' },
];

export interface DashboardData {
  low_stock_items: Array<{
    id: number;
    name: string;
    current_stock: number;
    minimum_stock: number;
  }>;
  recent_orders: Array<{
    id: number;
    product_name: string;
    quantity: number;
    order_date: string;
    status: string;
  }>;
}
