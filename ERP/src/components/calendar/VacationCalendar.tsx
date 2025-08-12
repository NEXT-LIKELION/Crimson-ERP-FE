import React, { useState } from 'react';
import { FiChevronLeft, FiChevronRight, FiX } from 'react-icons/fi';
import { VacationDay, LEAVE_TYPE_OPTIONS } from '../../api/hr';

interface VacationCalendarProps {
  vacationDays: VacationDay[];
  vacationPendingDays: VacationDay[];
  onClose: () => void;
  employeeName: string;
}

const VacationCalendar: React.FC<VacationCalendarProps> = ({
  vacationDays,
  vacationPendingDays,
  onClose,
  employeeName,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const startDate = new Date(firstDayOfMonth);
  startDate.setDate(startDate.getDate() - firstDayOfMonth.getDay());

  const daysInMonth = lastDayOfMonth.getDate();
  const startDay = firstDayOfMonth.getDay();

  // 휴가 데이터를 날짜별로 그룹화
  const groupVacationsByDate = () => {
    const grouped: Record<string, VacationDay[]> = {};

    [...vacationDays, ...vacationPendingDays].forEach((vacation) => {
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
  };

  const vacationsByDate = groupVacationsByDate();

  // 휴가 유형에 따른 색상
  const getVacationColor = (leaveType: string, isPending: boolean = false) => {
    const baseColors = {
      VACATION: isPending ? 'bg-blue-200' : 'bg-blue-500',
      HALF_DAY_AM: isPending ? 'bg-green-200' : 'bg-green-500',
      HALF_DAY_PM: isPending ? 'bg-green-200' : 'bg-green-500',
      SICK: isPending ? 'bg-red-200' : 'bg-red-500',
      OTHER: isPending ? 'bg-gray-200' : 'bg-gray-500',
    };
    return (
      baseColors[leaveType as keyof typeof baseColors] ||
      (isPending ? 'bg-gray-200' : 'bg-gray-500')
    );
  };

  const getLeaveTypeLabel = (leaveType: string) => {
    const option = LEAVE_TYPE_OPTIONS.find((opt) => opt.value === leaveType);
    return option?.label || leaveType;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isPending = (vacation: VacationDay) => {
    return vacationPendingDays.includes(vacation);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(month - 1);
    } else {
      newDate.setMonth(month + 1);
    }
    setCurrentDate(newDate);
  };

  const renderCalendarDays = () => {
    const days = [];
    const koreanDays = ['일', '월', '화', '수', '목', '금', '토'];

    // 요일 헤더
    koreanDays.forEach((day) => {
      days.push(
        <div key={day} className='py-2 text-center text-sm font-medium text-gray-500'>
          {day}
        </div>
      );
    });

    // 빈 셀 (월 시작 전)
    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className='p-2'></div>);
    }

    // 실제 날짜들
    for (let date = 1; date <= daysInMonth; date++) {
      const currentDateObj = new Date(year, month, date);
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
      const dayVacations = vacationsByDate[dateKey] || [];
      const isCurrentDay = isToday(currentDateObj);

      days.push(
        <div
          key={date}
          className={`min-h-[60px] border border-gray-100 p-1 ${isCurrentDay ? 'bg-yellow-50' : ''}`}>
          <div
            className={`mb-1 text-sm font-medium ${isCurrentDay ? 'text-yellow-800' : 'text-gray-900'}`}>
            {date}
          </div>
          <div className='space-y-1'>
            {dayVacations.map((vacation, index) => (
              <div
                key={index}
                className={`rounded px-1 py-0.5 text-xs text-white ${getVacationColor(vacation.leave_type, isPending(vacation))}`}
                title={`${getLeaveTypeLabel(vacation.leave_type)}${isPending(vacation) ? ' (대기중)' : ''}`}>
                {getLeaveTypeLabel(vacation.leave_type)}
                {isPending(vacation) && ' (대기)'}
              </div>
            ))}
          </div>
        </div>
      );
    }

    return days;
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center p-4'
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={handleBackdropClick}>
      <div
        className='max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg'
        onClick={(e) => e.stopPropagation()}>
        {/* 헤더 */}
        <div className='flex items-center justify-between border-b border-gray-200 px-6 py-4'>
          <div>
            <h2 className='text-lg font-semibold text-gray-900'>{employeeName}님의 휴가 캘린더</h2>
            <p className='text-sm text-gray-500'>
              총 휴가: {vacationDays.length}건, 대기중: {vacationPendingDays.length}건
            </p>
          </div>
          <button onClick={onClose} className='text-gray-400 transition-colors hover:text-gray-600'>
            <FiX className='h-5 w-5' />
          </button>
        </div>

        {/* 월 네비게이션 */}
        <div className='flex items-center justify-between border-b border-gray-200 px-6 py-4'>
          <button
            onClick={() => navigateMonth('prev')}
            className='rounded-lg p-2 transition-colors hover:bg-gray-100'>
            <FiChevronLeft className='h-5 w-5' />
          </button>
          <h3 className='text-xl font-semibold text-gray-900'>
            {year}년 {month + 1}월
          </h3>
          <button
            onClick={() => navigateMonth('next')}
            className='rounded-lg p-2 transition-colors hover:bg-gray-100'>
            <FiChevronRight className='h-5 w-5' />
          </button>
        </div>

        {/* 범례 */}
        <div className='border-b border-gray-200 bg-gray-50 px-6 py-3'>
          <div className='flex flex-wrap gap-4 text-sm'>
            <div className='flex items-center'>
              <div className='mr-2 h-3 w-3 rounded bg-blue-500'></div>
              <span>연차</span>
            </div>
            <div className='flex items-center'>
              <div className='mr-2 h-3 w-3 rounded bg-green-500'></div>
              <span>반차</span>
            </div>
            <div className='flex items-center'>
              <div className='mr-2 h-3 w-3 rounded bg-red-500'></div>
              <span>병가</span>
            </div>
            <div className='flex items-center'>
              <div className='mr-2 h-3 w-3 rounded bg-gray-300'></div>
              <span>대기중</span>
            </div>
          </div>
        </div>

        {/* 캘린더 그리드 */}
        <div className='p-6'>
          <div className='grid grid-cols-7 gap-0 overflow-hidden rounded-lg border border-gray-200'>
            {renderCalendarDays()}
          </div>
        </div>

        {/* 푸터 */}
        <div className='border-t border-gray-200 bg-gray-50 px-6 py-4'>
          <div className='flex justify-end'>
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

export default VacationCalendar;
