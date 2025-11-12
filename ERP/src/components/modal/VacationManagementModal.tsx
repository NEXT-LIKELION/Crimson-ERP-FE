import React, { useState } from 'react';
import { FiX, FiCalendar, FiUser, FiClock, FiCheck, FiXCircle, FiRotateCcw } from 'react-icons/fi';
import { useVacations, useReviewVacation } from '../../hooks/queries/useVacations';
import {
  Vacation,
  VACATION_STATUS_OPTIONS,
  LEAVE_TYPE_OPTIONS,
  VacationStatus,
} from '../../api/hr';
import { useAuthStore } from '../../store/authStore';
import StatusBadge from '../common/StatusBadge';
import { usePermissions } from '../../hooks/usePermissions';
import { useEscapeKey } from '../../hooks/useEscapeKey';

interface VacationManagementModalProps {
  onClose: () => void;
}

const VacationManagementModal: React.FC<VacationManagementModalProps> = ({ onClose }) => {
  const currentUser = useAuthStore((state) => state.user);
  const permissions = usePermissions();
  const isAdmin = permissions.hasPermission('HR'); // HR 탭에서의 권한 체크

  const { data: vacationsData, isLoading, error } = useVacations();
  const reviewVacationMutation = useReviewVacation();

  const [selectedStatus, setSelectedStatus] = useState<VacationStatus | ''>('');
  const [selectedLeaveType, setSelectedLeaveType] = useState<string>('');

  const vacations: Vacation[] = vacationsData?.data || [];

  // 필터링된 휴가 목록
  const filteredVacations = vacations.filter((vacation) => {
    const statusMatch = selectedStatus === '' || vacation.status === selectedStatus;
    const leaveTypeMatch = selectedLeaveType === '' || vacation.leave_type === selectedLeaveType;

    // 직원인 경우 본인 휴가만 보기 - 타입을 명시적으로 숫자로 비교
    if (!isAdmin) {
      const currentUserId = Number(currentUser?.id);
      const vacationEmployeeId = Number(vacation.employee);
      const isMyVacation =
        !isNaN(currentUserId) && !isNaN(vacationEmployeeId) && vacationEmployeeId === currentUserId;
      return statusMatch && leaveTypeMatch && isMyVacation;
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

  // 휴가 상태 변경
  const handleStatusChange = async (vacationId: number, newStatus: VacationStatus) => {
    if (!isAdmin && newStatus !== 'CANCELLED') {
      alert('권한이 없습니다.');
      return;
    }

    // 승인 시 과거 날짜 체크
    if (newStatus === 'APPROVED') {
      const vacation = vacations.find((v) => v.id === vacationId);
      if (vacation) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const startDate = new Date(vacation.start_date);

        if (startDate < today) {
          alert('과거 날짜의 휴가는 승인할 수 없습니다.');
          return;
        }
      }
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
      const apiError = error as ApiError;
      if ('response' in (error as object)) {
        console.error('에러 상세 정보:', {
          message: apiError.message,
          response: apiError.response,
          status: apiError.response?.status,
          data: apiError.response?.data,
        });
      }

      let errorMessage = '상태 변경에 실패했습니다.';

      if ('response' in (error as object) && apiError.response?.data?.message) {
        errorMessage = apiError.response.data.message;
      } else if ('response' in (error as object) && apiError.response?.data?.error) {
        errorMessage = apiError.response.data.error;
      } else if ('response' in (error as object) && apiError.response?.data?.detail) {
        errorMessage = apiError.response.data.detail;
      } else if ('response' in (error as object) && apiError.response?.status) {
        switch (apiError.response.status) {
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
            errorMessage = `오류 (${apiError.response?.status}): ${apiError.response?.data?.error || '알 수 없는 오류'}`;
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
      <div className='rounded-lg border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md'>
        <div className='mb-3 flex items-start justify-between'>
          <div className='flex items-center'>
            <div className='mr-3 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100'>
              <FiCalendar className='h-5 w-5 text-blue-600' />
            </div>
            <div>
              <h3 className='font-semibold text-gray-900'>{vacation.employee_name}</h3>
              <p className='text-sm text-gray-600'>{getLeaveTypeLabel(vacation.leave_type)}</p>
            </div>
          </div>
          <StatusBadge
            text={vacation.status_display}
            theme={getStatusBadgeTheme(vacation.status)}
          />
        </div>

        <div className='mb-4 space-y-2'>
          <div className='flex items-center text-sm text-gray-600'>
            <FiCalendar className='mr-2 h-4 w-4' />
            <span>
              {formatDate(vacation.start_date)}
              {vacation.start_date !== vacation.end_date && <> ~ {formatDate(vacation.end_date)}</>}
              <span className='ml-2 font-medium text-blue-600'>
                ({calculateVacationDays(vacation)}일)
              </span>
            </span>
          </div>

          <div className='flex items-center text-sm text-gray-600'>
            <FiUser className='mr-2 h-4 w-4' />
            <span>사유: {vacation.reason}</span>
          </div>

          <div className='flex items-center text-sm text-gray-600'>
            <FiClock className='mr-2 h-4 w-4' />
            <span>신청일: {formatDate(vacation.created_at)}</span>
          </div>

          {vacation.reviewed_at && (
            <div className='flex items-center text-sm text-gray-600'>
              <FiCheck className='mr-2 h-4 w-4' />
              <span>처리일: {formatDate(vacation.reviewed_at)}</span>
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
                <FiCheck className='mr-1 h-4 w-4' />
                승인
              </button>
              <button
                onClick={() => handleStatusChange(vacation.id, 'REJECTED')}
                disabled={reviewVacationMutation.isPending}
                className='flex flex-1 items-center justify-center rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition-all duration-200 hover:border-red-300 hover:bg-red-100 disabled:opacity-50'>
                <FiXCircle className='mr-1 h-4 w-4' />
                거절
              </button>
            </>
          )}

          {canCancel && (
            <button
              onClick={() => handleStatusChange(vacation.id, 'CANCELLED')}
              disabled={reviewVacationMutation.isPending}
              className='flex flex-1 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700 transition-all duration-200 hover:border-gray-300 hover:bg-gray-100 disabled:opacity-50'>
              <FiRotateCcw className='mr-1 h-4 w-4' />
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

  useEscapeKey(onClose);

  if (isLoading) {
    return (
      <div
        className='fixed inset-0 z-50 flex items-center justify-center p-4'
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        onClick={handleBackdropClick}>
        <div className='w-full max-w-4xl rounded-xl border border-gray-200 bg-white p-6 shadow-lg'>
          <div className='flex h-64 items-center justify-center'>
            <div className='flex flex-col items-center'>
              <div className='mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600'></div>
              <p className='font-medium text-gray-600'>휴가 정보를 불러오는 중...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className='fixed inset-0 z-50 flex items-center justify-center p-4'
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        onClick={handleBackdropClick}>
        <div className='w-full max-w-4xl rounded-xl border border-gray-200 bg-white p-6 shadow-lg'>
          <div className='flex h-64 items-center justify-center'>
            <div className='rounded-lg border border-red-200 bg-red-50 p-8 text-center'>
              <div className='mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100'>
                <FiXCircle className='h-6 w-6 text-red-600' />
              </div>
              <h3 className='mb-2 text-lg font-semibold text-red-800'>오류가 발생했습니다</h3>
              <p className='text-red-600'>휴가 정보를 불러올 수 없습니다.</p>
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
        className='max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg'
        onClick={(e) => e.stopPropagation()}>
        {/* 헤더 */}
        <div className='flex items-center justify-between border-b border-gray-200 px-6 py-4'>
          <div className='flex items-center'>
            <div className='mr-3 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100'>
              <FiCalendar className='h-5 w-5 text-blue-600' />
            </div>
            <div>
              <h2 className='text-lg font-semibold text-gray-900'>
                {isAdmin ? '휴가 관리' : '내 휴가 현황'}
              </h2>
              <p className='text-sm text-gray-500'>
                총 {filteredVacations.length}건의 휴가가 있습니다
              </p>
            </div>
          </div>
          <button onClick={onClose} className='text-gray-400 transition-colors hover:text-gray-600'>
            <FiX className='h-5 w-5' />
          </button>
        </div>

        {/* 필터 영역 */}
        <div className='border-b border-gray-200 bg-gray-50 px-6 py-4'>
          <div className='flex gap-4'>
            <div className='flex-1'>
              <label className='mb-1 block text-sm font-medium text-gray-700'>상태 필터</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as VacationStatus | '')}
                className='w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none'>
                <option value=''>전체 상태</option>
                {VACATION_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className='flex-1'>
              <label className='mb-1 block text-sm font-medium text-gray-700'>휴가 유형</label>
              <select
                value={selectedLeaveType}
                onChange={(e) => setSelectedLeaveType(e.target.value)}
                className='w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none'>
                <option value=''>전체 유형</option>
                {LEAVE_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 휴가 목록 */}
        <div className='flex-1 overflow-y-auto p-6' style={{ maxHeight: 'calc(90vh - 200px)' }}>
          {filteredVacations.length === 0 ? (
            <div className='py-12 text-center'>
              <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100'>
                <FiCalendar className='h-8 w-8 text-gray-400' />
              </div>
              <h3 className='mb-2 text-lg font-semibold text-gray-900'>
                휴가 신청 내역이 없습니다
              </h3>
              <p className='text-gray-600'>조건에 맞는 휴가 신청이 없습니다.</p>
            </div>
          ) : (
            <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
              {filteredVacations.map((vacation) => (
                <VacationCard key={vacation.id} vacation={vacation} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VacationManagementModal;
