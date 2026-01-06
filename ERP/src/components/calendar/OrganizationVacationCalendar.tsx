import React, { useState, useMemo, useEffect } from 'react';
import { FiChevronLeft, FiChevronRight, FiX, FiUsers, FiFilter } from 'react-icons/fi';
import { useVacations, useReviewVacation } from '../../hooks/queries/useVacations';
import { useEmployees } from '../../hooks/queries/useEmployees';
import {
  Vacation,
  LEAVE_TYPE_OPTIONS,
  VACATION_STATUS_OPTIONS,
  VacationStatus,
  EmployeeList,
} from '../../api/hr';
import { useAuthStore } from '../../store/authStore';
import { usePermissions } from '../../hooks/usePermissions';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import StatusBadge from '../common/StatusBadge';

interface OrganizationVacationCalendarProps {
  onClose: () => void;
}

type ViewMode = 'monthly' | 'yearly';

const OrganizationVacationCalendar: React.FC<OrganizationVacationCalendarProps> = ({ onClose }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('monthly');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | ''>('');
  const [selectedLeaveType, setSelectedLeaveType] = useState<string>('');
  const [showWork, setShowWork] = useState(true); // 근무 표시 여부
  const [showManagementPanel, setShowManagementPanel] = useState(false);

  const currentUser = useAuthStore((state) => state.user);
  const permissions = usePermissions();
  const isAdmin = permissions.hasPermission('HR');

  const { data: vacationsData, isLoading: vacationsLoading } = useVacations();
  const { data: employeesData, isLoading: employeesLoading } = useEmployees();
  const reviewVacationMutation = useReviewVacation();

  // ESC 키로 모달 닫기
  useEscapeKey(onClose);

  // 관리자일 경우 '휴가/근무 관리' 패널을 기본으로 표시
  useEffect(() => {
    if (isAdmin) {
      setShowManagementPanel(true);
    }
  }, [isAdmin]);

  // 재직중인 직원별 고유 색상 생성
  const employeeColors = useMemo(() => {
    const employees = employeesData?.data || [];
    // 재직중인 직원만 필터링
    const activeEmployees = employees.filter(
      (emp) => emp.is_active && emp.status?.toLowerCase() === 'approved'
    );
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-red-500',
      'bg-yellow-500',
      'bg-indigo-500',
      'bg-pink-500',
      'bg-teal-500',
      'bg-orange-500',
      'bg-cyan-500',
      'bg-lime-500',
      'bg-rose-500',
      'bg-emerald-500',
      'bg-violet-500',
      'bg-amber-500',
    ];
    const colorMap: Record<number, string> = {};

    activeEmployees.forEach((employee, index) => {
      colorMap[employee.id] = colors[index % colors.length];
    });

    return colorMap;
  }, [employeesData?.data]);

  // 필터링된 휴가 데이터
  const filteredVacations = useMemo(() => {
    const vacations: Vacation[] = vacationsData?.data || [];
    const employees = employeesData?.data || [];

    // 재직중인 직원 ID 목록 생성
    const activeEmployeeIds = new Set(
      employees
        .filter((emp) => emp.is_active && emp.status?.toLowerCase() === 'approved')
        .map((emp) => emp.id)
    );

    const filtered = vacations.filter((vacation) => {
      // 퇴사한 직원의 휴가는 제외
      if (!activeEmployeeIds.has(vacation.employee)) {
        return false;
      }

      // 관리 패널이 아닌 경우 (캘린더 보기)에는 승인된 휴가만 표시
      if (!showManagementPanel) {
        // 캘린더에서는 승인된 휴가만 표시
        if (vacation.status !== 'APPROVED') {
          return false;
        }
      } else {
        // 관리 패널에서는 취소된 휴가만 제외 (거절된 휴가는 표시)
        if (vacation.status === 'CANCELLED') {
          return false;
        }
      }

      const employeeMatch = selectedEmployeeId === '' || vacation.employee === selectedEmployeeId;

      // 휴가 유형 필터 (WORK 제외)
      const leaveTypeMatch = selectedLeaveType === '' || vacation.leave_type === selectedLeaveType;

      // 근무 표시 필터
      const isWork = vacation.leave_type === 'WORK';
      const workMatch = showWork || !isWork; // showWork가 false면 근무(WORK)는 제외

      // 일반 직원인 경우: 관리 패널에서만 본인 휴가만 보기, 캘린더 뷰에서는 전체 조직 휴가 보기
      if (!isAdmin && showManagementPanel) {
        const currentUserId = Number(currentUser?.id);
        const vacationEmployeeId = Number(vacation.employee);
        const isMyVacation =
          !isNaN(currentUserId) &&
          !isNaN(vacationEmployeeId) &&
          vacationEmployeeId === currentUserId;
        return employeeMatch && leaveTypeMatch && workMatch && isMyVacation;
      }

      return employeeMatch && leaveTypeMatch && workMatch;
    });

    return filtered;
  }, [
    vacationsData?.data,
    employeesData?.data,
    selectedEmployeeId,
    selectedLeaveType,
    showWork,
    showManagementPanel,
    isAdmin,
    currentUser?.id,
  ]);

  // 날짜별 휴가 그룹화
  const vacationsByDate = useMemo(() => {
    const grouped: Record<string, Vacation[]> = {};

    filteredVacations.forEach((vacation) => {
      const start = new Date(vacation.start_date);
      const end = new Date(vacation.end_date);

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(vacation);
      }
    });

    return grouped;
  }, [filteredVacations]);

  // 휴가 유형 라벨 가져오기
  const getLeaveTypeLabel = (leaveType: string): string => {
    const option = LEAVE_TYPE_OPTIONS.find((opt) => opt.value === leaveType);
    return option?.label || leaveType;
  };

  // 근무/휴가 타입에 따른 스타일 결정
  const getVacationTypeStyle = (leaveType: string) => {
    if (leaveType === 'WORK') {
      return {
        className: 'border-2 border-orange-400 bg-orange-50 text-orange-800',
      };
    }
    return {
      className: '',
    };
  };

  // 직원 이름 가져오기
  const getEmployeeName = (employeeId: number): string => {
    const employees = employeesData?.data || [];
    const employee = employees.find((emp: EmployeeList) => emp.id === employeeId);
    return employee?.first_name || `직원 #${employeeId}`;
  };

  // 날짜 포맷팅
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
    });
  };

  // 월 네비게이션
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      if (viewMode === 'monthly') {
        newDate.setMonth(currentDate.getMonth() - 1);
      } else {
        newDate.setFullYear(currentDate.getFullYear() - 1);
      }
    } else {
      if (viewMode === 'monthly') {
        newDate.setMonth(currentDate.getMonth() + 1);
      } else {
        newDate.setFullYear(currentDate.getFullYear() + 1);
      }
    }
    setCurrentDate(newDate);
  };

  // 휴가 상태 변경
  const handleStatusChange = async (vacationId: number, newStatus: VacationStatus) => {
    if (!isAdmin && newStatus !== 'CANCELLED') {
      alert('권한이 없습니다.');
      return;
    }

    try {
      await reviewVacationMutation.mutateAsync({ vacationId, status: newStatus });

      // 자연스러운 메시지로 변경
      let message = '';
      switch (newStatus) {
        case 'APPROVED':
          message = '휴가가 승인되었습니다.';
          break;
        case 'REJECTED':
          message = '휴가가 거절되었습니다.';
          break;
        case 'CANCELLED':
          message = '휴가가 취소되었습니다.';
          break;
        default: {
          const statusText = VACATION_STATUS_OPTIONS.find((opt) => opt.value === newStatus)?.label;
          message = `휴가 상태가 "${statusText}"로 변경되었습니다.`;
        }
      }
      alert(message);
    } catch (error: unknown) {
      console.error('휴가 상태 변경 실패:', error);
      alert('상태 변경에 실패했습니다.');
    }
  };

  // 휴가 일수 계산 (반차는 0.5일)
  const calculateVacationDays = (vacation: Vacation): number => {
    if (vacation.leave_type === 'HALF_DAY_AM' || vacation.leave_type === 'HALF_DAY_PM') {
      return 0.5;
    }

    const startDate = new Date(vacation.start_date);
    const endDate = new Date(vacation.end_date);
    const timeDiff = endDate.getTime() - startDate.getTime();
    const dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
    return dayDiff;
  };

  // 상태 뱃지 색상 가져오기
  const getStatusBadgeTheme = (
    status: VacationStatus
  ): 'pending' | 'active' | 'rejected' | 'neutral' => {
    switch (status) {
      case 'PENDING':
        return 'pending';
      case 'APPROVED':
        return 'active';
      case 'REJECTED':
        return 'rejected';
      case 'CANCELLED':
        return 'neutral';
      default:
        return 'neutral';
    }
  };

  // 월간 캘린더 렌더링
  const renderMonthlyCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const startDay = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();

    const days = [];
    const koreanDays = ['일', '월', '화', '수', '목', '금', '토'];

    // 요일 헤더
    koreanDays.forEach((day) => {
      days.push(
        <div key={day} className='border-b py-3 text-center text-sm font-medium text-gray-500'>
          {day}
        </div>
      );
    });

    // 빈 셀 (월 시작 전)
    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className='border-r border-b border-gray-100 p-2'></div>);
    }

    // 실제 날짜들
    for (let date = 1; date <= daysInMonth; date++) {
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
      const dayVacations = vacationsByDate[dateKey] || [];
      const isToday = new Date().toDateString() === new Date(year, month, date).toDateString();

      // 휴가와 근무 분리
      const vacationsOnly = dayVacations.filter((v) => v.leave_type !== 'WORK');
      const workOnly = dayVacations.filter((v) => v.leave_type === 'WORK');

      days.push(
        <div
          key={date}
          className={`max-h-[200px] min-h-[140px] border-r border-b border-gray-100 p-2 ${isToday ? 'bg-yellow-50' : 'bg-white'} overflow-y-auto`}>
          <div
            className={`mb-2 text-sm font-medium ${isToday ? 'text-yellow-800' : 'text-gray-900'}`}>
            {date}
          </div>
          <div className='space-y-2'>
            {/* 휴가 표시 */}
            {vacationsOnly.length > 0 && (
              <div className='space-y-1'>
                {vacationsOnly.map((vacation, index) => {
                  const employeeColor = employeeColors[vacation.employee];
                  const leaveTypeLabel = getLeaveTypeLabel(vacation.leave_type);

                  return (
                    <div
                      key={index}
                      className={`flex items-center justify-between rounded px-2 py-1 text-xs text-white ${employeeColor}`}
                      title={`${getEmployeeName(vacation.employee)} - ${leaveTypeLabel}`}>
                      <span className='mr-1 flex-1 truncate'>
                        {getEmployeeName(vacation.employee)}
                      </span>
                      <span className='text-xs whitespace-nowrap opacity-75'>{leaveTypeLabel}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 근무 표시 (구분선 포함) */}
            {workOnly.length > 0 && (
              <div className='space-y-1'>
                {vacationsOnly.length > 0 && (
                  <div className='my-1 border-t border-orange-200'></div>
                )}
                {workOnly.map((vacation, index) => {
                  const typeStyle = getVacationTypeStyle(vacation.leave_type);

                  return (
                    <div
                      key={index}
                      className={`flex items-center justify-between rounded px-2 py-1 text-xs ${typeStyle.className}`}
                      title={`${getEmployeeName(vacation.employee)} - 근무`}>
                      <span className='mr-1 flex-1 truncate'>
                        {getEmployeeName(vacation.employee)}
                      </span>
                      <span className='text-xs whitespace-nowrap opacity-90'>근무</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className='grid grid-cols-7 gap-0 overflow-hidden rounded-lg border border-gray-200'>
        {days}
      </div>
    );
  };

  // 월 클릭 핸들러
  const handleMonthClick = (month: number) => {
    const newDate = new Date(currentDate.getFullYear(), month, 1);
    setCurrentDate(newDate);
    setViewMode('monthly');
  };

  // 연간 뷰 렌더링 (월별 요약)
  const renderYearlyView = () => {
    const year = currentDate.getFullYear();
    const months = [];

    for (let month = 0; month < 12; month++) {
      const monthVacations = filteredVacations.filter((vacation) => {
        const vacationDate = new Date(vacation.start_date);
        return vacationDate.getFullYear() === year && vacationDate.getMonth() === month;
      });

      // 휴가와 근무 분리
      const vacationOnly = monthVacations.filter((v) => v.leave_type !== 'WORK');
      const workOnly = monthVacations.filter((v) => v.leave_type === 'WORK');

      months.push(
        <div
          key={month}
          className='cursor-pointer rounded-lg border border-gray-200 bg-white p-4 transition-all duration-200 hover:border-blue-300 hover:shadow-md'
          onClick={() => handleMonthClick(month)}>
          <h3 className='mb-3 font-semibold text-gray-900 transition-colors hover:text-blue-600'>
            {month + 1}월
          </h3>
          <div className='space-y-3'>
            {/* 휴가 섹션 */}
            <div className='space-y-1'>
              <div className='text-sm font-medium text-blue-600'>휴가: {vacationOnly.length}건</div>
              <div className='space-y-1'>
                {vacationOnly.slice(0, 3).map((vacation, index) => {
                  const employeeColor = employeeColors[vacation.employee];

                  return (
                    <div key={index} className='flex items-center space-x-2'>
                      <div className={`h-3 w-3 rounded ${employeeColor}`}></div>
                      <span className='truncate text-xs text-gray-700'>
                        {getEmployeeName(vacation.employee)} -{' '}
                        {getLeaveTypeLabel(vacation.leave_type)}
                      </span>
                    </div>
                  );
                })}
                {vacationOnly.length > 3 && (
                  <div className='text-xs text-gray-500'>+{vacationOnly.length - 3}건 더</div>
                )}
              </div>
            </div>

            {/* 근무 섹션 */}
            {workOnly.length > 0 && (
              <div className='space-y-1 border-t border-gray-100 pt-2'>
                <div className='text-sm font-medium text-orange-600'>근무: {workOnly.length}건</div>
                <div className='space-y-1'>
                  {workOnly.slice(0, 2).map((vacation, index) => {
                    return (
                      <div key={index} className='flex items-center space-x-2'>
                        <div className='h-3 w-3 rounded border-2 border-orange-400 bg-orange-100'></div>
                        <span className='truncate text-xs text-gray-700'>
                          {getEmployeeName(vacation.employee)}
                        </span>
                      </div>
                    );
                  })}
                  {workOnly.length > 2 && (
                    <div className='text-xs text-gray-500'>+{workOnly.length - 2}건 더</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    return <div className='grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4'>{months}</div>;
  };

  // 관리 패널 렌더링
  const renderManagementPanel = () => {
    const formatDate = (dateString: string): string => {
      const date = new Date(dateString);
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    };

    return (
      <div className='space-y-4'>
        {filteredVacations.length === 0 ? (
          <div className='py-12 text-center'>
            <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100'>
              <FiUsers className='h-8 w-8 text-gray-400' />
            </div>
            <h3 className='mb-2 text-lg font-semibold text-gray-900'>휴가 신청 내역이 없습니다</h3>
            <p className='text-gray-600'>조건에 맞는 휴가 신청이 없습니다.</p>
          </div>
        ) : (
          <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
            {filteredVacations.map((vacation) => {
              const isOwner = currentUser?.id === vacation.employee;
              const canCancel = isOwner && vacation.status === 'PENDING';
              const canApprove = isAdmin && vacation.status === 'PENDING';
              const isWork = vacation.leave_type === 'WORK';

              return (
                <div
                  key={vacation.id}
                  className='rounded-lg border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md'>
                  <div className='mb-3 flex items-start justify-between'>
                    <div className='flex items-center'>
                      <div
                        className={`mr-3 flex h-10 w-10 items-center justify-center rounded-lg ${
                          isWork
                            ? 'border-2 border-orange-400 bg-orange-50 text-orange-600'
                            : `${employeeColors[vacation.employee]} text-white`
                        } text-sm font-semibold`}>
                        {isWork ? (
                          <span className='text-orange-600'>근</span>
                        ) : (
                          <span className='text-white'>
                            {getEmployeeName(vacation.employee).charAt(0)}
                          </span>
                        )}
                      </div>
                      <div>
                        <h3 className='font-semibold text-gray-900'>
                          {getEmployeeName(vacation.employee)}
                        </h3>
                        <p className='text-sm text-gray-600'>
                          {getLeaveTypeLabel(vacation.leave_type)}
                        </p>
                      </div>
                    </div>
                    <StatusBadge
                      text={vacation.status_display}
                      theme={getStatusBadgeTheme(vacation.status)}
                    />
                  </div>

                  <div className='mb-4 space-y-2'>
                    <div className='text-sm text-gray-600'>
                      <strong>기간:</strong> {formatDate(vacation.start_date)}
                      {vacation.start_date !== vacation.end_date && (
                        <> ~ {formatDate(vacation.end_date)}</>
                      )}
                      <span className='ml-2 font-medium text-blue-600'>
                        ({calculateVacationDays(vacation)}일)
                      </span>
                    </div>
                    <div className='text-sm text-gray-600'>
                      <strong>사유:</strong> {vacation.reason}
                    </div>
                    <div className='text-sm text-gray-600'>
                      <strong>신청일:</strong> {formatDate(vacation.created_at)}
                    </div>
                    {vacation.reviewed_at && (
                      <div className='text-sm text-gray-600'>
                        <strong>처리일:</strong> {formatDate(vacation.reviewed_at)}
                      </div>
                    )}
                  </div>

                  {/* 액션 버튼 */}
                  <div className='flex gap-2'>
                    {canApprove && (
                      <>
                        <button
                          onClick={() => handleStatusChange(vacation.id, 'APPROVED')}
                          disabled={reviewVacationMutation.isPending}
                          className='flex flex-1 items-center justify-center rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm font-medium text-green-700 transition-all duration-200 hover:border-green-300 hover:bg-green-100 disabled:opacity-50'>
                          승인
                        </button>
                        <button
                          onClick={() => handleStatusChange(vacation.id, 'REJECTED')}
                          disabled={reviewVacationMutation.isPending}
                          className='flex flex-1 items-center justify-center rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition-all duration-200 hover:border-red-300 hover:bg-red-100 disabled:opacity-50'>
                          거절
                        </button>
                      </>
                    )}

                    {canCancel && (
                      <button
                        onClick={() => handleStatusChange(vacation.id, 'CANCELLED')}
                        disabled={reviewVacationMutation.isPending}
                        className='flex flex-1 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700 transition-all duration-200 hover:border-gray-300 hover:bg-gray-100 disabled:opacity-50'>
                        취소
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // 배경 클릭 시 모달 닫기
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (vacationsLoading || employeesLoading) {
    return (
      <div
        className='fixed inset-0 z-50 flex items-center justify-center p-4'
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        onClick={handleBackdropClick}>
        <div className='w-full max-w-6xl rounded-xl border border-gray-200 bg-white p-6 shadow-lg'>
          <div className='flex h-64 items-center justify-center'>
            <div className='flex flex-col items-center'>
              <div className='mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600'></div>
              <p className='font-medium text-gray-600'>조직 일정 정보를 불러오는 중...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center p-4'
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={handleBackdropClick}>
      <div
        className='flex max-h-[95vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg'
        onClick={(e) => e.stopPropagation()}>
        {/* 헤더 */}
        <div className='flex items-center justify-between border-b border-gray-200 px-6 py-4'>
          <div className='flex items-center'>
            <div className='mr-3 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100'>
              <FiUsers className='h-5 w-5 text-blue-600' />
            </div>
            <div>
              <h2 className='text-lg font-semibold text-gray-900'>
                {showManagementPanel
                  ? isAdmin
                    ? '휴가/근무 관리'
                    : '내 휴가 관리'
                  : '조직 일정 캘린더'}
              </h2>
              <p className='text-sm text-gray-500'>
                {showManagementPanel
                  ? `총 ${filteredVacations.length}건의 일정이 있습니다`
                  : '전체 조직의 승인된 휴가 및 근무 일정을 확인하세요'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className='text-gray-400 transition-colors hover:text-gray-600'>
            <FiX className='h-5 w-5' />
          </button>
        </div>

        {/* 컨트롤 바 */}
        <div className='border-b border-gray-200 bg-gray-50 px-6 py-4'>
          <div className='mb-4 flex items-center justify-between'>
            {/* 탭 네비게이션 */}
            <div className='flex items-center space-x-1'>
              {/* 캘린더 섹션 */}
              <div className='flex rounded-lg border border-gray-200 bg-white shadow-sm'>
                <button
                  onClick={() => {
                    setShowManagementPanel(false);
                    setViewMode('monthly');
                  }}
                  className={`rounded-l-lg border-r border-gray-200 px-4 py-2 text-sm font-medium transition-all duration-200 ${
                    !showManagementPanel && viewMode === 'monthly'
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                  }`}>
                  📅 월간 캘린더
                </button>
                <button
                  onClick={() => {
                    setShowManagementPanel(false);
                    setViewMode('yearly');
                  }}
                  className={`rounded-r-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
                    !showManagementPanel && viewMode === 'yearly'
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                  }`}>
                  📊 연간 캘린더
                </button>
              </div>

              {/* 구분선 */}
              <div className='h-8 w-px bg-gray-300'></div>

              {/* 관리 섹션 */}
              <div className='flex rounded-lg border border-gray-200 bg-white shadow-sm'>
                <button
                  onClick={() => setShowManagementPanel(true)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
                    showManagementPanel
                      ? 'bg-indigo-500 text-white shadow-sm'
                      : 'text-gray-600 hover:bg-indigo-50 hover:text-indigo-600'
                  }`}>
                  📋 {isAdmin ? '휴가/근무 관리' : '내 휴가 관리'}
                </button>
              </div>
            </div>

            {/* 날짜 네비게이션 (관리 패널이 아닐 때만 표시) */}
            {!showManagementPanel && (
              <div className='flex items-center space-x-4'>
                <button
                  onClick={() => navigateMonth('prev')}
                  className='rounded-lg p-2 transition-colors hover:bg-white'>
                  <FiChevronLeft className='h-5 w-5' />
                </button>
                <h3 className='min-w-[120px] text-center text-lg font-semibold text-gray-900'>
                  {viewMode === 'monthly'
                    ? formatDate(currentDate)
                    : `${currentDate.getFullYear()}년`}
                </h3>
                <button
                  onClick={() => navigateMonth('next')}
                  className='rounded-lg p-2 transition-colors hover:bg-white'>
                  <FiChevronRight className='h-5 w-5' />
                </button>
              </div>
            )}

            <div className='flex items-center space-x-2'>
              <FiFilter className='h-4 w-4 text-gray-500' />
              <span className='text-sm text-gray-600'>{filteredVacations.length}건 표시됨</span>
            </div>
          </div>

          {/* 필터 영역 */}
          <div
            className={`grid grid-cols-1 gap-4 ${isAdmin || !showManagementPanel ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
            {/* 직원 필터 - 관리자는 항상 표시, 일반직원은 캘린더 뷰에서만 표시 */}
            {(isAdmin || !showManagementPanel) && (
              <div>
                <label className='mb-1 block text-sm font-medium text-gray-700'>
                  직원 선택
                  {!isAdmin && <span className='ml-1 text-xs text-gray-500'>(캘린더 뷰 전용)</span>}
                </label>
                <select
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(Number(e.target.value) || '')}
                  disabled={!isAdmin && showManagementPanel}
                  className='w-full rounded-lg border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none'>
                  <option value=''>전체 직원</option>
                  {(employeesData?.data || [])
                    .filter((emp) => emp.is_active && emp.status?.toLowerCase() === 'approved')
                    .map((employee: EmployeeList) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.first_name}
                      </option>
                    ))}
                </select>
              </div>
            )}

            {/* 휴가 유형 필터 */}
            <div>
              <label className='mb-1 block text-sm font-medium text-gray-700'>휴가 유형</label>
              <select
                value={selectedLeaveType}
                onChange={(e) => setSelectedLeaveType(e.target.value)}
                className='w-full rounded-lg border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none'>
                <option value=''>전체 휴가 유형</option>
                {LEAVE_TYPE_OPTIONS.filter((option) => option.value !== 'WORK').map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 근무 표시 필터 */}
            <div>
              <label className='mb-1 block text-sm font-medium text-gray-700'>근무 일정</label>
              <div className='flex h-[42px] items-center rounded-lg border border-gray-200 bg-white px-3 py-2'>
                <input
                  type='checkbox'
                  id='showWork'
                  checked={showWork}
                  onChange={(e) => setShowWork(e.target.checked)}
                  className='h-4 w-4 cursor-pointer rounded border-gray-300 text-orange-600 focus:ring-2 focus:ring-orange-500'
                />
                <label
                  htmlFor='showWork'
                  className='ml-2 cursor-pointer text-sm text-gray-700 select-none'>
                  근무 일정 표시
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* 캘린더 콘텐츠 */}
        <div className='flex-1 overflow-y-auto p-6'>
          {showManagementPanel
            ? renderManagementPanel()
            : viewMode === 'monthly'
              ? renderMonthlyCalendar()
              : renderYearlyView()}
        </div>

        {/* 푸터 */}
        <div className='border-t border-gray-200 bg-gray-50 px-6 py-4'>
          <div className='flex items-center justify-between'>
            <div className='text-sm text-gray-600'>
              전체 {filteredVacations.length}건의 일정이 표시되고 있습니다
            </div>
            <button
              onClick={onClose}
              className='rounded-lg bg-gray-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-700'>
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizationVacationCalendar;
