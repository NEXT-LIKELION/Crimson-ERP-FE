import React, { useState } from 'react';
import { FiX, FiCalendar, FiFileText, FiSend } from 'react-icons/fi';
import { useCreateVacation } from '../../hooks/queries/useVacations';
import { VacationCreateData, LEAVE_TYPE_OPTIONS, LeaveType, fetchEmployees } from '../../api/hr';
import { useAuthStore } from '../../store/authStore';

interface VacationRequestModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

const VacationRequestModal: React.FC<VacationRequestModalProps> = ({ onClose, onSuccess }) => {
  const currentUser = useAuthStore((state) => state.user);
  const createVacationMutation = useCreateVacation();

  const [formData, setFormData] = useState<Omit<VacationCreateData, 'employee'>>({
    leave_type: 'VACATION',
    start_date: '',
    end_date: '',
    reason: '',
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // 폼 데이터 변경 핸들러
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // 에러 클리어
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  // 폼 검증
  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.leave_type) {
      newErrors.leave_type = '휴가 유형을 선택해주세요.';
    }

    if (!formData.start_date) {
      newErrors.start_date = '시작일을 선택해주세요.';
    }

    if (!formData.end_date) {
      newErrors.end_date = '종료일을 선택해주세요.';
    }

    if (formData.start_date && formData.end_date && formData.start_date > formData.end_date) {
      newErrors.end_date = '종료일은 시작일보다 늦어야 합니다.';
    }

    if (!formData?.reason?.trim()) {
      newErrors.reason = '사유를 입력해주세요.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 휴가 신청 제출
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    if (!currentUser) {
      alert('로그인 정보가 없습니다. 다시 로그인해주세요.');
      return;
    }

    try {
      let numericEmployeeId: number;

      // 1단계: currentUser.id 확인
      if (currentUser.id && typeof currentUser.id === 'number') {
        numericEmployeeId = currentUser.id;
      } else {
        // 2단계: 직원 목록에서 username으로 ID 찾기
        try {
          const employeesResponse = await fetchEmployees();
          const employees = employeesResponse.data;
          
          const currentEmployee = employees.find(
            (emp: { username: string; id: number }) => emp.username === currentUser.username
          );

          if (currentEmployee && currentEmployee.id) {
            numericEmployeeId = currentEmployee.id;
          } else {
            throw new Error('직원 목록에서 사용자를 찾을 수 없습니다.');
          }
        } catch (error) {
          console.error('직원 목록 조회 실패:', error);
          alert('사용자 정보를 확인할 수 없습니다. 관리자에게 문의하세요.');
          return;
        }
      }

      const requestData: VacationCreateData = {
        employee: numericEmployeeId,
        ...formData,
      };

      await createVacationMutation.mutateAsync(requestData);
      alert('휴가 신청이 완료되었습니다.');
      onSuccess?.();
      onClose();
    } catch (error: unknown) {
      console.error('휴가 신청 실패:', error);
      const apiError = error as ApiError;
      
      let errorMessage = '휴가 신청에 실패했습니다.';

      if ('response' in (error as object) && apiError.response?.data) {
        const responseData = apiError.response.data;
        if (typeof responseData === 'string') {
          errorMessage = responseData;
        } else if (responseData.message) {
          errorMessage = responseData.message;
        } else if (responseData.error) {
          errorMessage = responseData.error;
        } else if (responseData.detail) {
          errorMessage = responseData.detail;
        } else if ('non_field_errors' in responseData) {
          const nonFieldErrors = (responseData as { non_field_errors: string | string[] }).non_field_errors;
          errorMessage = Array.isArray(nonFieldErrors)
            ? nonFieldErrors.join(', ')
            : nonFieldErrors;
        } else {
          const fieldErrors = Object.entries(responseData)
            .filter(([, value]) => Array.isArray(value))
            .map(([key, value]) => `${key}: ${(value as string[]).join(', ')}`)
            .join('\n');

          if (fieldErrors) {
            errorMessage = fieldErrors;
          }
        }
      }

      alert(errorMessage);
    }
  };

  // 반차인 경우 시작일과 종료일을 같게 설정
  const handleLeaveTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { value } = e.target;
    setFormData((prev) => {
      const newData = { ...prev, leave_type: value as LeaveType };

      // 반차인 경우 종료일을 시작일과 같게 설정
      if ((value === 'HALF_DAY_AM' || value === 'HALF_DAY_PM') && prev.start_date) {
        newData.end_date = prev.start_date;
      }

      return newData;
    });
  };

  // 반차인 경우 시작일 변경 시 종료일도 같이 변경
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setFormData((prev) => {
      const newData = { ...prev, start_date: value };

      // 반차인 경우 종료일을 시작일과 같게 설정
      if (prev.leave_type === 'HALF_DAY_AM' || prev.leave_type === 'HALF_DAY_PM') {
        newData.end_date = value;
      }

      return newData;
    });
  };

  // 반차 여부 확인
  const isHalfDay = formData.leave_type === 'HALF_DAY_AM' || formData.leave_type === 'HALF_DAY_PM';

  // 배경 클릭 시 모달 닫기
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
        className='w-full max-w-md rounded-xl border border-gray-200 bg-white shadow-lg'
        onClick={(e) => e.stopPropagation()}>
        {/* 헤더 */}
        <div className='flex items-center justify-between border-b border-gray-200 px-6 py-4'>
          <div className='flex items-center'>
            <div className='mr-3 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100'>
              <FiCalendar className='h-5 w-5 text-blue-600' />
            </div>
            <div>
              <h2 className='text-lg font-semibold text-gray-900'>휴가 신청</h2>
              <p className='text-sm text-gray-500'>새로운 휴가를 신청합니다</p>
            </div>
          </div>
          <button onClick={onClose} className='text-gray-400 transition-colors hover:text-gray-600'>
            <FiX className='h-5 w-5' />
          </button>
        </div>

        {/* 콘텐츠 */}
        <div className='p-6'>
          <div className='space-y-4'>
            {/* 휴가 유형 */}
            <div>
              <label htmlFor='leave_type' className='mb-2 block text-sm font-medium text-gray-700'>
                휴가 유형 <span className='text-red-500'>*</span>
              </label>
              <select
                id='leave_type'
                name='leave_type'
                value={formData.leave_type}
                onChange={handleLeaveTypeChange}
                className={`w-full rounded-lg border px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                  errors.leave_type ? 'border-red-300' : 'border-gray-300'
                }`}>
                {LEAVE_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.leave_type && (
                <p className='mt-1 text-sm text-red-500'>{errors.leave_type}</p>
              )}
            </div>

            {/* 시작일 */}
            <div>
              <label htmlFor='start_date' className='mb-2 block text-sm font-medium text-gray-700'>
                {isHalfDay ? '날짜' : '시작일'} <span className='text-red-500'>*</span>
              </label>
              <div className='relative'>
                <input
                  id='start_date'
                  name='start_date'
                  type='date'
                  value={formData.start_date}
                  onChange={handleStartDateChange}
                  className={`w-full rounded-lg border px-3 py-2 pr-10 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                    errors.start_date ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                <FiCalendar className='absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 transform text-gray-400' />
              </div>
              {errors.start_date && (
                <p className='mt-1 text-sm text-red-500'>{errors.start_date}</p>
              )}
            </div>

            {/* 종료일 (반차가 아닌 경우만) */}
            {!isHalfDay && (
              <div>
                <label htmlFor='end_date' className='mb-2 block text-sm font-medium text-gray-700'>
                  종료일 <span className='text-red-500'>*</span>
                </label>
                <div className='relative'>
                  <input
                    id='end_date'
                    name='end_date'
                    type='date'
                    value={formData.end_date}
                    onChange={handleChange}
                    className={`w-full rounded-lg border px-3 py-2 pr-10 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                      errors.end_date ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  <FiCalendar className='absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 transform text-gray-400' />
                </div>
                {errors.end_date && <p className='mt-1 text-sm text-red-500'>{errors.end_date}</p>}
              </div>
            )}

            {/* 사유 */}
            <div>
              <label htmlFor='reason' className='mb-2 block text-sm font-medium text-gray-700'>
                사유 <span className='text-red-500'>*</span>
              </label>
              <div className='relative'>
                <textarea
                  id='reason'
                  name='reason'
                  value={formData.reason}
                  onChange={handleChange}
                  rows={3}
                  placeholder='휴가 사유를 입력해주세요'
                  className={`w-full resize-none rounded-lg border px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                    errors.reason ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                <FiFileText className='absolute top-3 right-3 h-4 w-4 text-gray-400' />
              </div>
              {errors.reason && <p className='mt-1 text-sm text-red-500'>{errors.reason}</p>}
            </div>
          </div>

          {/* 버튼 영역 */}
          <div className='mt-6 border-t border-gray-200 pt-4'>
            <div className='flex gap-3'>
              <button
                onClick={onClose}
                className='flex-1 rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-300'>
                취소
              </button>
              <button
                onClick={handleSubmit}
                disabled={createVacationMutation.isPending}
                className='flex flex-1 items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50'>
                {createVacationMutation.isPending ? (
                  <>
                    <div className='mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent'></div>
                    신청 중...
                  </>
                ) : (
                  <>
                    <FiSend className='mr-2 h-4 w-4' />
                    휴가 신청
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VacationRequestModal;
