import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    fetchEmployees,
    fetchEmployee,
    createEmployee,
    updateEmployee,
    terminateEmployee,
    type Employee,
    type EmployeeCreateData,
    type EmployeeUpdateData,
} from '../../api/hr';

// 직원 목록 조회 훅
export const useEmployees = () =>
    useQuery({
        queryKey: ['employees'],
        queryFn: fetchEmployees,
        staleTime: 1000 * 60 * 5, // 5분
        gcTime: 1000 * 60 * 10, // 10분
    });

// 직원 상세 조회 훅
export const useEmployee = (employeeId: number) =>
    useQuery({
        queryKey: ['employee', employeeId],
        queryFn: () => fetchEmployee(employeeId),
        staleTime: 1000 * 30, // 30초
        gcTime: 1000 * 60 * 5, // 5분
    });

// 직원 추가 뮤테이션 훅
export const useCreateEmployee = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createEmployee,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['employees'] });
        },
    });
};

// 직원 정보 수정 뮤테이션 훅
export const useUpdateEmployee = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ employeeId, data }: { employeeId: number; data: EmployeeUpdateData }) =>
            updateEmployee(employeeId, data),
        onSuccess: (_, { employeeId }) => {
            queryClient.invalidateQueries({ queryKey: ['employees'] });
            queryClient.invalidateQueries({ queryKey: ['employee', employeeId] });
        },
    });
};

// 직원 퇴사 처리 뮤테이션 훅
export const useTerminateEmployee = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: terminateEmployee,
        onSuccess: (_, employeeId) => {
            queryClient.invalidateQueries({ queryKey: ['employees'] });
            queryClient.invalidateQueries({ queryKey: ['employee', employeeId] });
        },
    });
};
