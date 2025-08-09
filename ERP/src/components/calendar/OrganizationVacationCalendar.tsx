import React, { useState, useMemo } from 'react';
import { FiChevronLeft, FiChevronRight, FiX, FiUsers, FiEye, FiCalendar } from 'react-icons/fi';
import { LEAVE_TYPE_OPTIONS, Vacation } from '../../api/hr';
import { useAuthStore } from '../../store/authStore';
import StatusBadge from '../common/StatusBadge';

interface OrganizationVacationCalendarProps {
    onClose: () => void;
    allVacations: Vacation[]; // 전체 직원 휴가 데이터
    employees: Array<{ id: number; name: string; position: string }>; // 직원 목록
}

interface DayVacationDetail {
    vacation: Vacation;
    employee: { id: number; name: string; position: string };
}

const OrganizationVacationCalendar: React.FC<OrganizationVacationCalendarProps> = ({
    onClose,
    allVacations,
    employees
}) => {
    // 현재 사용자 정보 (필요시 사용 예정)
    // const currentUser = useAuthStore((state) => state.user);
    // const isAdmin = currentUser?.role === 'MANAGER';
    
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewType, setViewType] = useState<'month' | 'year'>('month');
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | ''>('');
    const [selectedLeaveType, setSelectedLeaveType] = useState<string>('');
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // 직원별 고유 색상 생성
    const getEmployeeColor = (employeeId: number): string => {
        const colors = [
            'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 
            'bg-indigo-500', 'bg-red-500', 'bg-yellow-500', 'bg-teal-500',
            'bg-orange-500', 'bg-cyan-500', 'bg-rose-500', 'bg-emerald-500'
        ];
        return colors[employeeId % colors.length];
    };

    // 휴가 유형에 따른 패턴 클래스 (필요시 사용 예정)
    // const getLeaveTypePattern = (leaveType: string): string => {
    //     switch (leaveType) {
    //         case 'HALF_DAY_AM':
    //             return 'bg-gradient-to-r from-transparent to-current';
    //         case 'HALF_DAY_PM':
    //             return 'bg-gradient-to-l from-transparent to-current';
    //         case 'SICK':
    //             return 'bg-opacity-75 border-2 border-current';
    //         default:
    //             return '';
    //     }
    // };

    // 필터링된 휴가 데이터
    const filteredVacations = useMemo(() => {
        return allVacations.filter(vacation => {
            const employeeMatch = selectedEmployeeId === '' || vacation.employee === selectedEmployeeId;
            const leaveTypeMatch = selectedLeaveType === '' || vacation.leave_type === selectedLeaveType;
            const isApproved = vacation.status === 'APPROVED';
            
            return employeeMatch && leaveTypeMatch && isApproved;
        });
    }, [allVacations, selectedEmployeeId, selectedLeaveType]);

    // 날짜별 휴가 데이터 그룹화
    const groupVacationsByDate = useMemo(() => {
        const grouped: Record<string, DayVacationDetail[]> = {};
        
        filteredVacations.forEach(vacation => {
            const start = new Date(vacation.start_date);
            const end = new Date(vacation.end_date);
            const employee = employees.find(emp => emp.id === vacation.employee);
            
            if (!employee) return;
            
            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                if (!grouped[dateKey]) {
                    grouped[dateKey] = [];
                }
                grouped[dateKey].push({ vacation, employee });
            }
        });
        
        return grouped;
    }, [filteredVacations, employees]);

    // 휴가 유형 라벨 가져오기
    const getLeaveTypeLabel = (leaveType: string) => {
        const option = LEAVE_TYPE_OPTIONS.find(opt => opt.value === leaveType);
        return option?.label || leaveType;
    };

    // 월 네비게이션
    const navigateMonth = (direction: 'prev' | 'next') => {
        const newDate = new Date(currentDate);
        if (direction === 'prev') {
            newDate.setMonth(month - 1);
        } else {
            newDate.setMonth(month + 1);
        }
        setCurrentDate(newDate);
    };

    // 연 네비게이션
    const navigateYear = (direction: 'prev' | 'next') => {
        const newDate = new Date(currentDate);
        if (direction === 'prev') {
            newDate.setFullYear(year - 1);
        } else {
            newDate.setFullYear(year + 1);
        }
        setCurrentDate(newDate);
    };

    // 날짜 클릭 핸들러
    const handleDateClick = (dateKey: string) => {
        if (groupVacationsByDate[dateKey]?.length > 0) {
            setSelectedDate(dateKey);
            setShowDetailModal(true);
        }
    };

    // 월간 캘린더 렌더링
    const renderMonthlyCalendar = () => {
        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);
        const daysInMonth = lastDayOfMonth.getDate();
        const startDay = firstDayOfMonth.getDay();
        
        const days = [];
        const koreanDays = ['일', '월', '화', '수', '목', '금', '토'];
        
        // 요일 헤더
        koreanDays.forEach(day => {
            days.push(
                <div key={day} className="text-center text-sm font-medium text-gray-500 py-3 border-b">
                    {day}
                </div>
            );
        });
        
        // 빈 셀 (월 시작 전)
        for (let i = 0; i < startDay; i++) {
            days.push(<div key={`empty-${i}`} className="p-2 border border-gray-100"></div>);
        }
        
        // 실제 날짜들
        for (let date = 1; date <= daysInMonth; date++) {
            const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
            const dayVacations = groupVacationsByDate[dateKey] || [];
            const isToday = new Date().toDateString() === new Date(year, month, date).toDateString();
            const hasVacations = dayVacations.length > 0;
            
            days.push(
                <div 
                    key={date} 
                    className={`p-1 min-h-[80px] border border-gray-100 cursor-pointer hover:bg-gray-50 ${
                        isToday ? 'bg-blue-50' : ''
                    } ${hasVacations ? 'hover:bg-blue-50' : ''}`}
                    onClick={() => handleDateClick(dateKey)}
                >
                    <div className={`text-sm font-medium mb-1 ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                        {date}
                    </div>
                    <div className="space-y-1">
                        {dayVacations.slice(0, 3).map((item, index) => (
                            <div
                                key={index}
                                className={`text-xs px-1 py-0.5 rounded text-white truncate ${getEmployeeColor(item.employee.id)}`}
                                title={`${item.employee.name} - ${getLeaveTypeLabel(item.vacation.leave_type)}`}
                            >
                                {item.employee.name.slice(0, 4)}
                            </div>
                        ))}
                        {dayVacations.length > 3 && (
                            <div className="text-xs text-gray-500 px-1">
                                +{dayVacations.length - 3}
                            </div>
                        )}
                    </div>
                </div>
            );
        }
        
        return (
            <div className="grid grid-cols-7 gap-0 border border-gray-200 rounded-lg overflow-hidden">
                {days}
            </div>
        );
    };

    // 연간 캘린더 렌더링 (간단한 월별 요약)
    const renderYearlyCalendar = () => {
        const months = [];
        
        for (let m = 0; m < 12; m++) {
            const monthVacations = filteredVacations.filter(vacation => {
                const startDate = new Date(vacation.start_date);
                const endDate = new Date(vacation.end_date);
                const monthStart = new Date(year, m, 1);
                const monthEnd = new Date(year, m + 1, 0);
                
                return (startDate >= monthStart && startDate <= monthEnd) ||
                       (endDate >= monthStart && endDate <= monthEnd) ||
                       (startDate <= monthStart && endDate >= monthEnd);
            });
            
            months.push(
                <div key={m} className="bg-white border border-gray-200 rounded-lg p-4">
                    <h3 className="text-center font-semibold text-gray-900 mb-3">
                        {m + 1}월
                    </h3>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600 mb-1">
                            {monthVacations.length}
                        </div>
                        <div className="text-sm text-gray-500">
                            건의 휴가
                        </div>
                    </div>
                    <div className="mt-3 space-y-1">
                        {monthVacations.slice(0, 3).map((vacation, index) => {
                            const employee = employees.find(emp => emp.id === vacation.employee);
                            return (
                                <div key={index} className="text-xs text-gray-600 truncate">
                                    {employee?.name} - {getLeaveTypeLabel(vacation.leave_type)}
                                </div>
                            );
                        })}
                        {monthVacations.length > 3 && (
                            <div className="text-xs text-gray-400">
                                외 {monthVacations.length - 3}건
                            </div>
                        )}
                    </div>
                </div>
            );
        }
        
        return (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {months}
            </div>
        );
    };

    // 선택된 날짜의 상세 정보 모달
    const DetailModal = () => {
        if (!selectedDate || !showDetailModal) return null;
        
        const dayVacations = groupVacationsByDate[selectedDate] || [];
        const selectedDateObj = new Date(selectedDate);
        const formattedDate = `${selectedDateObj.getFullYear()}년 ${selectedDateObj.getMonth() + 1}월 ${selectedDateObj.getDate()}일`;
        
        return (
            <div 
                className="fixed inset-0 flex items-center justify-center z-[60] p-4"
                style={{ backgroundColor: 'rgba(0, 0, 0, 0.25)' }}
            >
                <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col">
                    <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center flex-shrink-0">
                        <h3 className="text-lg font-semibold text-gray-900">{formattedDate}</h3>
                        <button 
                            onClick={() => setShowDetailModal(false)}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <FiX className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        <div className="p-6">
                            <div className="space-y-3">
                                {dayVacations.map((item, index) => (
                                    <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                                        <div className={`w-4 h-4 rounded-full mr-3 ${getEmployeeColor(item.employee.id)}`}></div>
                                        <div className="flex-1">
                                            <div className="font-medium text-gray-900">{item.employee.name}</div>
                                            <div className="text-sm text-gray-600">{item.employee.position}</div>
                                            <div className="text-sm text-blue-600">{getLeaveTypeLabel(item.vacation.leave_type)}</div>
                                        </div>
                                        <StatusBadge text="승인됨" theme="active" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <>
            <div
                className="fixed inset-0 flex items-center justify-center z-50 p-4"
                style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
                onClick={handleBackdropClick}
            >
                <div
                    className="w-full max-w-7xl bg-white rounded-xl shadow-lg border border-gray-200 max-h-[95vh] overflow-hidden flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* 헤더 */}
                    <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                        <div className="flex items-center">
                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                                <FiUsers className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">조직 휴가 캘린더</h2>
                                <p className="text-sm text-gray-500">
                                    전체 직원의 휴가 현황을 한눈에 확인하세요
                                </p>
                            </div>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                            <FiX className="w-5 h-5" />
                        </button>
                    </div>

                    {/* 컨트롤 영역 */}
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            {/* 뷰 타입 및 네비게이션 */}
                            <div className="flex items-center gap-4">
                                <div className="flex bg-white rounded-lg border border-gray-200 p-1">
                                    <button
                                        onClick={() => setViewType('month')}
                                        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                                            viewType === 'month' 
                                                ? 'bg-blue-500 text-white' 
                                                : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                    >
                                        월간
                                    </button>
                                    <button
                                        onClick={() => setViewType('year')}
                                        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                                            viewType === 'year' 
                                                ? 'bg-blue-500 text-white' 
                                                : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                    >
                                        연간
                                    </button>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => viewType === 'month' ? navigateMonth('prev') : navigateYear('prev')}
                                        className="p-2 hover:bg-white rounded-lg transition-colors"
                                    >
                                        <FiChevronLeft className="w-5 h-5" />
                                    </button>
                                    <h3 className="text-xl font-semibold text-gray-900 min-w-[120px] text-center">
                                        {viewType === 'month' ? `${year}년 ${month + 1}월` : `${year}년`}
                                    </h3>
                                    <button
                                        onClick={() => viewType === 'month' ? navigateMonth('next') : navigateYear('next')}
                                        className="p-2 hover:bg-white rounded-lg transition-colors"
                                    >
                                        <FiChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* 필터 */}
                            <div className="flex flex-col sm:flex-row gap-3">
                                <div>
                                    <select
                                        value={selectedEmployeeId}
                                        onChange={(e) => setSelectedEmployeeId(e.target.value === '' ? '' : Number(e.target.value))}
                                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    >
                                        <option value="">전체 직원</option>
                                        {employees.map(employee => (
                                            <option key={employee.id} value={employee.id}>
                                                {employee.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                
                                <div>
                                    <select
                                        value={selectedLeaveType}
                                        onChange={(e) => setSelectedLeaveType(e.target.value)}
                                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    >
                                        <option value="">전체 휴가 유형</option>
                                        {LEAVE_TYPE_OPTIONS.map(option => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 범례 */}
                    <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
                        <div className="flex flex-wrap gap-4 text-sm">
                            <div className="flex items-center">
                                <FiEye className="w-4 h-4 mr-2 text-gray-500" />
                                <span>날짜를 클릭하면 상세 정보를 볼 수 있습니다</span>
                            </div>
                            {viewType === 'month' && (
                                <div className="flex items-center">
                                    <FiCalendar className="w-4 h-4 mr-2 text-gray-500" />
                                    <span>직원별로 다른 색상으로 표시됩니다</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 캘린더 */}
                    <div className="flex-1 overflow-y-auto">
                        <div className="p-6">
                            {viewType === 'month' ? renderMonthlyCalendar() : renderYearlyCalendar()}
                        </div>
                    </div>

                    {/* 푸터 */}
                    <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                        <div className="flex justify-between items-center">
                            <div className="text-sm text-gray-500">
                                총 {filteredVacations.length}건의 승인된 휴가
                            </div>
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
            <DetailModal />
        </>
    );
};

export default OrganizationVacationCalendar;