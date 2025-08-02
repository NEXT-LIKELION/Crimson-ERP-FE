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
    employeeName
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
        
        [...vacationDays, ...vacationPendingDays].forEach(vacation => {
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
            'VACATION': isPending ? 'bg-blue-200' : 'bg-blue-500',
            'HALF_DAY_AM': isPending ? 'bg-green-200' : 'bg-green-500',
            'HALF_DAY_PM': isPending ? 'bg-green-200' : 'bg-green-500',
            'SICK': isPending ? 'bg-red-200' : 'bg-red-500',
            'OTHER': isPending ? 'bg-gray-200' : 'bg-gray-500',
        };
        return baseColors[leaveType as keyof typeof baseColors] || (isPending ? 'bg-gray-200' : 'bg-gray-500');
    };
    
    const getLeaveTypeLabel = (leaveType: string) => {
        const option = LEAVE_TYPE_OPTIONS.find(opt => opt.value === leaveType);
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
        koreanDays.forEach(day => {
            days.push(
                <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                    {day}
                </div>
            );
        });
        
        // 빈 셀 (월 시작 전)
        for (let i = 0; i < startDay; i++) {
            days.push(<div key={`empty-${i}`} className="p-2"></div>);
        }
        
        // 실제 날짜들
        for (let date = 1; date <= daysInMonth; date++) {
            const currentDateObj = new Date(year, month, date);
            const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
            const dayVacations = vacationsByDate[dateKey] || [];
            const isCurrentDay = isToday(currentDateObj);
            
            days.push(
                <div key={date} className={`p-1 min-h-[60px] border border-gray-100 ${isCurrentDay ? 'bg-yellow-50' : ''}`}>
                    <div className={`text-sm font-medium mb-1 ${isCurrentDay ? 'text-yellow-800' : 'text-gray-900'}`}>
                        {date}
                    </div>
                    <div className="space-y-1">
                        {dayVacations.map((vacation, index) => (
                            <div
                                key={index}
                                className={`text-xs px-1 py-0.5 rounded text-white ${getVacationColor(vacation.leave_type, isPending(vacation))}`}
                                title={`${getLeaveTypeLabel(vacation.leave_type)}${isPending(vacation) ? ' (대기중)' : ''}`}
                            >
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
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
            onClick={handleBackdropClick}
        >
            <div
                className="w-full max-w-4xl bg-white rounded-xl shadow-lg border border-gray-200 max-h-[90vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* 헤더 */}
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">{employeeName}님의 휴가 캘린더</h2>
                        <p className="text-sm text-gray-500">
                            총 휴가: {vacationDays.length}건, 대기중: {vacationPendingDays.length}건
                        </p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <FiX className="w-5 h-5" />
                    </button>
                </div>
                
                {/* 월 네비게이션 */}
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <button
                        onClick={() => navigateMonth('prev')}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <FiChevronLeft className="w-5 h-5" />
                    </button>
                    <h3 className="text-xl font-semibold text-gray-900">
                        {year}년 {month + 1}월
                    </h3>
                    <button
                        onClick={() => navigateMonth('next')}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <FiChevronRight className="w-5 h-5" />
                    </button>
                </div>
                
                {/* 범례 */}
                <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
                    <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center">
                            <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
                            <span>연차</span>
                        </div>
                        <div className="flex items-center">
                            <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
                            <span>반차</span>
                        </div>
                        <div className="flex items-center">
                            <div className="w-3 h-3 bg-red-500 rounded mr-2"></div>
                            <span>병가</span>
                        </div>
                        <div className="flex items-center">
                            <div className="w-3 h-3 bg-gray-300 rounded mr-2"></div>
                            <span>대기중</span>
                        </div>
                    </div>
                </div>
                
                {/* 캘린더 그리드 */}
                <div className="p-6">
                    <div className="grid grid-cols-7 gap-0 border border-gray-200 rounded-lg overflow-hidden">
                        {renderCalendarDays()}
                    </div>
                </div>
                
                {/* 푸터 */}
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                    <div className="flex justify-end">
                        <button
                            onClick={onClose}
                            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
                        >
                            닫기
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VacationCalendar;