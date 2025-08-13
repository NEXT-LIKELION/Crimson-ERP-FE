import React, { useState, useMemo } from 'react';
import { FiChevronLeft, FiChevronRight, FiX, FiUsers, FiFilter } from 'react-icons/fi';
import { useVacations } from '../../hooks/queries/useVacations';
import { useEmployees } from '../../hooks/queries/useEmployees';
import {
  Vacation,
  LEAVE_TYPE_OPTIONS,
  VACATION_STATUS_OPTIONS,
  VacationStatus,
  EmployeeList,
} from '../../api/hr';

interface OrganizationVacationCalendarProps {
  onClose: () => void;
}

type ViewMode = 'monthly' | 'yearly';

const OrganizationVacationCalendar: React.FC<OrganizationVacationCalendarProps> = ({ onClose }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('monthly');
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<number[]>([]);
  const [selectedLeaveType, setSelectedLeaveType] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<VacationStatus | ''>('');

  const { data: vacationsData, isLoading: vacationsLoading } = useVacations();
  const { data: employeesData, isLoading: employeesLoading } = useEmployees();

  // 직원별 고유 색상 생성
  const employeeColors = useMemo(() => {
    const employees = employeesData?.data || [];
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

    employees.forEach((employee, index) => {
      colorMap[employee.id] = colors[index % colors.length];
    });

    return colorMap;
  }, [employeesData?.data]);

  // 필터링된 휴가 데이터 (취소/거절된 건 제외)
  const filteredVacations = useMemo(() => {
    const vacations: Vacation[] = vacationsData?.data || [];
    return vacations.filter((vacation) => {
      // 취소/거절된 휴가는 표시하지 않음
      if (vacation.status === 'CANCELLED' || vacation.status === 'REJECTED') {
        return false;
      }

      const employeeMatch =
        selectedEmployeeIds.length === 0 || selectedEmployeeIds.includes(vacation.employee);
      const leaveTypeMatch = selectedLeaveType === '' || vacation.leave_type === selectedLeaveType;
      const statusMatch = selectedStatus === '' || vacation.status === selectedStatus;

      return employeeMatch && leaveTypeMatch && statusMatch;
    });
  }, [vacationsData?.data, selectedEmployeeIds, selectedLeaveType, selectedStatus]);

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

  // 직원 선택 토글
  const toggleEmployeeSelection = (employeeId: number) => {
    setSelectedEmployeeIds((prev) =>
      prev.includes(employeeId) ? prev.filter((id) => id !== employeeId) : [...prev, employeeId]
    );
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

      days.push(
        <div
          key={date}
          className={`max-h-[200px] min-h-[140px] border-r border-b border-gray-100 p-2 ${isToday ? 'bg-yellow-50' : 'bg-white'} overflow-y-auto`}>
          <div
            className={`mb-2 text-sm font-medium ${isToday ? 'text-yellow-800' : 'text-gray-900'}`}>
            {date}
          </div>
          <div className='space-y-1'>
            {dayVacations.map((vacation, index) => {
              const employeeColor = employeeColors[vacation.employee];
              const leaveTypeLabel = getLeaveTypeLabel(vacation.leave_type);
              return (
                <div
                  key={index}
                  className={`rounded px-2 py-1 text-xs text-white ${employeeColor} flex items-center justify-between`}
                  title={`${getEmployeeName(vacation.employee)} - ${leaveTypeLabel}`}>
                  <span className='mr-1 flex-1 truncate'>{getEmployeeName(vacation.employee)}</span>
                  <span className='text-xs whitespace-nowrap opacity-75'>{leaveTypeLabel}</span>
                </div>
              );
            })}
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

      months.push(
        <div
          key={month}
          className='cursor-pointer rounded-lg border border-gray-200 bg-white p-4 transition-all duration-200 hover:border-blue-300 hover:shadow-md'
          onClick={() => handleMonthClick(month)}>
          <h3 className='mb-3 font-semibold text-gray-900 transition-colors hover:text-blue-600'>
            {month + 1}월
          </h3>
          <div className='space-y-2'>
            <div className='text-sm text-gray-600'>총 휴가: {monthVacations.length}건</div>
            <div className='space-y-1'>
              {monthVacations.slice(0, 5).map((vacation, index) => {
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
              {monthVacations.length > 5 && (
                <div className='text-xs text-gray-500'>+{monthVacations.length - 5}건 더</div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return <div className='grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4'>{months}</div>;
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
              <p className='font-medium text-gray-600'>조직 휴가 정보를 불러오는 중...</p>
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
              <h2 className='text-lg font-semibold text-gray-900'>조직 휴가 캘린더</h2>
              <p className='text-sm text-gray-500'>전체 직원의 휴가 현황을 확인하세요</p>
            </div>
          </div>
          <button onClick={onClose} className='text-gray-400 transition-colors hover:text-gray-600'>
            <FiX className='h-5 w-5' />
          </button>
        </div>

        {/* 컨트롤 바 */}
        <div className='border-b border-gray-200 bg-gray-50 px-6 py-4'>
          <div className='mb-4 flex items-center justify-between'>
            {/* 뷰 모드 토글 */}
            <div className='flex rounded-lg border border-gray-200 bg-white p-1'>
              <button
                onClick={() => setViewMode('monthly')}
                className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  viewMode === 'monthly'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}>
                월간
              </button>
              <button
                onClick={() => setViewMode('yearly')}
                className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  viewMode === 'yearly'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}>
                연간
              </button>
            </div>

            {/* 날짜 네비게이션 */}
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

            <div className='flex items-center space-x-2'>
              <FiFilter className='h-4 w-4 text-gray-500' />
              <span className='text-sm text-gray-600'>{filteredVacations.length}건 표시됨</span>
            </div>
          </div>

          {/* 필터 영역 */}
          <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
            {/* 직원 필터 */}
            <div>
              <label className='mb-1 block text-sm font-medium text-gray-700'>직원 선택</label>
              <div className='max-h-24 overflow-y-auto rounded-lg border border-gray-200 bg-white p-2'>
                {(employeesData?.data || []).slice(0, 10).map((employee: EmployeeList) => (
                  <label key={employee.id} className='flex items-center space-x-2 py-1'>
                    <input
                      type='checkbox'
                      checked={selectedEmployeeIds.includes(employee.id)}
                      onChange={() => toggleEmployeeSelection(employee.id)}
                      className='rounded border-gray-300'
                    />
                    <div className={`h-3 w-3 rounded ${employeeColors[employee.id]}`}></div>
                    <span className='text-sm text-gray-700'>{employee.first_name}</span>
                  </label>
                ))}
                {(employeesData?.data || []).length > 10 && (
                  <div className='py-1 text-xs text-gray-500'>+{(employeesData?.data || []).length - 10}명 더...</div>
                )}
              </div>
            </div>

            {/* 휴가 유형 필터 */}
            <div>
              <label className='mb-1 block text-sm font-medium text-gray-700'>휴가 유형</label>
              <select
                value={selectedLeaveType}
                onChange={(e) => setSelectedLeaveType(e.target.value)}
                className='w-full rounded-lg border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none'>
                <option value=''>전체 유형</option>
                {LEAVE_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 상태 필터 */}
            <div>
              <label className='mb-1 block text-sm font-medium text-gray-700'>상태</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as VacationStatus | '')}
                className='w-full rounded-lg border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none'>
                <option value=''>전체 상태</option>
                {VACATION_STATUS_OPTIONS.filter(
                  (option) => option.value !== 'CANCELLED' && option.value !== 'REJECTED'
                ).map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 캘린더 콘텐츠 */}
        <div className='flex-1 overflow-y-auto p-6'>
          {viewMode === 'monthly' ? renderMonthlyCalendar() : renderYearlyView()}
        </div>

        {/* 푸터 */}
        <div className='border-t border-gray-200 bg-gray-50 px-6 py-4'>
          <div className='flex items-center justify-between'>
            <div className='text-sm text-gray-600'>
              전체 {filteredVacations.length}건의 휴가가 표시되고 있습니다
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
