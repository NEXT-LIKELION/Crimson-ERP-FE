import React, { useState } from 'react';
import { FiX, FiCalendar, FiUser, FiClock, FiCheck, FiXCircle, FiRotateCcw } from 'react-icons/fi';
import { useVacations, useReviewVacation } from '../../hooks/queries/useVacations';
import { Vacation, VACATION_STATUS_OPTIONS, LEAVE_TYPE_OPTIONS, VacationStatus } from '../../api/hr';
import { useAuthStore } from '../../store/authStore';
import StatusBadge from '../common/StatusBadge';

interface VacationManagementModalProps {
    onClose: () => void;
}

const VacationManagementModal: React.FC<VacationManagementModalProps> = ({ onClose }) => {
    const currentUser = useAuthStore((state) => state.user);
    const isAdmin = currentUser?.role === 'MANAGER';
    
    const { data: vacationsData, isLoading, error } = useVacations();
    const reviewVacationMutation = useReviewVacation();
    
    const [selectedStatus, setSelectedStatus] = useState<VacationStatus | ''>('');
    const [selectedLeaveType, setSelectedLeaveType] = useState<string>('');

    const vacations: Vacation[] = vacationsData?.data || [];

    // 필터링된 휴가 목록
    const filteredVacations = vacations.filter(vacation => {
        const statusMatch = selectedStatus === '' || vacation.status === selectedStatus;
        const leaveTypeMatch = selectedLeaveType === '' || vacation.leave_type === selectedLeaveType;
        
        // 직원인 경우 본인 휴가만 보기
        if (!isAdmin) {
            return statusMatch && leaveTypeMatch && vacation.employee === currentUser?.id;
        }
        
        return statusMatch && leaveTypeMatch;
    });

    // 날짜 포맷팅
    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    // 휴가 유형 라벨 가져오기
    const getLeaveTypeLabel = (leaveType: string): string => {
        const option = LEAVE_TYPE_OPTIONS.find(opt => opt.value === leaveType);
        return option?.label || leaveType;
    };

    // 상태 뱃지 색상 가져오기
    const getStatusBadgeTheme = (status: VacationStatus): 'pending' | 'active' | 'rejected' | 'neutral' => {
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

    // 휴가 상태 변경
    const handleStatusChange = async (vacationId: number, newStatus: VacationStatus) => {
        if (!isAdmin && newStatus !== 'CANCELLED') {
            alert('권한이 없습니다.');
            return;
        }

        console.log('휴가 상태 변경 시작:', { vacationId, newStatus, isAdmin });

        try {
            const result = await reviewVacationMutation.mutateAsync({ vacationId, status: newStatus });
            console.log('휴가 상태 변경 성공:', result);
            
            const statusText = VACATION_STATUS_OPTIONS.find(opt => opt.value === newStatus)?.label;
            alert(`휴가 상태가 "${statusText}"로 변경되었습니다.`);
        } catch (error: any) {
            console.error('휴가 상태 변경 실패:', error);
            console.error('에러 상세 정보:', {
                message: error.message,
                response: error.response,
                status: error.response?.status,
                data: error.response?.data,
                config: error.config
            });
            
            let errorMessage = '상태 변경에 실패했습니다.';
            
            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.response?.data?.error) {
                errorMessage = error.response.data.error;
            } else if (error.response?.data?.detail) {
                errorMessage = error.response.data.detail;
            } else if (error.response?.status) {
                switch (error.response.status) {
                    case 401:
                        errorMessage = '인증이 필요합니다. 다시 로그인해주세요.';
                        break;
                    case 403:
                        errorMessage = '권한이 없습니다.';
                        break;
                    case 404:
                        errorMessage = '휴가 정보를 찾을 수 없습니다.';
                        break;
                    case 500:
                        errorMessage = '서버 오류가 발생했습니다.';
                        break;
                    default:
                        errorMessage = `오류 (${error.response.status}): ${error.response.statusText}`;
                }
            }
            
            alert(errorMessage);
        }
    };

    // 휴가 카드 컴포넌트
    const VacationCard: React.FC<{ vacation: Vacation }> = ({ vacation }) => {
        const isOwner = currentUser?.id === vacation.employee;
        const canCancel = isOwner && vacation.status === 'PENDING';
        const canApprove = isAdmin && vacation.status === 'PENDING';

        return (
            <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                            <FiCalendar className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">{vacation.employee_name}</h3>
                            <p className="text-sm text-gray-600">{getLeaveTypeLabel(vacation.leave_type)}</p>
                        </div>
                    </div>
                    <StatusBadge 
                        text={vacation.status_display} 
                        theme={getStatusBadgeTheme(vacation.status)} 
                    />
                </div>

                <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                        <FiCalendar className="w-4 h-4 mr-2" />
                        <span>
                            {formatDate(vacation.start_date)}
                            {vacation.start_date !== vacation.end_date && (
                                <> ~ {formatDate(vacation.end_date)}</>
                            )}
                        </span>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600">
                        <FiUser className="w-4 h-4 mr-2" />
                        <span>사유: {vacation.reason}</span>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600">
                        <FiClock className="w-4 h-4 mr-2" />
                        <span>신청일: {formatDate(vacation.created_at)}</span>
                    </div>
                    
                    {vacation.reviewed_at && (
                        <div className="flex items-center text-sm text-gray-600">
                            <FiCheck className="w-4 h-4 mr-2" />
                            <span>처리일: {formatDate(vacation.reviewed_at)}</span>
                        </div>
                    )}
                </div>

                {/* 액션 버튼 */}
                <div className="flex gap-2">
                    {canApprove && (
                        <>
                            <button
                                onClick={() => handleStatusChange(vacation.id, 'APPROVED')}
                                disabled={reviewVacationMutation.isPending}
                                className="flex-1 px-3 py-2 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center justify-center text-sm font-medium hover:bg-green-100 hover:border-green-300 transition-all duration-200 disabled:opacity-50"
                            >
                                <FiCheck className="w-4 h-4 mr-1" />
                                승인
                            </button>
                            <button
                                onClick={() => handleStatusChange(vacation.id, 'REJECTED')}
                                disabled={reviewVacationMutation.isPending}
                                className="flex-1 px-3 py-2 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center justify-center text-sm font-medium hover:bg-red-100 hover:border-red-300 transition-all duration-200 disabled:opacity-50"
                            >
                                <FiXCircle className="w-4 h-4 mr-1" />
                                거절
                            </button>
                        </>
                    )}
                    
                    {canCancel && (
                        <button
                            onClick={() => handleStatusChange(vacation.id, 'CANCELLED')}
                            disabled={reviewVacationMutation.isPending}
                            className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 text-gray-700 rounded-lg flex items-center justify-center text-sm font-medium hover:bg-gray-100 hover:border-gray-300 transition-all duration-200 disabled:opacity-50"
                        >
                            <FiRotateCcw className="w-4 h-4 mr-1" />
                            취소
                        </button>
                    )}
                </div>
            </div>
        );
    };

    // 배경 클릭 시 모달 닫기
    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    if (isLoading) {
        return (
            <div
                className="fixed inset-0 flex items-center justify-center z-50 p-4"
                style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
                onClick={handleBackdropClick}
            >
                <div className="w-full max-w-4xl bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                    <div className="flex justify-center items-center h-64">
                        <div className="flex flex-col items-center">
                            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                            <p className="text-gray-600 font-medium">휴가 정보를 불러오는 중...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div
                className="fixed inset-0 flex items-center justify-center z-50 p-4"
                style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
                onClick={handleBackdropClick}
            >
                <div className="w-full max-w-4xl bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                    <div className="flex justify-center items-center h-64">
                        <div className="text-center p-8 bg-red-50 rounded-lg border border-red-200">
                            <div className="w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                                <FiXCircle className="w-6 h-6 text-red-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-red-800 mb-2">오류가 발생했습니다</h3>
                            <p className="text-red-600">휴가 정보를 불러올 수 없습니다.</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

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
                    <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                            <FiCalendar className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">
                                {isAdmin ? '휴가 관리' : '내 휴가 현황'}
                            </h2>
                            <p className="text-sm text-gray-500">
                                총 {filteredVacations.length}건의 휴가가 있습니다
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <FiX className="w-5 h-5" />
                    </button>
                </div>

                {/* 필터 영역 */}
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">상태 필터</label>
                            <select
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value as VacationStatus | '')}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">전체 상태</option>
                                {VACATION_STATUS_OPTIONS.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">휴가 유형</label>
                            <select
                                value={selectedLeaveType}
                                onChange={(e) => setSelectedLeaveType(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">전체 유형</option>
                                {LEAVE_TYPE_OPTIONS.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* 휴가 목록 */}
                <div className="flex-1 overflow-y-auto p-6" style={{ maxHeight: 'calc(90vh - 200px)' }}>
                    {filteredVacations.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                                <FiCalendar className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">휴가 신청 내역이 없습니다</h3>
                            <p className="text-gray-600">조건에 맞는 휴가 신청이 없습니다.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {filteredVacations.map(vacation => (
                                <VacationCard key={vacation.id} vacation={vacation} />
                            ))}
                        </div>
                    )}
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

export default VacationManagementModal;