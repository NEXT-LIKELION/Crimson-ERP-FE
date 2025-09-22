// src/components/modals/EmployeeDetailsModal.tsx
import React, { useState } from 'react';
import { FiX, FiEdit, FiCheck, FiXCircle, FiCalendar } from 'react-icons/fi';
import { MappedEmployee } from '../../pages/HR/HRPage';
import { ALLOWED_TABS_OPTIONS, parseVacationDays, VacationDay } from '../../api/hr';
import { useEmployee } from '../../hooks/queries/useEmployees';
import VacationCalendar from '../calendar/VacationCalendar';

interface EmployeeDetailsModalProps {
  employee: MappedEmployee;
  onClose: () => void;
  onUpdateEmployee: (updatedEmployee: MappedEmployee) => Promise<void>;
  isAdmin: boolean;
}

// 날짜 형식 변환 함수
const formatDateToKorean = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}년 ${month}월 ${day}일`;
};

const EmployeeDetailsModal: React.FC<EmployeeDetailsModalProps> = ({
  employee,
  onClose,
  onUpdateEmployee,
  isAdmin,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedEmployee, setEditedEmployee] = useState<MappedEmployee>(employee);
  const [showVacationCalendar, setShowVacationCalendar] = useState(false);

  // 실시간 직원 상세 정보 조회
  const { data: employeeDetailData, isLoading: employeeDetailLoading } = useEmployee(employee.id);
  

  // 최신 직원 정보 (휴가 데이터 포함) - API 데이터 우선 사용
  const currentEmployee = React.useMemo(() => {
    if (employeeDetailData?.data) {
      // API 데이터를 MappedEmployee 형식으로 변환
      const apiData = employeeDetailData.data;

      const mappedEmployee = {
        ...employee, // 기본 데이터
        // API에서 받은 최신 데이터로 업데이트
        first_name: apiData.first_name,
        email: apiData.email,
        phone: apiData.contact || '',
        role: apiData.role,
        status: !apiData.is_active ? 'terminated' : (apiData.status?.toLowerCase() === 'approved' ? 'active' : 'denied') as 'active' | 'terminated' | 'denied',
        annual_leave_days: apiData.annual_leave_days,
        allowed_tabs: apiData.allowed_tabs || [], // API 데이터 우선 사용
        hire_date: apiData.hire_date || '',
        remaining_leave_days: parseFloat(apiData.remaining_leave_days) || 0,
        vacation_days: typeof apiData.vacation_days === 'string' ? [] as VacationDay[] : apiData.vacation_days as VacationDay[],
        vacation_pending_days: typeof apiData.vacation_pending_days === 'string' ? [] as VacationDay[] : apiData.vacation_pending_days as VacationDay[],
        gender: apiData.gender && ['MALE', 'FEMALE'].includes(apiData.gender)
          ? apiData.gender
          : undefined, // gender 필드 타입 검증
      };
      
      return mappedEmployee;
    }
    return employee;
  }, [employeeDetailData?.data, employee]);

  // 최신 데이터로 editedEmployee 동기화
  React.useEffect(() => {
    setEditedEmployee(currentEmployee);
  }, [currentEmployee]);

  // 모달이 열릴 때마다 편집 모드 종료
  React.useEffect(() => {
    setIsEditing(false);
  }, [employee.id]);

  // 휴가 데이터 파싱
  const vacationDays = parseVacationDays(currentEmployee.vacation_days as string | VacationDay[]);
  const vacationPendingDays = parseVacationDays(currentEmployee.vacation_pending_days as string | VacationDay[]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditedEmployee((prev: MappedEmployee) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAllowedTabsChange = (tabValue: string) => {
    if (editedEmployee.role === 'MANAGER') return; // MANAGER는 수정 불가

    const currentTabs = editedEmployee.allowed_tabs || [];
    const newTabs = currentTabs.includes(tabValue)
      ? currentTabs.filter((tab) => tab !== tabValue)
      : [...currentTabs, tabValue];

    setEditedEmployee((prev) => ({
      ...prev,
      allowed_tabs: newTabs,
    }));
  };

  const handleSave = async () => {
    // 필수 필드 검증
    if (!editedEmployee.email?.trim()) {
      alert('이메일을 입력해주세요.');
      return;
    }

    if (!editedEmployee.phone?.trim()) {
      alert('전화번호를 입력해주세요.');
      return;
    }

    if (!editedEmployee.first_name?.trim()) {
      alert('이름을 입력해주세요.');
      return;
    }


    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editedEmployee.email)) {
      alert('올바른 이메일 형식을 입력해주세요.');
      return;
    }

    // 연차 일수 검증
    if (editedEmployee.annual_leave_days < 0 || editedEmployee.annual_leave_days > 365) {
      alert('연차 일수는 0일에서 365일 사이여야 합니다.');
      return;
    }

    // MANAGER가 아닌 경우 권한 체크
    if (
      editedEmployee.role !== 'MANAGER' &&
      (!editedEmployee.allowed_tabs || editedEmployee.allowed_tabs.length === 0)
    ) {
      alert('최소 하나의 접근 권한을 선택해주세요.');
      return;
    }

    try {
      await onUpdateEmployee(editedEmployee);
      setIsEditing(false);
      alert('직원 정보가 성공적으로 업데이트되었습니다.');
    } catch (error) {
      console.error('직원 정보 업데이트 실패:', error);
      alert('직원 정보 업데이트에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const handleCancel = () => {
    setEditedEmployee(currentEmployee); // 최신 데이터로 리셋
    setIsEditing(false);
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
        className='flex h-full max-h-[90vh] w-full max-w-md flex-col rounded-lg border border-gray-200 bg-white shadow-lg'
        onClick={(e) => e.stopPropagation()}>
        {/* 헤더 - 고정 */}
        <div className='flex flex-shrink-0 items-center justify-between border-b border-gray-200 px-6 py-4'>
          <h2 className='text-lg font-semibold text-gray-900'>직원 정보</h2>
          <button onClick={onClose} className='text-gray-400 transition-colors hover:text-gray-600'>
            <FiX className='h-5 w-5' />
          </button>
        </div>

        {/* 콘텐츠 - 스크롤 가능 */}
        <div className='flex-1 overflow-y-auto p-6'>
          <div className='space-y-4'>
            {/* 이름 */}
            <div>
              <label className='mb-1 block text-sm font-medium text-gray-700'>이름</label>
              {isEditing && isAdmin ? (
                <input
                  type='text'
                  name='first_name'
                  value={editedEmployee.first_name}
                  onChange={handleChange}
                  className='w-full rounded-md border border-gray-300 px-3 py-2 focus:border-rose-500 focus:ring-2 focus:ring-rose-500 focus:outline-none'
                  placeholder='이름을 입력하세요'
                />
              ) : (
                <span className='text-gray-900'>{currentEmployee.first_name}</span>
              )}
            </div>

            {/* 직급 */}
            <div>
              <label className='mb-1 block text-sm font-medium text-gray-700'>직급</label>
              {isEditing && isAdmin ? (
                <select
                  name='role'
                  value={editedEmployee.role}
                  onChange={handleChange}
                  className='w-full rounded-md border border-gray-300 px-3 py-2 focus:border-rose-500 focus:ring-2 focus:ring-rose-500 focus:outline-none'>
                  <option value='STAFF'>직원</option>
                  <option value='INTERN'>인턴</option>
                </select>
              ) : (
                <div className='flex items-center justify-between'>
                  <span className='text-gray-900'>{employee.position}</span>
                  {isEditing && !isAdmin && (
                    <span className='rounded bg-gray-100 px-2 py-1 text-xs text-gray-500'>
                      수정 불가
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* 성별 */}
            <div>
              <label className='mb-1 block text-sm font-medium text-gray-700'>성별</label>
              {isEditing && isAdmin ? (
                <select
                  name='gender'
                  value={editedEmployee.gender || ''}
                  onChange={handleChange}
                  className='w-full rounded-md border border-gray-300 px-3 py-2 focus:border-rose-500 focus:ring-2 focus:ring-rose-500 focus:outline-none'>
                  <option value=''>선택 안함</option>
                  <option value='MALE'>남성</option>
                  <option value='FEMALE'>여성</option>
                </select>
              ) : (
                <span className='text-gray-900'>
                  {currentEmployee.gender === 'MALE' ? '남성' :
                   currentEmployee.gender === 'FEMALE' ? '여성' : '미입력'}
                </span>
              )}
            </div>

            {/* 입사일 */}
            <div>
              <label className='mb-1 block text-sm font-medium text-gray-700'>입사일</label>
              {isEditing && isAdmin ? (
                <input
                  type='date'
                  name='hire_date'
                  value={editedEmployee.hire_date}
                  onChange={handleChange}
                  className='w-full rounded-md border border-gray-300 px-3 py-2 focus:border-rose-500 focus:ring-2 focus:ring-rose-500 focus:outline-none'
                />
              ) : (
                <span className='text-gray-900'>{formatDateToKorean(currentEmployee.hire_date)}</span>
              )}
            </div>

            {/* 이메일 */}
            <div>
              <label className='mb-1 block text-sm font-medium text-gray-700'>이메일</label>
              {isEditing ? (
                <input
                  type='email'
                  name='email'
                  value={editedEmployee.email}
                  onChange={handleChange}
                  className='w-full rounded-md border border-gray-300 px-3 py-2 focus:border-rose-500 focus:ring-2 focus:ring-rose-500 focus:outline-none'
                  placeholder='이메일 주소를 입력하세요'
                />
              ) : (
                <span className='text-gray-900'>{employee.email}</span>
              )}
            </div>

            {/* 전화번호 */}
            <div>
              <label className='mb-1 block text-sm font-medium text-gray-700'>전화번호</label>
              {isEditing ? (
                <input
                  type='tel'
                  name='phone'
                  value={editedEmployee.phone}
                  onChange={handleChange}
                  className='w-full rounded-md border border-gray-300 px-3 py-2 focus:border-rose-500 focus:ring-2 focus:ring-rose-500 focus:outline-none'
                  placeholder='전화번호를 입력하세요'
                />
              ) : (
                <span className='text-gray-900'>{employee.phone}</span>
              )}
            </div>

            {/* 연차 일수 */}
            <div>
              <label className='mb-1 block text-sm font-medium text-gray-700'>연차 일수</label>
              {isEditing && isAdmin ? (
                <input
                  type='number'
                  name='annual_leave_days'
                  value={editedEmployee.annual_leave_days}
                  onChange={handleChange}
                  min='0'
                  max='365'
                  className='w-full rounded-md border border-gray-300 px-3 py-2 focus:border-rose-500 focus:ring-2 focus:ring-rose-500 focus:outline-none'
                  placeholder='연차 일수를 입력하세요'
                />
              ) : (
                <span className='text-gray-900'>
                  {currentEmployee.annual_leave_days}일 (남은 연차:{' '}
                  {typeof currentEmployee.remaining_leave_days === 'string'
                    ? parseFloat(currentEmployee.remaining_leave_days) || 0
                    : currentEmployee.remaining_leave_days}
                  일)
                </span>
              )}
            </div>

            {/* 권한 탭 관리 - MANAGER가 아닌 경우만 표시 */}
            {employee.role !== 'MANAGER' && (
              <div>
                <label className='mb-2 block text-sm font-medium text-gray-700'>접근 권한</label>
                {isEditing && isAdmin ? (
                  <div className='space-y-2'>
                    {ALLOWED_TABS_OPTIONS.map((tab) => (
                      <label key={tab.value} className='flex items-center'>
                        <input
                          type='checkbox'
                          checked={(editedEmployee.allowed_tabs || []).includes(tab.value)}
                          onChange={() => handleAllowedTabsChange(tab.value)}
                          className='mr-2 h-4 w-4 rounded border-gray-300 text-rose-600 focus:ring-rose-500'
                        />
                        <span className='text-sm text-gray-700'>{tab.label}</span>
                      </label>
                    ))}
                    <p className='text-xs text-gray-500 mt-2'>
                      * HR 관리 권한은 Manager에게만 제공됩니다.
                    </p>
                  </div>
                ) : (
                  <div className='flex flex-wrap gap-1'>

                    
                    {(currentEmployee.allowed_tabs || [])
                      .filter((tab) => tab !== 'HR') // HR 권한은 제외
                      .map((tab) => {
                        // 알려진 권한인지 확인
                        const tabOption = ALLOWED_TABS_OPTIONS.find((opt) => opt.value === tab);
                        
                        // 알려진 권한인 경우
                        if (tabOption) {
                          return (
                            <span
                              key={tab}
                              className='inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800'>
                              {tabOption.label}
                            </span>
                          );
                        }
                        
                        // 알 수 없는 권한인 경우 (디버깅용)
                        return (
                          <span
                            key={tab}
                            className='inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800'>
                            {tab} (알수없음)
                          </span>
                        );
                      })}
                      
                    {(!currentEmployee.allowed_tabs || 
                      currentEmployee.allowed_tabs.filter(tab => tab !== 'HR').length === 0) && (
                      <span className='text-sm text-gray-500'>권한이 설정되지 않았습니다</span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

        {/* 버튼 영역 - 고정 */}
        <div className='flex-shrink-0 border-t border-gray-200 px-6 py-4'>
          <div className='space-y-3'>
            {/* 휴가 캘린더 버튼 */}
            <button
              onClick={() => setShowVacationCalendar(true)}
              disabled={employeeDetailLoading}
              className='flex w-full items-center justify-center rounded-md bg-blue-100 px-4 py-2 text-sm text-blue-700 hover:bg-blue-200 disabled:cursor-not-allowed disabled:opacity-50'>
              <FiCalendar className='mr-2 h-4 w-4' />
              {employeeDetailLoading ? '로딩 중...' : '휴가 캘린더 보기'}
            </button>


            {/* 수정 관련 버튼들 */}
            {isAdmin &&
              (!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className='flex w-full items-center justify-center rounded-md bg-rose-500 px-4 py-2 text-sm text-white hover:bg-rose-600'>
                  <FiEdit className='mr-2 h-4 w-4' />
                  정보 수정
                </button>
              ) : (
                <div className='space-y-2'>
                  <button
                    onClick={handleSave}
                    className='flex w-full items-center justify-center rounded-md bg-green-500 px-4 py-2 text-sm text-white hover:bg-green-600'>
                    <FiCheck className='mr-2 h-4 w-4' />
                    저장
                  </button>
                  <button
                    onClick={handleCancel}
                    className='flex w-full items-center justify-center rounded-md bg-gray-500 px-4 py-2 text-sm text-white hover:bg-gray-600'>
                    <FiXCircle className='mr-2 h-4 w-4' />
                    취소
                  </button>
                </div>
              ))}

            {/* 닫기 버튼 */}
            <button
              onClick={onClose}
              className='w-full rounded-md bg-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-300'>
              닫기
            </button>
          </div>
        </div>
      </div>

      {/* 휴가 캘린더 모달 */}
      {showVacationCalendar && (
        <VacationCalendar
          vacationDays={vacationDays}
          vacationPendingDays={vacationPendingDays}
          onClose={() => setShowVacationCalendar(false)}
          employeeName={employee.first_name}
        />
      )}
    </div>
  );
};

export default EmployeeDetailsModal;
