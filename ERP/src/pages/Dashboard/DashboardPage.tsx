import { useState, useMemo } from 'react';
import { HiArchiveBox } from 'react-icons/hi2';
import { IoClipboard } from 'react-icons/io5';
import { IoPeopleSharp } from 'react-icons/io5';
import { FiChevronLeft, FiChevronRight, FiCalendar, FiX, FiUser, FiClock } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { useVacations } from '../../hooks/queries/useVacations';
import { useEmployees } from '../../hooks/queries/useEmployees';
import { Vacation, LEAVE_TYPE_OPTIONS, EmployeeList } from '../../api/hr';

const DashboardPage = () => {
  const { data: vacationsData, isLoading, error } = useVacations();
  const { data: employeesData } = useEmployees();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedVacation, setSelectedVacation] = useState<Vacation | null>(null);

  // 날짜별 휴가 그룹화 (취소, 대기중, 퇴사자 휴가 제외)
  const vacationsByDate = useMemo(() => {
    const grouped: Record<string, Vacation[]> = {};
    const vacations = vacationsData?.data || [];
    const employees = employeesData?.data || [];

    // 재직중인 직원 ID 목록 생성
    const activeEmployeeIds = new Set(
      employees
        .filter((emp: EmployeeList) => emp.is_active && emp.status?.toLowerCase() === 'approved')
        .map((emp: EmployeeList) => emp.id)
    );

    // 승인된 휴가 중 재직중인 직원의 휴가만 필터링
    const approvedVacations = vacations.filter(
      (vacation) => vacation.status === 'APPROVED' && activeEmployeeIds.has(vacation.employee)
    );

    approvedVacations.forEach((vacation) => {
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
  }, [vacationsData?.data, employeesData?.data]);

  // 직원 이름 가져오기
  const getEmployeeName = (employeeId: number): string => {
    const employees = employeesData?.data || [];
    const employee = employees.find((emp: EmployeeList) => emp.id === employeeId);
    return employee?.first_name || `직원 #${employeeId}`;
  };

  // 휴가 유형 라벨 가져오기
  const getLeaveTypeLabel = (leaveType: string): string => {
    const option = LEAVE_TYPE_OPTIONS.find((opt) => opt.value === leaveType);
    return option?.label || leaveType;
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

  // 월 네비게이션
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  // 달력 렌더링
  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const firstDayOfWeek = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();

    const days = [];

    // 요일 헤더
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
    weekdays.forEach((day) => {
      days.push(
        <div
          key={`header-${day}`}
          className='bg-gray-100 p-2 text-center text-xs font-medium text-gray-600'>
          {day}
        </div>
      );
    });

    // 이전 달의 빈 칸
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className='bg-gray-50 p-2'></div>);
    }

    // 이번 달의 날짜들
    for (let date = 1; date <= daysInMonth; date++) {
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
      const dayVacations = vacationsByDate[dateKey] || [];
      const isToday = new Date().toDateString() === new Date(year, month, date).toDateString();

      days.push(
        <div
          key={date}
          // Increased min-h from min-h-20 to min-h-24 to accommodate the new work assignment display layout
          className={`min-h-24 border-r border-b border-gray-200 p-1 ${isToday ? 'bg-blue-50' : 'bg-white'}`}>
          <div
            className={`mb-1 text-xs font-medium ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
            {date}
          </div>
          <div className='space-y-1'>
            {dayVacations.map((vacation, index) => {
              // 재직중인 직원인지 확인
              const employees = employeesData?.data || [];
              const employee = employees.find((emp: EmployeeList) => emp.id === vacation.employee);
              if (
                !employee ||
                !employee.is_active ||
                employee.status?.toLowerCase() !== 'approved'
              ) {
                // 퇴사한 직원의 휴가는 표시하지 않음
                return null;
              }

              const leaveTypeLabel = getLeaveTypeLabel(vacation.leave_type);
              const employeeName = getEmployeeName(vacation.employee);

              // 근무 타입인지 확인
              const isWork = vacation.leave_type === 'WORK';

              return (
                <div
                  key={`${vacation.id}-${index}`}
                  className={`flex cursor-pointer items-center justify-between rounded px-1 py-0.5 text-xs transition-opacity hover:opacity-80 ${
                    isWork
                      ? 'border-2 border-orange-400 bg-orange-50 text-orange-800'
                      : 'bg-blue-500 text-white'
                  }`}
                  title={`${employeeName} - ${leaveTypeLabel}${isWork ? ' (근무)' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedVacation(vacation);
                  }}>
                  <span className='flex-1 truncate'>{employeeName}</span>
                  <span
                    className={`ml-1 text-xs whitespace-nowrap ${isWork ? 'opacity-90' : 'opacity-75'}`}>
                    {isWork ? '💼' : '🌴'} {leaveTypeLabel}
                  </span>
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

  if (isLoading) {
    return (
      <div className='p-6'>
        <div className='flex h-64 items-center justify-center'>
          <div className='text-lg'>데이터를 불러오는 중...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='p-6'>
        <div className='flex h-64 items-center justify-center'>
          <div className='text-lg text-red-600'>데이터를 불러오는데 실패했습니다.</div>
        </div>
      </div>
    );
  }

  return (
    <div className='p-6'>
      <h1 className='mb-4 text-2xl font-bold'>대시보드</h1>
      <div className='mb-6 grid grid-cols-3 gap-4'>
        <Link to='/inventory' className='flex items-center rounded-lg bg-indigo-600 p-4 text-white'>
          <HiArchiveBox className='mr-3 h-10 w-9' />
          <div className='flex-col'>
            <h3 className='text-lg font-bold'>재고 관리</h3>
            <p>전체 상품 재고 확인 및 관리</p>
          </div>
        </Link>
        <Link to='/orders' className='flex items-center rounded-lg bg-green-600 p-4 text-white'>
          <IoClipboard className='mr-3 h-10 w-9' />
          <div className='flex-col'>
            <h3 className='text-lg font-bold'>발주 관리</h3>
            <p>발주 요청 및 승인 프로세스 관리</p>
          </div>
        </Link>
        <Link to='/hr' className='flex items-center rounded-lg bg-purple-600 p-4 text-white'>
          <IoPeopleSharp className='mr-3 h-10 w-9' />
          <div className='flex-col'>
            <h3 className='text-lg font-bold'>HR 관리</h3>
            <p>직원 정보 및 관리</p>
          </div>
        </Link>
      </div>
      <div className='mt-6 rounded-lg bg-white p-6 shadow-md'>
        <div className='space-y-4'>
          {/* 달력 헤더 */}
          <div className='flex items-center justify-between'>
            <div className='flex items-center'>
              <FiCalendar className='mr-2 h-5 w-5 text-purple-600' />
              <h3 className='text-lg font-medium text-gray-900'>
                {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
              </h3>
            </div>
            <div className='flex items-center space-x-2'>
              <button
                onClick={() => navigateMonth('prev')}
                className='flex items-center justify-center rounded-lg bg-gray-100 p-2 text-gray-600 transition-colors hover:bg-gray-200'>
                <FiChevronLeft className='h-4 w-4' />
              </button>
              <button
                onClick={() => navigateMonth('next')}
                className='flex items-center justify-center rounded-lg bg-gray-100 p-2 text-gray-600 transition-colors hover:bg-gray-200'>
                <FiChevronRight className='h-4 w-4' />
              </button>
            </div>
          </div>

          {/* 달력 */}
          {renderCalendar()}
        </div>
        <div className='mt-4 flex cursor-pointer items-center space-x-1 text-indigo-600 hover:text-indigo-800'>
          <Link to='/hr' className='flex items-center space-x-1'>
            <span className='text-sm font-medium'>HR 관리 바로가기</span>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              className='h-4 w-4'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M9 5l7 7-7 7' />
            </svg>
          </Link>
        </div>
      </div>

      {/* 상세 정보 모달 */}
      {selectedVacation && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center p-4'
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onClick={() => setSelectedVacation(null)}>
          <div
            className='w-full max-w-md rounded-lg border border-gray-200 bg-white shadow-lg'
            onClick={(e) => e.stopPropagation()}>
            {/* 헤더 */}
            <div className='flex items-center justify-between border-b border-gray-200 px-6 py-4'>
              <h2 className='text-lg font-semibold text-gray-900'>
                {selectedVacation.leave_type === 'WORK' ? '근무 상세 정보' : '휴가 상세 정보'}
              </h2>
              <button
                onClick={() => setSelectedVacation(null)}
                className='text-gray-400 transition-colors hover:text-gray-600'>
                <FiX className='h-5 w-5' />
              </button>
            </div>

            {/* 내용 */}
            <div className='p-6'>
              <div className='space-y-4'>
                {/* 직원 정보 */}
                <div className='flex items-center'>
                  <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100'>
                    <FiUser className='h-5 w-5 text-gray-600' />
                  </div>
                  <div className='ml-3'>
                    <p className='text-sm font-medium text-gray-900'>직원명</p>
                    <p className='text-sm text-gray-600'>
                      {getEmployeeName(selectedVacation.employee)}
                    </p>
                  </div>
                </div>

                {/* 휴가/근무 유형 */}
                <div className='flex items-center'>
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                      selectedVacation.leave_type === 'WORK' ? 'bg-orange-100' : 'bg-green-100'
                    }`}>
                    <FiCalendar
                      className={`h-5 w-5 ${
                        selectedVacation.leave_type === 'WORK'
                          ? 'text-orange-600'
                          : 'text-green-600'
                      }`}
                    />
                  </div>
                  <div className='ml-3'>
                    <p className='text-sm font-medium text-gray-900'>
                      {selectedVacation.leave_type === 'WORK' ? '근무 유형' : '휴가 유형'}
                    </p>
                    <p className='text-sm text-gray-600'>
                      {selectedVacation.leave_type === 'WORK' ? '💼' : '🌴'}{' '}
                      {getLeaveTypeLabel(selectedVacation.leave_type)}
                    </p>
                  </div>
                </div>

                {/* 기간 */}
                <div className='flex items-center'>
                  <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100'>
                    <FiClock className='h-5 w-5 text-blue-600' />
                  </div>
                  <div className='ml-3'>
                    <p className='text-sm font-medium text-gray-900'>
                      {selectedVacation.leave_type === 'WORK' ? '근무 기간' : '휴가 기간'}
                    </p>
                    <p className='text-sm text-gray-600'>
                      {selectedVacation.start_date} ~ {selectedVacation.end_date}
                      <span className='ml-2 font-medium text-blue-600'>
                        ({calculateVacationDays(selectedVacation)}일)
                      </span>
                    </p>
                  </div>
                </div>

                {/* 사유 */}
                {selectedVacation.reason && (
                  <div className='rounded-lg bg-gray-50 p-3'>
                    <p className='mb-1 text-sm font-medium text-gray-900'>사유</p>
                    <p className='text-sm text-gray-600'>{selectedVacation.reason}</p>
                  </div>
                )}

                {/* 신청일 */}
                <div className='border-t pt-2 text-center text-xs text-gray-500'>
                  신청일: {new Date(selectedVacation.created_at).toLocaleDateString('ko-KR')}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
