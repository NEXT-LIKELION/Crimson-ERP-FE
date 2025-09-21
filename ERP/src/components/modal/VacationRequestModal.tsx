import React, { useState } from 'react';
import { FiX, FiCalendar, FiFileText, FiSend, FiUsers } from 'react-icons/fi';
import { useCreateVacation } from '../../hooks/queries/useVacations';
import { VacationCreateData, LEAVE_TYPE_OPTIONS, LeaveType, fetchEmployees, EmployeeList } from '../../api/hr';
import { useAuthStore } from '../../store/authStore';
import { useEmployees } from '../../hooks/queries/useEmployees';

interface VacationRequestModalProps {
  onClose: () => void;
  onSuccess?: () => void;
  initialMode?: 'vacation' | 'work';
}

const VacationRequestModal: React.FC<VacationRequestModalProps> = ({ onClose, onSuccess, initialMode = 'vacation' }) => {
  const currentUser = useAuthStore((state) => state.user);
  const createVacationMutation = useCreateVacation();
  const { data: employeesData } = useEmployees();

  const [formData, setFormData] = useState<Omit<VacationCreateData, 'employee'>>({
    leave_type: initialMode === 'work' ? 'WORK' : 'VACATION',
    start_date: '',
    end_date: '',
    reason: '',
  });

  const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);
  const [isWorkMode, setIsWorkMode] = useState(initialMode === 'work');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // 직원 목록 (재직중인 직원만)
  const activeEmployees = React.useMemo(() => {
    if (!employeesData?.data) return [];
    return employeesData.data.filter((emp: EmployeeList) =>
      emp.is_active && emp.status?.toLowerCase() === 'approved'
    );
  }, [employeesData?.data]);

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

    // 휴가 모드에서만 유형 검증
    if (!isWorkMode && !formData.leave_type) {
      newErrors.leave_type = '유형을 선택해주세요.';
    }

    // 근무 모드에서는 직원 선택 필수
    if (isWorkMode && !selectedEmployee) {
      newErrors.employee = '직원을 선택해주세요.';
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

    // 휴가 모드에서만 사유 필수
    if (!isWorkMode && !formData?.reason?.trim()) {
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

      // 근무 모드에서는 선택된 직원 ID 사용
      if (isWorkMode && selectedEmployee) {
        numericEmployeeId = selectedEmployee;
      } else {
        // 휴가 모드에서는 현재 사용자 ID 사용
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
      }

      const requestData: VacationCreateData = {
        employee: numericEmployeeId,
        leave_type: isWorkMode ? 'WORK' : formData.leave_type,
        start_date: formData.start_date,
        end_date: formData.end_date,
        reason: isWorkMode ? '근무 일정' : formData.reason,
      };

      await createVacationMutation.mutateAsync(requestData);
      const successMessage = isWorkMode ? '근무 등록이 완료되었습니다.' : '휴가 신청이 완료되었습니다.';
      alert(successMessage);
      onSuccess?.();
      onClose();
    } catch (error: unknown) {
      console.error('휴가 신청 실패:', error);

      let errorMessage = isWorkMode ? '근무 등록에 실패했습니다.' : '휴가 신청에 실패했습니다.';

      if (error && typeof error === 'object' && 'response' in error) {
        const apiError = error as { response?: { data?: unknown } };
        const responseData = apiError.response?.data;

        if (typeof responseData === 'string') {
          errorMessage = responseData;
        } else if (responseData && typeof responseData === 'object') {
          const errorObj = responseData as Record<string, unknown>;

          if (typeof errorObj.message === 'string') {
            errorMessage = errorObj.message;
          } else if (typeof errorObj.error === 'string') {
            errorMessage = errorObj.error;
          } else if (typeof errorObj.detail === 'string') {
            errorMessage = errorObj.detail;
          } else if ('non_field_errors' in errorObj) {
            const nonFieldErrors = errorObj.non_field_errors;
            if (Array.isArray(nonFieldErrors)) {
              errorMessage = nonFieldErrors.join(', ');
            } else if (typeof nonFieldErrors === 'string') {
              errorMessage = nonFieldErrors;
            }
          } else {
            const fieldErrors = Object.entries(errorObj)
              .filter(([, value]) => Array.isArray(value))
              .map(([key, value]) => `${key}: ${(value as string[]).join(', ')}`)
              .join('\n');

            if (fieldErrors) {
              errorMessage = fieldErrors;
            }
          }
        }
      }

      alert(errorMessage);
    }
  };

  // 휴가 유형 변경 핸들러
  const handleLeaveTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { value } = e.target;
    const newIsWorkMode = value === 'WORK';
    setIsWorkMode(newIsWorkMode);

    setFormData((prev) => {
      const newData = { ...prev, leave_type: value as LeaveType };

      // 반차인 경우 종료일을 시작일과 같게 설정
      if ((value === 'HALF_DAY_AM' || value === 'HALF_DAY_PM') && prev.start_date) {
        newData.end_date = prev.start_date;
      }

      return newData;
    });

    // 에러 클리어
    if (errors.employee) {
      setErrors((prev) => ({ ...prev, employee: '' }));
    }
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

  // 휴가 일수 계산 (반차는 0.5일)
  const calculateVacationDays = (): number => {
    if (isHalfDay) {
      return 0.5;
    }

    if (!formData.start_date || !formData.end_date) {
      return 0;
    }

    const startDate = new Date(formData.start_date);
    const endDate = new Date(formData.end_date);
    const timeDiff = endDate.getTime() - startDate.getTime();
    const dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
    return Math.max(0, dayDiff);
  };

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
            <div className={`mr-3 flex h-10 w-10 items-center justify-center rounded-lg ${
              isWorkMode ? 'bg-orange-100' : 'bg-blue-100'
            }`}>
              {isWorkMode ? (
                <FiUsers className='h-5 w-5 text-orange-600' />
              ) : (
                <FiCalendar className='h-5 w-5 text-blue-600' />
              )}
            </div>
            <div>
              <h2 className='text-lg font-semibold text-gray-900'>
                {isWorkMode ? '근무 등록' : '휴가 신청'}
              </h2>
              <p className='text-sm text-gray-500'>
                {isWorkMode ? '직원의 근무 일정을 등록합니다' : '새로운 휴가를 신청합니다'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className='text-gray-400 transition-colors hover:text-gray-600'>
            <FiX className='h-5 w-5' />
          </button>
        </div>

        {/* 콘텐츠 */}
        <div className='p-6'>
          <div className='space-y-4'>
            {/* 유형 선택 (휴가 모드에서만) */}
            {!isWorkMode && (
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
                  {LEAVE_TYPE_OPTIONS.filter(option => option.value !== 'WORK').map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.leave_type && (
                  <p className='mt-1 text-sm text-red-500'>{errors.leave_type}</p>
                )}
              </div>
            )}


            {/* 직원 선택 (근무 모드일 때만) */}
            {isWorkMode && (
              <div>
                <label htmlFor='employee' className='mb-2 block text-sm font-medium text-gray-700'>
                  근무 직원 <span className='text-red-500'>*</span>
                </label>
                <select
                  id='employee'
                  value={selectedEmployee || ''}
                  onChange={(e) => {
                    setSelectedEmployee(Number(e.target.value) || null);
                    if (errors.employee) {
                      setErrors((prev) => ({ ...prev, employee: '' }));
                    }
                  }}
                  className={`w-full rounded-lg border px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                    errors.employee ? 'border-red-300' : 'border-gray-300'
                  }`}>
                  <option value=''>직원을 선택하세요</option>
                  {activeEmployees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.first_name} ({employee.username})
                    </option>
                  ))}
                </select>
                {errors.employee && (
                  <p className='mt-1 text-sm text-red-500'>{errors.employee}</p>
                )}
              </div>
            )}

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

            {/* 예상 휴가 일수 표시 */}
            {(formData.start_date && (isHalfDay || formData.end_date)) && (
              <div className='rounded-lg bg-blue-50 p-3'>
                <div className='flex items-center'>
                  <FiCalendar className='mr-2 h-4 w-4 text-blue-600' />
                  <span className='text-sm font-medium text-blue-900'>
                    예상 {isWorkMode ? '근무' : '휴가'} 일수: {calculateVacationDays()}일
                  </span>
                </div>
              </div>
            )}

            {/* 사유 (휴가 모드에서만) */}
            {!isWorkMode && (
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
            )}
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
                className={`flex flex-1 items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                  isWorkMode
                    ? 'bg-orange-600 hover:bg-orange-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}>
                {createVacationMutation.isPending ? (
                  <>
                    <div className='mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent'></div>
                    {isWorkMode ? '등록 중...' : '신청 중...'}
                  </>
                ) : (
                  <>
                    <FiSend className='mr-2 h-4 w-4' />
                    {isWorkMode ? '근무 등록' : '휴가 신청'}
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