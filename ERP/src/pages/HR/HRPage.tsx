// src/pages/HR/HRPage.tsx
import React, { useState } from 'react';
import {
  FiUser,
  FiUsers,
  FiCalendar,
  FiTrash2,
  FiEye,
  FiPlusCircle,
  FiLock,
} from 'react-icons/fi';
import StatusBadge from '../../components/common/StatusBadge';
import EmployeeDetailsModal from '../../components/modal/EmployeeDetailsModal';
import EmployeeRegistrationModal from '../../components/modal/EmployeeRegistrationModal';
import VacationRequestModal from '../../components/modal/VacationRequestModal';
import ChangePasswordModal from '../../components/modal/ChangePasswordModal';
import OrganizationVacationCalendar from '../../components/calendar/OrganizationVacationCalendar';
import { useEmployees, useEmployee, useTerminateEmployee, usePatchEmployee, useApproveEmployee, useDeleteEmployee, useChangePassword } from '../../hooks/queries/useEmployees';
import { useQueryClient } from '@tanstack/react-query';
import { EmployeeList } from '../../api/hr';
import { useAuthStore } from '../../store/authStore';
import { isApiError, getErrorMessage } from '../../utils/errorHandling';

// 직원 상태 타입
type EmployeeStatus = 'active' | 'terminated' | 'denied';


// 날짜 형식 변환 함수 (ISO 8601 형식 지원)
const formatDateToKorean = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}년 ${month}월 ${day}일`;
};

// Role 매핑 함수
const mapRoleToKorean = (role: string): string => {
  switch (role) {
    case 'MANAGER':
      return '대표';
    case 'STAFF':
      return '직원';
    case 'INTERN':
      return '인턴';
    default:
      return role;
  }
};

// Gender 매핑 함수
const mapGenderToKorean = (gender?: string): string => {
  switch (gender) {
    case 'MALE':
      return '남성';
    case 'FEMALE':
      return '여성';
    default:
      return '';
  }
};

// 프론트엔드에서 사용할 통합 Employee 타입 (API 스펙 기반)
export interface MappedEmployee {
  id: number;
  name: string;                          // 화면 표시용 (실제: first_name)
  username: string;                      // API 호출용
  role: 'MANAGER' | 'STAFF' | 'INTERN';   // 정확한 enum 타입
  position: string;                      // UI 표시용 한글 직책
  department: string;                    // UI 표시용 부서
  email: string;
  phone: string;                         // contact 필드 매핑
  status: 'active' | 'terminated' | 'denied'; // UI 상태
  hire_date: string;
  annual_leave_days: number;
  allowed_tabs: string[];
  remaining_leave_days: number;
  vacation_days: unknown[];                  // 휴가 데이터 (파싱 필요)
  vacation_pending_days: unknown[];          // 대기 중인 휴가
  gender?: 'MALE' | 'FEMALE';               // 성별 (Swagger 문서 기준)
  // UI용 필드들 (선택적)
  created_at?: string;
  updated_at?: string;
}

// 직원 상태를 정확히 판단하는 유틸리티 함수
const getEmployeeStatus = (status: string, isActive: boolean): 'active' | 'denied' | 'terminated' => {
  // is_active가 false면 상태에 상관없이 퇴사
  if (!isActive) {
    return 'terminated';
  }
  
  // is_active가 true일 때 status에 따라 구분 (대소문자 구분 없이)
  const normalizedStatus = status?.toLowerCase();
  if (normalizedStatus === 'approved') {
    return 'active';      // 재직중
  } else if (normalizedStatus === 'denied') {
    return 'denied';      // 승인대기중
  }
  
  // 기본값 (예상치 못한 상태)
  return 'denied';
};

// 백엔드 EmployeeList를 프론트엔드 MappedEmployee로 변환
const mapEmployeeData = (emp: EmployeeList): MappedEmployee => ({
  id: emp.id,
  name: emp.first_name || emp.username, // 이름이 있으면 first_name, 없으면 username 사용
  username: emp.username, // API 호출 시 사용할 실제 username
  role: emp.role,
  position: mapRoleToKorean(emp.role),
  department: emp.role === 'MANAGER' ? '경영진' : '일반',
  email: emp.email,
  phone: emp.contact || '',
  status: getEmployeeStatus(emp.status, emp.is_active), // 정확한 상태 판단
  hire_date: emp.hire_date || '',
  annual_leave_days: 0, // 목록 조회에서는 제공되지 않음
  allowed_tabs: [], // 목록 조회에서는 제공되지 않음
  remaining_leave_days: parseInt(emp.remaining_leave_days) || 0,
  vacation_days: [], // 목록 조회에서는 제공되지 않음
  vacation_pending_days: [], // 목록 조회에서는 제공되지 않음
  gender: (emp as EmployeeList & { gender?: 'MALE' | 'FEMALE' }).gender, // API 스펙에 따라 gender 필드 추가
  created_at: '',
  updated_at: '',
});

const HRPage: React.FC = () => {
  // 현재 로그인한 사용자 정보
  const currentUser = useAuthStore((state) => state.user);
  const isAdmin = currentUser?.role === 'MANAGER';

  // API 훅 사용 - React Query로 데이터 관리
  const { data: employeesData, isLoading, error } = useEmployees();
  const terminateEmployee = useTerminateEmployee();
  const deleteEmployeeMutation = useDeleteEmployee();
  const patchEmployeeMutation = usePatchEmployee();
  const approveEmployeeMutation = useApproveEmployee();
  const changePasswordMutation = useChangePassword();
  const queryClient = useQueryClient();

  // 매핑된 직원 데이터 계산된 값으로 사용
  const employees = React.useMemo(() => {
    if (!employeesData?.data) return [];
    return employeesData.data.map((emp: EmployeeList) => mapEmployeeData(emp));
  }, [employeesData?.data]);

  // 현재 사용자의 상세 정보 조회 (연차 정보 포함)
  const currentEmployeeId = React.useMemo(() => {
    if (!currentUser || isAdmin) return null;
    const currentEmp = employees.find(emp => emp.username === currentUser.username);
    return currentEmp?.id || null;
  }, [employees, currentUser, isAdmin]);

  // 현재 사용자 상세 정보 (연차 데이터 포함)
  const { data: currentEmployeeDetailData } = useEmployee(currentEmployeeId);

  // 현재 사용자 정보 (일반 직원용) - 상세 정보와 목록 정보 병합
  const currentEmployeeData = React.useMemo(() => {
    if (!currentUser || isAdmin || !currentEmployeeId) return null;

    const basicData = employees.find(emp => emp.username === currentUser.username);
    if (!basicData) return null;

    // 상세 정보가 있으면 연차 데이터를 업데이트
    if (currentEmployeeDetailData?.data) {
      return {
        ...basicData,
        annual_leave_days: currentEmployeeDetailData.data.annual_leave_days,
        allowed_tabs: currentEmployeeDetailData.data.allowed_tabs || [],
      };
    }

    return basicData;
  }, [employees, currentUser, isAdmin, currentEmployeeId, currentEmployeeDetailData]);

  // 모달 상태 관리
  const [selectedEmployee, setSelectedEmployee] = useState<MappedEmployee | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEmployeeRegistrationModal, setShowEmployeeRegistrationModal] = useState(false);
  const [showVacationRequestModal, setShowVacationRequestModal] = useState(false);
  const [showOrganizationVacationCalendar, setShowOrganizationVacationCalendar] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [changePasswordEmployee, setChangePasswordEmployee] = useState<MappedEmployee | null>(null);

  // API 데이터 로드 useEffect 제거 - useMemo로 대체
  // useEffect(() => {
  //   if (employeesData?.data) {
  //     const mapped = employeesData.data.map((emp: EmployeeList) => mapEmployeeData(emp));
  //     setEmployees(mapped);
  //   }
  // }, [employeesData]); // 제거

  // 직원을 상태별로 그룹화하는 함수
  const groupEmployeesByStatus = () => {
    const activeEmployees = employees.filter(emp => emp.status === 'active');
    const pendingEmployees = employees.filter(emp => emp.status === 'denied'); // API에서 DENIED = 승인대기 상태
    const terminatedEmployees = employees.filter(emp => emp.status === 'terminated');
    
    return {
      active: activeEmployees,
      pending: pendingEmployees,
      terminated: terminatedEmployees
    };
  };

  // 섹션별 직원 카드를 렌더링하는 함수
  const renderEmployeeSections = () => {
    const { active, pending, terminated } = groupEmployeesByStatus();
    
    return (
      <div className='space-y-8'>
        {/* 재직중 섹션 */}
        {active.length > 0 && (
          <div>
            <div className='mb-4'>
              <h2 className='text-lg font-semibold text-gray-900'>재직중 ({active.length}명)</h2>
            </div>
            <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
              {active.map((employee) => (
                <EmployeeCard key={employee.id} employee={employee} />
              ))}
            </div>
          </div>
        )}

        {/* 승인대기중 섹션 */}
        {pending.length > 0 && (
          <div>
            <div className='mb-4'>
              <h2 className='text-lg font-semibold text-gray-900'>승인대기중 ({pending.length}명)</h2>
            </div>
            <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
              {pending.map((employee) => (
                <EmployeeCard key={employee.id} employee={employee} />
              ))}
            </div>
          </div>
        )}

        {/* 퇴사 섹션 */}
        {terminated.length > 0 && (
          <div>
            <div className='mb-4'>
              <h2 className='text-lg font-semibold text-gray-900'>퇴사 ({terminated.length}명)</h2>
            </div>
            <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
              {terminated.map((employee) => (
                <EmployeeCard key={employee.id} employee={employee} />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // 직원 정보 업데이트 - Optimistic Updates 적용
  const handleUpdateEmployee = async (updatedEmployee: MappedEmployee) => {
    // 관리자 권한 확인
    if (!isAdmin) {
      alert('직원 정보를 수정할 권한이 없습니다.');
      return;
    }

    // 백엔드 API에 맞게 필드명 변경 (PATCH API 스펙에 맞춤)
    const updateData = {
      email: updatedEmployee.email?.trim() || undefined,
      first_name: updatedEmployee.name?.trim() || undefined,
      contact: updatedEmployee.phone?.trim() || undefined,
      is_active: true, // 일반적인 정보 수정 시에는 항상 true (퇴사가 아닌 경우)
      annual_leave_days: Number(updatedEmployee.annual_leave_days) || 0,
      allowed_tabs: Array.isArray(updatedEmployee.allowed_tabs) ? updatedEmployee.allowed_tabs : [],
      hire_date: updatedEmployee.hire_date?.trim() || undefined,
      role: updatedEmployee.role,
      is_deleted: false, // 일반적인 정보 수정 시에는 항상 false (삭제가 아닌 경우)
      gender: updatedEmployee.gender || undefined, // 성별 필드 추가
    };

    try {
      await patchEmployeeMutation.mutateAsync({
        employeeId: updatedEmployee.id,
        data: updateData
      });

      setSelectedEmployee(updatedEmployee);
    } catch (error: unknown) {
      console.error('직원 정보 업데이트 실패:', error);
      throw error;
    }
  };

  // 비밀번호 변경 핸들러
  const handleChangePassword = async (employeeId: number, password: string) => {
    try {
      await changePasswordMutation.mutateAsync({ employeeId, password });
    } catch (error: unknown) {
      console.error('비밀번호 변경 실패:', error);
      throw error;
    }
  };

  // 직원 카드 컴포넌트
  const EmployeeCard: React.FC<{ employee: MappedEmployee }> = ({ employee }) => {
    const isTerminated = employee.status === 'terminated';
    const isCurrentUser = currentUser?.username === employee.username; // 현재 로그인한 사용자와 같은지 확인

    // 상태에 따른 StatusBadge 컴포넌트 설정
    const getStatusBadge = (status: EmployeeStatus) => {
      switch (status) {
        case 'active':
          return <StatusBadge text='재직중' theme='active' />;
        case 'terminated':
          return <StatusBadge text='퇴사' theme='rejected' />;
        case 'denied':
          return <StatusBadge text='승인 대기' theme='pending' />;
        default:
          return <StatusBadge text='재직중' theme='active' />;
      }
    };

    // 직원 상세 정보 보기
    const handleViewDetails = () => {
      setSelectedEmployee(employee);
      setShowDetailsModal(true);
    };

    // 비밀번호 변경
    const handleChangePasswordClick = () => {
      setChangePasswordEmployee(employee);
      setShowChangePasswordModal(true);
    };

    // 직원 퇴사 처리
    const handleTerminateEmployee = async () => {
      // 관리자 권한 확인
      if (!isAdmin) {
        alert('직원을 퇴사 처리할 권한이 없습니다.');
        return;
      }

      if (window.confirm(`${employee.name} 직원을 퇴사 처리하시겠습니까?`)) {
        try {
          await terminateEmployee.mutateAsync(employee.id);
          alert('퇴사 처리가 완료되었습니다.');
        } catch (error: unknown) {
          console.error('퇴사 처리 실패:', error);
          if (isApiError(error)) {
            console.error('퇴사 처리 응답 데이터:', error.response?.data);
            console.error('퇴사 처리 상태 코드:', error.response?.status);
          }

          const errorMessage = getErrorMessage(error, '퇴사 처리에 실패했습니다.');
          alert(errorMessage);
        }
      }
    };

    // 직원 삭제 처리
    const handleDeleteEmployee = async () => {
      // 관리자 권한 확인
      if (!isAdmin) {
        alert('직원을 삭제할 권한이 없습니다.');
        return;
      }

      if (window.confirm(`${employee.name} 직원을 완전히 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`)) {
        try {
          await deleteEmployeeMutation.mutateAsync(employee.id);
          alert('직원이 삭제되었습니다.');
        } catch (error: unknown) {
          console.error('직원 삭제 실패:', error);
          if (isApiError(error)) {
            console.error('직원 삭제 응답 데이터:', error.response?.data);
            console.error('직원 삭제 상태 코드:', error.response?.status);
          }

          const errorMessage = getErrorMessage(error, '직원 삭제에 실패했습니다.');
          alert(errorMessage);
        }
      }
    };

    // 퇴사한 직원인 경우 카드 전체를 흐리게 처리
    const cardOpacity = isTerminated ? 'opacity-60' : 'opacity-100';
    const textOpacity = isTerminated ? 'text-gray-400' : 'text-gray-900';
    const subTextOpacity = isTerminated ? 'text-gray-300' : 'text-gray-600';

    return (
      <div
        className={`overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-all duration-200 hover:shadow-md ${cardOpacity} ${
          isTerminated ? 'bg-gray-50' : ''
        }`}>
        {/* 카드 전체 영역 - 컴팩트하게 */}
        <div className='p-4'>
          {/* 상단: 이름과 상태 */}
          <div className='mb-3 flex items-center justify-between'>
            <h3
              className={`truncate text-base font-semibold ${textOpacity} ${
                isTerminated ? 'line-through' : ''
              }`}>
              {employee.name}
            </h3>
            {getStatusBadge(employee.status as EmployeeStatus)}
          </div>

          {/* 중간: 직책 및 정보 */}
          <div className='mb-3 space-y-1'>
            <div className={`flex items-center text-sm ${subTextOpacity}`}>
              <FiUser className='mr-2 h-3 w-3 text-gray-400' />
              <span>{employee.position}</span>
              {employee.gender && (
                <>
                  <span className='mx-2'>•</span>
                  <span>{mapGenderToKorean(employee.gender)}</span>
                </>
              )}
            </div>
            <div className={`flex items-center text-sm ${subTextOpacity}`}>
              <FiCalendar className='mr-2 h-3 w-3 text-gray-400' />
              <span>{formatDateToKorean(employee.hire_date)}</span>
            </div>
          </div>

          {/* 하단: 액션 버튼들 */}
          <div className='border-t border-gray-100 pt-3 -mx-4 px-4'>
            <div className='flex items-center justify-end space-x-1.5'>
              <button
                className='flex items-center rounded-md border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50'
                onClick={handleViewDetails}>
                <FiEye className='mr-1 h-3 w-3' />
                상세보기
              </button>
              {/* 비밀번호 변경 버튼: 본인 또는 관리자만 볼 수 있음 */}
              {(isCurrentUser || isAdmin) && employee.status === 'active' && (
                <button
                  className='flex items-center rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100'
                  onClick={handleChangePasswordClick}>
                  <FiLock className='mr-1 h-3 w-3' />
                  비밀번호 변경
                </button>
              )}
              {/* 퇴사 버튼: 관리자만 보이고, 재직중이고, 본인이 아닌 경우에만 표시 */}
              {isAdmin && employee.status === 'active' && !isCurrentUser && (
                <button
                  className='flex items-center rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 transition-colors hover:bg-red-100'
                  onClick={handleTerminateEmployee}>
                  <FiTrash2 className='mr-1 h-3 w-3' />
                  퇴사
                </button>
              )}

              {/* 삭제 버튼: 관리자만 보이고, 퇴사한 직원에게만 표시 */}
              {isAdmin && employee.status === 'terminated' && (
                <button
                  className='flex items-center rounded-md border border-red-300 bg-red-100 px-2.5 py-1 text-xs font-medium text-red-800 transition-colors hover:bg-red-200'
                  onClick={handleDeleteEmployee}>
                  <FiTrash2 className='mr-1 h-3 w-3' />
                  삭제
                </button>
              )}
              {/* 승인대기중 직원에게만 승인/거절 버튼 표시 */}
              {isAdmin && employee.status === 'denied' && (
                <>
                  {/* 승인 버튼 */}
                  <button
                    className='flex items-center rounded-md border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 transition-colors hover:bg-green-100'
                    onClick={async () => {
                      try {
                        await approveEmployeeMutation.mutateAsync({
                          username: employee.username,
                          status: 'approved'
                        });
                        alert('승인 완료!');
                      } catch (e: unknown) {
                        console.error('승인 처리 실패:', e);
                        const errorMsg = getErrorMessage(e, '승인 실패');
                        alert(errorMsg);
                      }
                    }}>
                    승인
                  </button>

                  {/* 거절 버튼 */}
                  <button
                    className='flex items-center rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 transition-colors hover:bg-red-100'
                    onClick={async () => {
                      try {
                        await approveEmployeeMutation.mutateAsync({
                          username: employee.username,
                          status: 'denied'
                        });

                        await patchEmployeeMutation.mutateAsync({
                          employeeId: employee.id,
                          data: {
                            is_active: false
                          }
                        });

                        alert('거절 및 퇴사 처리 완료!');
                      } catch (e: unknown) {
                        console.error('거절 처리 실패:', e);
                        const errorMsg = getErrorMessage(e, '거절 처리 실패');
                        alert(errorMsg);
                      }
                    }}>
                    거절
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 모달 제어 함수
  const handleCloseModals = () => {
    setShowDetailsModal(false);
    setSelectedEmployee(null);
  };

  // 직원 등록 완료 핸들러
  const handleEmployeeRegistrationComplete = () => {
    setShowEmployeeRegistrationModal(false);
    
    // React Query 캐시 무효화로 최신 데이터 가져오기
    queryClient.invalidateQueries({ queryKey: ['employees'] });
  };

  // 개인 직원용 마이페이지 컴포넌트
  const PersonalInfoPage = ({ employee }: { employee: MappedEmployee }) => {
    const handleViewDetails = () => {
      setSelectedEmployee(employee);
      setShowDetailsModal(true);
    };

    return (
      <div className='min-h-screen bg-gray-50'>
        <div className='mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8'>
          {/* 페이지 헤더 */}
          <div className='mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm'>
            <div className='flex flex-col justify-between gap-4 sm:flex-row sm:items-center'>
              <div className='flex items-center'>
                <div className='mr-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-blue-600'>
                  <FiUser className='h-6 w-6 text-white' />
                </div>
                <div>
                  <h1 className='text-2xl font-bold text-gray-900'>마이페이지</h1>
                  <p className='mt-1 text-gray-600'>
                    안녕하세요, <span className='font-semibold text-blue-600'>{employee.name}</span>님
                  </p>
                </div>
              </div>
              <div className='flex items-center gap-3'>
                {/* 휴가 신청 버튼 */}
                <button
                  onClick={() => setShowVacationRequestModal(true)}
                  className='flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700'>
                  <FiPlusCircle className='mr-2 h-4 w-4' />
                  휴가신청
                </button>

                {/* 내 휴가 보기 버튼 */}
                <button
                  onClick={() => setShowOrganizationVacationCalendar(true)}
                  className='flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700'>
                  <FiCalendar className='mr-2 h-4 w-4' />
                  내 휴가
                </button>
              </div>
            </div>
          </div>

          {/* 개인 정보 카드 */}
          <div className='mb-8'>
            <div className='rounded-xl border border-gray-200 bg-white p-6 shadow-sm'>
              <div className='mb-4 flex items-center justify-between'>
                <h2 className='text-lg font-semibold text-gray-900'>개인 정보</h2>
                <button
                  onClick={() => {
                    if (currentEmployeeData) {
                      setChangePasswordEmployee(currentEmployeeData);
                      setShowChangePasswordModal(true);
                    } else {
                      alert('직원 정보를 불러올 수 없습니다. 페이지를 새로고침해주세요.');
                    }
                  }}
                  className='flex items-center rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 shadow-sm transition-all duration-200 hover:border-blue-300 hover:bg-blue-100'>
                  <FiLock className='mr-2 h-4 w-4' />
                  비밀번호 변경
                </button>
              </div>

              <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>이름</label>
                  <p className='text-gray-900'>{employee.name}</p>
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>사용자명</label>
                  <p className='text-gray-900'>{employee.username}</p>
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>직책</label>
                  <p className='text-gray-900'>{employee.position}</p>
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>근무 상태</label>
                  <p className='text-gray-900'>
                    {employee.status === 'active' ? '재직중' :
                     employee.status === 'terminated' ? '퇴사' : '승인대기'}
                  </p>
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>이메일</label>
                  <p className='text-gray-900'>{employee.email}</p>
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>연락처</label>
                  <p className='text-gray-900'>{employee.phone}</p>
                </div>
                {employee.gender && (
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>성별</label>
                    <p className='text-gray-900'>{mapGenderToKorean(employee.gender)}</p>
                  </div>
                )}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>입사일</label>
                  <p className='text-gray-900'>{formatDateToKorean(employee.hire_date)}</p>
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>연차 총 일수</label>
                  <p className='text-gray-900'>{employee.annual_leave_days}일</p>
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>남은 연차</label>
                  <p className='text-gray-900'>{employee.remaining_leave_days}일</p>
                </div>
                {employee.allowed_tabs && employee.allowed_tabs.length > 0 && (
                  <div className='md:col-span-2'>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>접근 권한</label>
                    <div className='flex flex-wrap gap-2'>
                      {employee.allowed_tabs.map((tab) => (
                        <span
                          key={tab}
                          className='inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800'>
                          {tab === 'INVENTORY' ? '재고 관리' :
                           tab === 'ORDER' ? '발주 관리' :
                           tab === 'SUPPLIER' ? '업체 관리' :
                           tab === 'HR' ? 'HR 관리' : tab}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 휴가 정보 카드 */}
          <div className='mb-8'>
            <div className='rounded-xl border border-gray-200 bg-white p-6 shadow-sm'>
              <h2 className='mb-4 text-lg font-semibold text-gray-900'>휴가 정보</h2>
              <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
                <div className='rounded-lg bg-blue-50 p-4'>
                  <div className='flex items-center'>
                    <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100'>
                      <FiCalendar className='h-4 w-4 text-blue-600' />
                    </div>
                    <div className='ml-3'>
                      <p className='text-sm font-medium text-blue-900'>연차 총 일수</p>
                      <p className='text-lg font-semibold text-blue-700'>{employee.annual_leave_days}일</p>
                    </div>
                  </div>
                </div>
                <div className='rounded-lg bg-green-50 p-4'>
                  <div className='flex items-center'>
                    <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-green-100'>
                      <FiCalendar className='h-4 w-4 text-green-600' />
                    </div>
                    <div className='ml-3'>
                      <p className='text-sm font-medium text-green-900'>남은 연차</p>
                      <p className='text-lg font-semibold text-green-700'>{employee.remaining_leave_days}일</p>
                    </div>
                  </div>
                </div>
                <div className='rounded-lg bg-orange-50 p-4'>
                  <div className='flex items-center'>
                    <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100'>
                      <FiCalendar className='h-4 w-4 text-orange-600' />
                    </div>
                    <div className='ml-3'>
                      <p className='text-sm font-medium text-orange-900'>사용한 연차</p>
                      <p className='text-lg font-semibold text-orange-700'>{employee.annual_leave_days - employee.remaining_leave_days}일</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading)
    return (
      <div className='flex h-96 items-center justify-center'>
        <div className='flex flex-col items-center'>
          <div className='mb-4 h-8 w-8 animate-spin rounded-full border-4 border-rose-200 border-t-rose-600'></div>
          <p className='font-medium text-gray-600'>직원 정보를 불러오는 중...</p>
        </div>
      </div>
    );

  if (error)
    return (
      <div className='flex h-96 items-center justify-center'>
        <div className='rounded-lg border border-red-200 bg-red-50 p-8 text-center'>
          <div className='mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100'>
            <svg
              className='h-6 w-6 text-red-600'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
              />
            </svg>
          </div>
          <h3 className='mb-2 text-lg font-semibold text-red-800'>오류가 발생했습니다</h3>
          <p className='text-red-600'>직원 정보를 불러올 수 없습니다. 잠시 후 다시 시도해주세요.</p>
        </div>
      </div>
    );

  // 일반 직원은 개인 마이페이지 표시
  if (!isAdmin && currentEmployeeData) {
    return (
      <>
        <PersonalInfoPage employee={currentEmployeeData} />
        
        {/* 직원 상세 정보 모달 (본인 정보만) */}
        {showDetailsModal && selectedEmployee && (
          <EmployeeDetailsModal
            employee={selectedEmployee}
            onClose={handleCloseModals}
            onUpdateEmployee={handleUpdateEmployee}
            isAdmin={false}
          />
        )}

        {/* 휴가 신청 모달 */}
        {showVacationRequestModal && (
          <VacationRequestModal
            onClose={() => setShowVacationRequestModal(false)}
            onSuccess={() => {
              setShowVacationRequestModal(false);
              setShowOrganizationVacationCalendar(true);
            }}
          />
        )}

        {/* 개인 휴가 캘린더 모달 */}
        {showOrganizationVacationCalendar && (
          <OrganizationVacationCalendar onClose={() => setShowOrganizationVacationCalendar(false)} />
        )}

        {/* 비밀번호 변경 모달 (마이페이지용) */}
        {showChangePasswordModal && changePasswordEmployee && (
          <ChangePasswordModal
            employeeId={changePasswordEmployee.id}
            employeeName={changePasswordEmployee.name}
            onClose={() => {
              setShowChangePasswordModal(false);
              setChangePasswordEmployee(null);
            }}
            onChangePassword={handleChangePassword}
          />
        )}
      </>
    );
  }

  // 일반 직원이지만 데이터를 찾을 수 없는 경우
  if (!isAdmin && !currentEmployeeData) {
    return (
      <div className='flex h-96 items-center justify-center'>
        <div className='rounded-lg border border-yellow-200 bg-yellow-50 p-8 text-center'>
          <div className='mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100'>
            <FiUser className='h-6 w-6 text-yellow-600' />
          </div>
          <h3 className='mb-2 text-lg font-semibold text-yellow-800'>정보를 찾을 수 없습니다</h3>
          <p className='text-yellow-600'>개인 정보를 불러올 수 없습니다. 관리자에게 문의해주세요.</p>
        </div>
      </div>
    );
  }

  // 대표는 기존 HR 관리 화면 표시
  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8'>
        {/* 페이지 헤더 */}
        <div className='mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm'>
          <div className='flex flex-col justify-between gap-4 sm:flex-row sm:items-center'>
            <div className='flex items-center'>
              <div className='mr-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-r from-rose-500 to-rose-600'>
                <FiUsers className='h-6 w-6 text-white' />
              </div>
              <div>
                <h1 className='text-2xl font-bold text-gray-900'>HR 관리</h1>
                <p className='mt-1 text-gray-600'>
                  총 <span className='font-semibold text-rose-600'>{employees.length}명</span>의
                  직원 정보를 관리하고 있습니다
                </p>
              </div>
            </div>
            <div className='flex items-center gap-3'>
              {/* 휴가 관련 버튼 */}
              <div className='flex items-center gap-2'>
                {/* 휴가 신청 버튼 - 모든 사용자 */}
                <button
                  onClick={() => setShowVacationRequestModal(true)}
                  className='flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700'>
                  <FiPlusCircle className='mr-2 h-4 w-4' />
                  휴가신청
                </button>

                {/* 휴가 관리/조직 캘린더 통합 버튼 */}
                <button
                  onClick={() => setShowOrganizationVacationCalendar(true)}
                  className='flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700'>
                  <FiCalendar className='mr-2 h-4 w-4' />
                  {isAdmin ? '휴가 관리/캘린더' : '내 휴가'}
                </button>
              </div>

              {/* 구분선 */}
              <div className='h-6 w-px bg-gray-300'></div>

              {/* 직원등록 버튼 - MANAGER만 표시 */}
              {isAdmin && (
                <button
                  onClick={() => setShowEmployeeRegistrationModal(true)}
                  className='flex items-center rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-rose-700'>
                  <FiUser className='mr-2 h-4 w-4' />
                  직원등록
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 직원 섹션별 배치 */}
        {renderEmployeeSections()}

        {/* 결과가 없을 경우 메시지 */}
        {employees.length === 0 && (
          <div className='rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm'>
            <div className='mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100'>
              <FiUsers className='h-10 w-10 text-gray-400' />
            </div>
            <h3 className='mb-3 text-xl font-semibold text-gray-900'>직원 정보가 없습니다</h3>
            <p className='mb-6 text-gray-600'>직원 정보를 불러올 수 없습니다.</p>
          </div>
        )}
      </div>

      {/* 직원 상세 정보 모달 */}
      {showDetailsModal && selectedEmployee && (
        <EmployeeDetailsModal
          employee={selectedEmployee}
          onClose={handleCloseModals}
          onUpdateEmployee={handleUpdateEmployee}
          isAdmin={isAdmin}
        />
      )}

      {/* 직원 등록 모달 - 관리자만 접근 가능 */}
      {showEmployeeRegistrationModal && isAdmin && (
        <EmployeeRegistrationModal
          onClose={() => setShowEmployeeRegistrationModal(false)}
          onRegisterComplete={handleEmployeeRegistrationComplete}
        />
      )}

      {/* 휴가 신청 모달 */}
      {showVacationRequestModal && (
        <VacationRequestModal
          onClose={() => setShowVacationRequestModal(false)}
          onSuccess={() => {
            setShowVacationRequestModal(false);
            // 휴가 신청 성공 시 휴가 캘린더 열기
            setShowOrganizationVacationCalendar(true);
          }}
        />
      )}


      {/* 조직 휴가 캘린더 모달 */}
      {showOrganizationVacationCalendar && (
        <OrganizationVacationCalendar onClose={() => setShowOrganizationVacationCalendar(false)} />
      )}

      {/* 비밀번호 변경 모달 */}
      {showChangePasswordModal && changePasswordEmployee && (
        <ChangePasswordModal
          employeeId={changePasswordEmployee.id}
          employeeName={changePasswordEmployee.name}
          onClose={() => {
            setShowChangePasswordModal(false);
            setChangePasswordEmployee(null);
          }}
          onChangePassword={handleChangePassword}
        />
      )}
    </div>
  );
};

export default HRPage;
