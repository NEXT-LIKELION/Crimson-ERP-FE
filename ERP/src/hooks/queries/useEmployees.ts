import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchEmployees,
  fetchEmployee,
  patchEmployee,
  terminateEmployee,
  deleteEmployee,
  approveEmployee,
  changePassword,
  type EmployeePatchData,
  type EmployeeList,
  type EmployeeDetail,
} from '../../api/hr';
import { useAuthStore } from '../../store/authStore';

// 직원 목록 조회 훅 - 캐시 비활성화로 항상 실시간 데이터
export const useEmployees = () =>
  useQuery<{ data: EmployeeList[] }>({
    queryKey: ['employees'],
    queryFn: fetchEmployees,
    staleTime: 0, // 즉시 stale 처리
    gcTime: 0, // 캐시 즉시 삭제
    refetchOnMount: true, // 마운트 시 항상 새로 가져오기
    refetchOnWindowFocus: true, // 윈도우 포커스 시 새로 가져오기
  });

// 직원 상세 조회 훅 - 캐시 비활성화로 항상 실시간 데이터
export const useEmployee = (employeeId: number | null) =>
  useQuery<{ data: EmployeeDetail }>({
    queryKey: ['employee', employeeId],
    queryFn: () => fetchEmployee(employeeId!),
    enabled: !!employeeId, // employeeId가 있을 때만 쿼리 실행
    staleTime: 0, // 즉시 stale 처리
    gcTime: 0, // 캐시 즉시 삭제
    refetchOnMount: true, // 마운트 시 항상 새로 가져오기
    refetchOnWindowFocus: true, // 윈도우 포커스 시 새로 가져오기
  });

// 직원 정보 수정 뮤테이션 훅
export const useUpdateEmployee = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ employeeId, data }: { employeeId: number; data: EmployeePatchData }) =>
      patchEmployee(employeeId, data),
    onSuccess: () => {
      // 전체 데이터 강제 새로고침
      queryClient.refetchQueries({ queryKey: ['employees'] });
    },
  });
};

// 직원 정보 부분 수정 뮤테이션 훅 (PATCH) - 단순 API 호출 후 데이터 새로고침
export const usePatchEmployee = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ employeeId, data }: { employeeId: number; data: EmployeePatchData }) =>
      patchEmployee(employeeId, data),

    // 성공 시 전체 데이터 새로 가져오기
    onSuccess: (response, { employeeId, data }) => {

      // 현재 로그인한 사용자의 정보가 업데이트된 경우 authStore도 업데이트
      const currentUser = useAuthStore.getState().user;
      if (
        currentUser &&
        (currentUser.id === employeeId || currentUser.username === response?.data?.username)
      ) {
        const updateUser = useAuthStore.getState().updateUser;
        updateUser({
          first_name: data.first_name,
          email: data.email,
          contact: data.contact,
          role: data.role as 'MANAGER' | 'STAFF' | 'INTERN',
          allowed_tabs: data.allowed_tabs,
        });
      }

      // 전체 목록 강제 새로고침 (서버와 동기화)
      queryClient.refetchQueries({ queryKey: ['employees'] });
      queryClient.refetchQueries({ queryKey: ['employee', employeeId] });
    },

    onError: (error) => {
      console.error('직원 정보 업데이트 실패:', error);
    },
  });
};

// 직원 퇴사 처리 뮤테이션 훅
export const useTerminateEmployee = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: terminateEmployee,
    onSuccess: () => {
      // 전체 데이터 강제 새로고침
      queryClient.refetchQueries({ queryKey: ['employees'] });
    },
  });
};

// 직원 삭제 처리 뮤테이션 훅
export const useDeleteEmployee = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteEmployee,
    onSuccess: () => {
      // 전체 데이터 강제 새로고침
      queryClient.refetchQueries({ queryKey: ['employees'] });
    },
  });
};

// 직원 승인/거절 뮤테이션 훅 - 캐시 없이 즉시 새로고침
export const useApproveEmployee = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ username, status }: { username: string; status: 'approved' | 'denied' }) =>
      approveEmployee(username, status),
    onSuccess: () => {
      // 전체 데이터 강제 새로고침 - 캐시 무시하고 서버에서 새로 가져오기
      queryClient.refetchQueries({ queryKey: ['employees'] });
    },
    onError: (error) => {
      console.error('직원 승인/거절 처리 실패:', error);
      throw error;
    },
  });
};

// 비밀번호 변경 뮤테이션 훅
export const useChangePassword = () => {
  return useMutation({
    mutationFn: ({ employeeId, password }: { employeeId: number; password: string }) =>
      changePassword(employeeId, password),
    onSuccess: () => {
      alert('비밀번호 변경 성공');
    },
    onError: (error) => {
      console.error('비밀번호 변경 실패:', error);
      alert('비밀번호 변경 실패');
      throw error;
    },
  });
};
