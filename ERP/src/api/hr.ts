import api from './axios';

// 직원 목록 조회
export const fetchEmployees = () => api.get('/hr/employees/');

// 직원 상세 조회
export const fetchEmployee = (employeeId: number) => api.get(`/hr/employees/${employeeId}/`);

// 직원 추가
export const createEmployee = (data: EmployeeCreateData) => api.post('/hr/employees/', data);

// 직원 정보 수정
export const updateEmployee = (employeeId: number, data: EmployeeUpdateData) =>
    api.put(`/hr/employees/${employeeId}/`, data);

// 직원 퇴사 처리
export const terminateEmployee = (employeeId: number) =>
    api.patch(`/hr/employees/${employeeId}/`, { status: 'terminated' });

// 대시보드 데이터 조회
export const fetchDashboardData = () => api.get('/');

// 타입 정의
export interface Employee {
    id: number;
    name: string;
    position: string;
    department: string;
    email: string;
    phone: string;
    status: 'active' | 'terminated';
    hire_date: string;
    created_at: string;
    updated_at: string;
}

export interface EmployeeCreateData {
    name: string;
    position: string;
    department: string;
    email: string;
    phone: string;
}

export interface EmployeeUpdateData extends Partial<EmployeeCreateData> {
    status?: 'active' | 'terminated';
}

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
