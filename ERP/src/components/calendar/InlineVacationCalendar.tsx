import React, { useState, useMemo } from 'react';
import { FiChevronLeft, FiChevronRight, FiX } from 'react-icons/fi';
import { useVacations } from '../../hooks/queries/useVacations';
import { useEmployees } from '../../hooks/queries/useEmployees';
import { Vacation, EmployeeList, LEAVE_TYPE_OPTIONS } from '../../api/hr';

const InlineVacationCalendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedVacation, setSelectedVacation] = useState<Vacation | null>(null);

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
    ];
    const colorMap: Record<number, string> = {};

    employees.forEach((employee, index) => {
      colorMap[employee.id] = colors[index % colors.length];
    });

    return colorMap;
  }, [employeesData?.data]);

  // 승인된 휴가만 필터링
  const approvedVacations = useMemo(() => {
    const vacations: Vacation[] = vacationsData?.data || [];
    return vacations.filter((vacation) => vacation.status === 'APPROVED');
  }, [vacationsData?.data]);

  // 날짜별 휴가 그룹화
  const vacationsByDate = useMemo(() => {
    const grouped: Record<string, Vacation[]> = {};

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
  }, [approvedVacations]);

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

  // 날짜 포맷팅
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // 월 네비게이션
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(currentDate.getMonth() - 1);
    } else {
      newDate.setMonth(currentDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
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
          className={`max-h-[120px] min-h-[80px] border-r border-b border-gray-100 p-2 ${isToday ? 'bg-yellow-50' : 'bg-white'} overflow-y-auto`}>
          <div
            className={`mb-1 text-sm font-medium ${isToday ? 'text-yellow-800' : 'text-gray-900'}`}>
            {date}
          </div>
          <div className='space-y-1'>
            {dayVacations.slice(0, 3).map((vacation, index) => {
              const employeeColor = employeeColors[vacation.employee];
              return (
                <div
                  key={index}
                  className={`cursor-pointer rounded px-1 py-0.5 text-xs text-white transition-opacity hover:opacity-80 ${employeeColor}`}
                  title={`${getEmployeeName(vacation.employee)} - ${getLeaveTypeLabel(vacation.leave_type)}`}
                  onClick={() => setSelectedVacation(vacation)}>
                  <span className='truncate'>{getEmployeeName(vacation.employee)}</span>
                </div>
              );
            })}
            {dayVacations.length > 3 && (
              <div className='text-xs text-gray-500'>+{dayVacations.length - 3}</div>
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

  if (vacationsLoading || employeesLoading) {
    return (
      <div className='flex h-64 items-center justify-center'>
        <div className='flex flex-col items-center'>
          <div className='mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600'></div>
          <p className='font-medium text-gray-600'>휴가 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* 월 네비게이션 */}
      <div className='mb-4 flex items-center justify-between'>
        <button
          onClick={() => navigateMonth('prev')}
          className='rounded-lg p-2 transition-colors hover:bg-gray-100'>
          <FiChevronLeft className='h-5 w-5' />
        </button>
        <h3 className='text-lg font-semibold text-gray-900'>
          {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
        </h3>
        <button
          onClick={() => navigateMonth('next')}
          className='rounded-lg p-2 transition-colors hover:bg-gray-100'>
          <FiChevronRight className='h-5 w-5' />
        </button>
      </div>

      {/* 캘린더 그리드 */}
      {renderMonthlyCalendar()}

      {/* 요약 정보 */}
      <div className='mt-4 text-center text-sm text-gray-600'>
        이번 달 총 {approvedVacations.filter(vacation => {
          const vacationDate = new Date(vacation.start_date);
          return vacationDate.getFullYear() === currentDate.getFullYear() && 
                 vacationDate.getMonth() === currentDate.getMonth();
        }).length}건의 휴가가 있습니다
      </div>

      {/* 휴가 상세 모달 */}
      {selectedVacation && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center p-4'
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onClick={() => setSelectedVacation(null)}>
          <div
            className='max-w-md w-full rounded-xl border border-gray-200 bg-white shadow-lg'
            onClick={(e) => e.stopPropagation()}>
            {/* 헤더 */}
            <div className='flex items-center justify-between border-b border-gray-200 px-6 py-4'>
              <h3 className='text-lg font-semibold text-gray-900'>휴가 상세 정보</h3>
              <button 
                onClick={() => setSelectedVacation(null)}
                className='text-gray-400 transition-colors hover:text-gray-600'>
                <FiX className='h-5 w-5' />
              </button>
            </div>

            {/* 내용 */}
            <div className='p-6'>
              <div className='mb-4 flex items-center'>
                <div className={`mr-3 flex h-12 w-12 items-center justify-center rounded-lg ${employeeColors[selectedVacation.employee]} text-white text-lg font-semibold`}>
                  {getEmployeeName(selectedVacation.employee).charAt(0)}
                </div>
                <div>
                  <h4 className='text-lg font-semibold text-gray-900'>{getEmployeeName(selectedVacation.employee)}</h4>
                  <p className='text-sm text-gray-600'>{getLeaveTypeLabel(selectedVacation.leave_type)}</p>
                </div>
              </div>

              <div className='space-y-3'>
                <div>
                  <span className='text-sm font-medium text-gray-700'>기간:</span>
                  <p className='mt-1 text-sm text-gray-900'>
                    {formatDate(selectedVacation.start_date)}
                    {selectedVacation.start_date !== selectedVacation.end_date && 
                      <> ~ {formatDate(selectedVacation.end_date)}</>
                    }
                  </p>
                </div>
                
                <div>
                  <span className='text-sm font-medium text-gray-700'>사유:</span>
                  <p className='mt-1 text-sm text-gray-900'>{selectedVacation.reason}</p>
                </div>

                <div>
                  <span className='text-sm font-medium text-gray-700'>신청일:</span>
                  <p className='mt-1 text-sm text-gray-900'>{formatDate(selectedVacation.created_at)}</p>
                </div>

                <div>
                  <span className='text-sm font-medium text-gray-700'>상태:</span>
                  <p className='mt-1'>
                    <span className='inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800'>
                      {selectedVacation.status_display}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* 푸터 */}
            <div className='border-t border-gray-200 bg-gray-50 px-6 py-4'>
              <button
                onClick={() => setSelectedVacation(null)}
                className='w-full rounded-lg bg-gray-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-700'>
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InlineVacationCalendar;