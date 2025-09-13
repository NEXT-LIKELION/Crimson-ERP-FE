import React, { useState } from 'react';
import { FiX, FiUser, FiChevronRight, FiUserCheck } from 'react-icons/fi';
import { MappedEmployee } from '../../pages/HR/HRPage';
import { registerEmployee, ALLOWED_TABS_OPTIONS, fetchEmployees, patchEmployee, checkUsernameAvailability } from '../../api/hr';
import { getAccessToken } from '../../utils/localStorage';

interface EmployeeRegistrationModalProps {
  onClose: () => void;
  onRegisterComplete: (newEmployee: MappedEmployee) => void;
}

interface Step1Data {
  username: string;
  password: string;
  confirmPassword: string;
  first_name: string;  // 이름 추가
  email: string;       // 이메일 추가
  contact: string;     // 연락처 추가
  gender?: 'MALE' | 'FEMALE';  // 성별 추가
}

interface Step2Data {
  position: string;
  hire_date: string;
  annual_leave_days: number;
  allowed_tabs: string[];
}

const EmployeeRegistrationModal: React.FC<EmployeeRegistrationModalProps> = ({
  onClose,
  onRegisterComplete,
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [createdEmployeeId, setCreatedEmployeeId] = useState<number | null>(null); // 1단계에서 생성된 직원 ID
  
  // 사용자명 중복 체크 관련 상태
  const [usernameCheckStatus, setUsernameCheckStatus] = useState<'idle' | 'checking' | 'available' | 'unavailable'>('idle');
  const [checkedUsername, setCheckedUsername] = useState<string>('');
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);

  // 1단계 데이터 (기본 계정 생성 정보)
  const [step1Data, setStep1Data] = useState<Step1Data>({
    username: '',
    password: '',
    confirmPassword: '',
    first_name: '',  // 이름 추가
    email: '',       // 이메일 추가
    contact: '',     // 연락처 추가
    gender: undefined,  // 성별 추가 (선택 사항)
  });

  // 2단계 데이터 (HR 정보)
  const [step2Data, setStep2Data] = useState<Step2Data>({
    position: 'STAFF', // 기본값: 직원
    hire_date: '',
    annual_leave_days: 24, // 기본 24일
    allowed_tabs: [],
  });

  // 직책 옵션
  const positionOptions = [
    { value: 'STAFF', label: '직원' },
    { value: 'MANAGER', label: '대표' },
    { value: 'INTERN', label: '인턴' },
  ];

  // 사용자명 중복 체크 함수
  const handleUsernameCheck = async () => {
    const username = step1Data.username.trim();
    
    if (!username) {
      setErrorMessage('사용자 아이디를 입력해주세요.');
      return;
    }

    setIsCheckingUsername(true);
    setUsernameCheckStatus('checking');
    setErrorMessage('');

    try {
      const result = await checkUsernameAvailability(username);
      setCheckedUsername(username);
      setUsernameCheckStatus(result.available ? 'available' : 'unavailable');
      
      if (!result.available) {
        setErrorMessage(result.message);
      }
    } catch (error) {
      setUsernameCheckStatus('idle');
      setErrorMessage(error instanceof Error ? error.message : '중복 확인 중 오류가 발생했습니다.');
    } finally {
      setIsCheckingUsername(false);
    }
  };

  // 1단계 폼 처리
  const handleStep1Change = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setStep1Data((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    // 사용자명이 변경되면 중복 체크 상태 초기화
    if (name === 'username') {
      if (value !== checkedUsername) {
        setUsernameCheckStatus('idle');
        setCheckedUsername('');
      }
    }
  };

  // 2단계 폼 처리
  const handleStep2Change = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setStep2Data((prev) => ({
      ...prev,
      [name]: name === 'annual_leave_days' ? parseInt(value) || 0 : value,
    }));
  };

  // 허용된 탭 변경 처리
  const handleAllowedTabsChange = (tabValue: string) => {
    const currentTabs = step2Data.allowed_tabs;
    const newTabs = currentTabs.includes(tabValue)
      ? currentTabs.filter((tab) => tab !== tabValue)
      : [...currentTabs, tabValue];

    setStep2Data((prev) => ({
      ...prev,
      allowed_tabs: newTabs,
    }));
  };

  // 1단계 검증 (기본 계정 생성 정보)
  const validateStep1 = (): boolean => {
    if (!step1Data.username || !step1Data.password || !step1Data.confirmPassword || 
        !step1Data.first_name || !step1Data.email || !step1Data.contact) {
      setErrorMessage('모든 필드를 입력해주세요.');
      return false;
    }

    if (step1Data.password !== step1Data.confirmPassword) {
      setErrorMessage('비밀번호가 일치하지 않습니다.');
      return false;
    }

    if (step1Data.password.length < 6) {
      setErrorMessage('비밀번호는 최소 6자 이상이어야 합니다.');
      return false;
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(step1Data.email)) {
      setErrorMessage('올바른 이메일 형식을 입력해주세요.');
      return false;
    }

    // 사용자명 중복 체크 완료 여부 확인
    if (usernameCheckStatus !== 'available') {
      setErrorMessage('사용자 아이디 중복 확인을 완료해주세요.');
      return false;
    }

    // 중복 체크한 아이디와 현재 입력된 아이디가 다른 경우
    if (checkedUsername !== step1Data.username) {
      setErrorMessage('사용자 아이디가 변경되었습니다. 중복 확인을 다시 해주세요.');
      return false;
    }

    return true;
  };

  // 2단계 검증 (HR 정보)
  const validateStep2 = (): boolean => {
    if (!step2Data.hire_date) {
      setErrorMessage('입사일을 입력해주세요.');
      return false;
    }

    // 연차 일수 검증
    if (step2Data.annual_leave_days < 0 || step2Data.annual_leave_days > 365) {
      setErrorMessage('연차 일수는 0일에서 365일 사이여야 합니다.');
      return false;
    }

    // 권한 검증 (MANAGER가 아닌 경우)
    if (step2Data.position !== 'MANAGER' && step2Data.allowed_tabs.length === 0) {
      setErrorMessage('최소 하나의 접근 권한을 선택해주세요.');
      return false;
    }

    return true;
  };

  // 다음 단계로 이동 (즉시 1단계 signup 실행)
  const handleNextStep = async () => {
    setErrorMessage('');

    if (!validateStep1()) {
      return;
    }

    // 인증 상태 확인
    const accessToken = getAccessToken();
    if (!accessToken) {
      setErrorMessage('로그인이 필요합니다. 다시 로그인해주세요.');
      return;
    }


    setIsLoading(true);

    try {
      // 1단계: 기본 계정 생성 (authentication/signup)
      const signupData = {
        username: step1Data.username,
        email: step1Data.email,
        password: step1Data.password,
        first_name: step1Data.first_name,
        contact: step1Data.contact,
      };
      
      let response;
      try {
        response = await registerEmployee(signupData);
      } catch (signupError: unknown) {
        let errorMessage = '계정 생성에 실패했습니다.';
        let specificField = '';
        
        if (signupError && typeof signupError === 'object' && 'response' in signupError) {
          const errorResponse = signupError.response as { data?: unknown };
          const errorData = errorResponse?.data;
          
          if (typeof errorData === 'string') {
            errorMessage = errorData;
          } else if (errorData && typeof errorData === 'object') {
            const errorObj = errorData as Record<string, unknown>;
            
            if ('message' in errorObj && typeof errorObj.message === 'string') {
              errorMessage = errorObj.message;
            } else if ('detail' in errorObj && typeof errorObj.detail === 'string') {
              errorMessage = errorObj.detail;
            } else {
              // 필드별 에러 처리
              const fieldErrors: string[] = [];
              
              for (const [field, errors] of Object.entries(errorObj)) {
                // 이메일 중복은 에러로 처리하지 않음 (등록 허용)
                if (field === 'email' && (
                  (Array.isArray(errors) && errors.some(err => typeof err === 'string' && (err.includes('already exists') || err.includes('must be unique')))) ||
                  (typeof errors === 'string' && (errors.includes('already exists') || errors.includes('must be unique')))
                )) {
                  continue; // 이메일 중복 에러는 무시
                }
                
                let fieldErrorMsg = '';
                
                if (Array.isArray(errors)) {
                  fieldErrorMsg = errors.join(', ');
                } else if (typeof errors === 'string') {
                  fieldErrorMsg = errors;
                }
                
                // 한국어로 번역
                if (fieldErrorMsg.includes('already exists') || fieldErrorMsg.includes('must be unique')) {
                  if (field === 'username') {
                    specificField = '사용자 아이디';
                    fieldErrorMsg = '이미 사용 중인 아이디입니다.';
                  } else {
                    fieldErrorMsg = '이미 사용 중인 값입니다.';
                  }
                }
                
                if (fieldErrorMsg) {
                  fieldErrors.push(fieldErrorMsg);
                }
              }
              
              if (fieldErrors.length > 0) {
                errorMessage = fieldErrors.join(' | ');
              }
            }
          }
        }
        
        // 구체적인 필드 에러가 있을 경우 팝업으로 알림
        if (specificField) {
          alert(`❌ ${specificField} 오류\n\n${errorMessage}\n\n다른 값을 입력해주세요.`);
        }
        
        throw new Error(errorMessage);
      }
      
      // 새로 생성된 직원 ID 찾기
      const newUserData = response.data.user;
      
      let employeesData;
      try {
        const employeesResponse = await fetchEmployees();
        employeesData = employeesResponse;
      } catch (fetchError: unknown) {
        const message = fetchError instanceof Error ? fetchError.message : '알 수 없는 오류';
        throw new Error(`직원 목록 조회 실패: ${message}`);
      }
      
      const newEmployeeRecord = employeesData.data?.find((emp: { username: string; id: number }) => emp.username === step1Data.username);
      
      if (!newEmployeeRecord) {
        if (newUserData && newUserData.id) {
          setCreatedEmployeeId(newUserData.id);
        } else {
          throw new Error(`새로 생성된 직원을 찾을 수 없습니다. (${step1Data.username})`);
        }
      } else {
        setCreatedEmployeeId(newEmployeeRecord.id);
      }
      
      setCurrentStep(2);
      
    } catch (error) {
      setErrorMessage(
        error instanceof Error 
          ? error.message
          : '계정 생성 중 오류가 발생했습니다.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // 이전 단계로 이동 (계정이 이미 생성된 경우 경고)
  const handlePrevStep = () => {
    if (createdEmployeeId) {
      const confirmBack = window.confirm(
        '계정이 이미 생성되었습니다.\n\n이전 단계로 돌아가면 새로운 계정을 다시 생성해야 합니다.\n\n정말로 돌아가시겠습니까?'
      );
      if (!confirmBack) {
        return;
      }
      // 사용자가 확인하면 상태 초기화
      setCreatedEmployeeId(null);
    }
    setErrorMessage('');
    setCurrentStep(1);
  };

  // 등록 완료 (2단계 PATCH만 실행)
  const handleSubmit = async () => {
    setErrorMessage('');

    if (!validateStep2()) {
      return;
    }

    if (!createdEmployeeId) {
      setErrorMessage('직원 아이디를 찾을 수 없습니다. 다시 시도해주세요.');
      return;
    }

    setIsLoading(true);

    try {
      // 2단계: HR 정보 업데이트 (hr/employees/{id} PATCH)
      const hrUpdateData = {
        role: step2Data.position as 'MANAGER' | 'STAFF' | 'INTERN',
        hire_date: step2Data.hire_date,
        annual_leave_days: step2Data.annual_leave_days,
        allowed_tabs: step2Data.position === 'MANAGER' ? [] : step2Data.allowed_tabs,
        gender: step1Data.gender, // 성별 정보 추가
      };
      
      try {
        await patchEmployee(createdEmployeeId, hrUpdateData);
      } catch (patchError: unknown) {
        let errorMessage = 'HR 정보 업데이트 실패';
        if (patchError && typeof patchError === 'object' && 'response' in patchError) {
          const response = patchError.response as { data?: { message?: string } };
          errorMessage = response?.data?.message || errorMessage;
        } else if (patchError instanceof Error) {
          errorMessage = patchError.message;
        }
        throw new Error(errorMessage);
      }

      // 2단계 PATCH 완료 후 새 직원 데이터 구성
      const newEmployee: MappedEmployee = {
        id: createdEmployeeId, // 1단계에서 생성된 직원 ID
        name: step1Data.first_name,      // 1단계에서 가져옴
        username: step1Data.username, // API 호출 시 사용할 실제 username
        role: step2Data.position as 'MANAGER' | 'STAFF' | 'INTERN',
        position:
          step2Data.position === 'STAFF'
            ? '직원'
            : step2Data.position === 'INTERN'
              ? '인턴'
              : '대표',
        department: step2Data.position === 'MANAGER' ? '경영진' : '일반',
        email: step1Data.email,          // 1단계에서 가져옴
        phone: step1Data.contact,        // 1단계에서 가져옴
        status: 'denied', // 새로 등록된 직원은 승인 대기 상태
        hire_date: step2Data.hire_date,
        annual_leave_days: step2Data.annual_leave_days,
        allowed_tabs: step2Data.position === 'MANAGER' 
          ? []
          : Array.isArray(step2Data.allowed_tabs)
            ? step2Data.allowed_tabs
            : [],
        remaining_leave_days: step2Data.annual_leave_days, // 초기에는 전체 연차가 남은 연차
        vacation_days: [],
        vacation_pending_days: [],
        gender: step1Data.gender, // 성별 정보 추가
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // 성공 시 콜백 호출
      onRegisterComplete(newEmployee);

      alert(`✅ 직원 등록 완료!\n\n직원: ${step1Data.first_name} (${step1Data.username})\n직책: ${step2Data.position}\n권한: ${step2Data.allowed_tabs.join(', ') || '없음'}\n\n승인 후 로그인 가능합니다.`);
      onClose();
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error 
          ? error.message
          : 'HR 정보 설정 중 오류가 발생했습니다.'
      );
      alert('계정은 생성되었지만 HR 정보 설정에 실패했습니다.\nHR 관리에서 수동으로 설정해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  // 배경 클릭 시 모달 닫기 비활성화
  const handleBackdropClick = () => {
    // 배경 클릭으로 모달이 닫히지 않도록 비활성화
  };

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center p-4'
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={handleBackdropClick}>
      <div
        className='flex max-h-[85vh] w-full max-w-md flex-col rounded-xl border border-gray-200 bg-white shadow-lg'
        onClick={(e) => e.stopPropagation()}>
        {/* 헤더 */}
        <div className='flex items-center justify-between border-b border-gray-200 px-6 py-4'>
          <div className='flex items-center'>
            <div className='mr-3 flex h-10 w-10 items-center justify-center rounded-lg bg-rose-100'>
              <FiUser className='h-5 w-5 text-rose-600' />
            </div>
            <div>
              <h2 className='text-lg font-semibold text-gray-900'>직원 등록</h2>
              <p className='text-sm text-gray-500'>
                {currentStep === 1 ? '계정 정보' : '상세 정보'} ({currentStep}/2)
              </p>
            </div>
          </div>
          <button onClick={onClose} className='text-gray-400 transition-colors hover:text-gray-600'>
            <FiX className='h-5 w-5' />
          </button>
        </div>

        {/* 진행 표시 바 */}
        <div className='px-6 pt-4'>
          <div className='flex items-center'>
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                currentStep >= 1 ? 'bg-rose-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
              1
            </div>
            <div
              className={`mx-2 h-1 flex-1 ${currentStep >= 2 ? 'bg-rose-600' : 'bg-gray-200'}`}
            />
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                currentStep >= 2 ? 'bg-rose-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
              2
            </div>
          </div>
        </div>

        {/* 콘텐츠 */}
        <div className='flex-1 overflow-y-auto px-6 py-4'>
          {currentStep === 1 ? (
            /* 1단계: 계정 정보 */
            <div className='space-y-4'>
              <div className='mb-6 text-center'>
                <h3 className='mb-2 text-lg font-semibold text-gray-900'>1단계: 기본 계정 생성</h3>
              </div>

              <div>
                <label htmlFor='username' className='mb-2 block text-sm font-medium text-gray-700'>
                  사용자 아이디 <span className='text-red-500'>*</span>
                </label>
                <div className='flex gap-2'>
                  <input
                    id='username'
                    name='username'
                    type='text'
                    value={step1Data.username}
                    onChange={handleStep1Change}
                    className={`flex-1 rounded-lg border px-3 py-2 focus:ring-2 focus:outline-none ${
                      usernameCheckStatus === 'available' 
                        ? 'border-green-300 focus:border-green-500 focus:ring-green-500' 
                        : usernameCheckStatus === 'unavailable'
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:border-rose-500 focus:ring-rose-500'
                    }`}
                    placeholder='로그인 아이디를 입력하세요'
                  />
                  <button
                    type='button'
                    onClick={handleUsernameCheck}
                    disabled={isCheckingUsername || !step1Data.username.trim()}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      usernameCheckStatus === 'available'
                        ? 'bg-green-100 text-green-700 border border-green-300'
                        : usernameCheckStatus === 'unavailable'
                        ? 'bg-red-100 text-red-700 border border-red-300'
                        : 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500'
                    } disabled:cursor-not-allowed`}>
                    {isCheckingUsername ? (
                      <div className='flex items-center'>
                        <div className='mr-1 h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent'></div>
                        확인중
                      </div>
                    ) : usernameCheckStatus === 'available' ? (
                      '사용가능'
                    ) : usernameCheckStatus === 'unavailable' ? (
                      '사용불가'
                    ) : (
                      '중복확인'
                    )}
                  </button>
                </div>
                {/* 중복 체크 결과 메시지 */}
                {usernameCheckStatus === 'available' && (
                  <p className='mt-1 text-sm text-green-600'>사용 가능한 아이디입니다.</p>
                )}
              </div>

              <div>
                <label htmlFor='password' className='mb-2 block text-sm font-medium text-gray-700'>
                  비밀번호 <span className='text-red-500'>*</span>
                </label>
                <input
                  id='password'
                  name='password'
                  type='password'
                  value={step1Data.password}
                  onChange={handleStep1Change}
                  className='w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-rose-500 focus:ring-2 focus:ring-rose-500 focus:outline-none'
                  placeholder='비밀번호를 입력하세요 (최소 6자)'
                />
              </div>

              <div>
                <label
                  htmlFor='confirmPassword'
                  className='mb-2 block text-sm font-medium text-gray-700'>
                  비밀번호 확인 <span className='text-red-500'>*</span>
                </label>
                <input
                  id='confirmPassword'
                  name='confirmPassword'
                  type='password'
                  value={step1Data.confirmPassword}
                  onChange={handleStep1Change}
                  className={`w-full rounded-lg border px-3 py-2 focus:border-rose-500 focus:ring-2 focus:outline-none ${
                    step1Data.confirmPassword && step1Data.password !== step1Data.confirmPassword
                      ? 'border-red-300 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-rose-500'
                  }`}
                  placeholder='비밀번호를 다시 입력하세요'
                />
                {step1Data.confirmPassword && step1Data.password !== step1Data.confirmPassword && (
                  <p className='mt-1 text-sm text-red-500'>비밀번호가 일치하지 않습니다.</p>
                )}
              </div>

              {/* 이름 필드 추가 */}
              <div>
                <label htmlFor='first_name' className='mb-2 block text-sm font-medium text-gray-700'>
                  이름 <span className='text-red-500'>*</span>
                </label>
                <input
                  id='first_name'
                  name='first_name'
                  type='text'
                  value={step1Data.first_name}
                  onChange={handleStep1Change}
                  className='w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-rose-500 focus:ring-2 focus:ring-rose-500 focus:outline-none'
                  placeholder='이름을 입력하세요'
                />
              </div>

              {/* 이메일 필드 추가 */}
              <div>
                <label htmlFor='email' className='mb-2 block text-sm font-medium text-gray-700'>
                  이메일 <span className='text-red-500'>*</span>
                </label>
                <input
                  id='email'
                  name='email'
                  type='email'
                  value={step1Data.email}
                  onChange={handleStep1Change}
                  className='w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-rose-500 focus:ring-2 focus:ring-rose-500 focus:outline-none'
                  placeholder='이메일 주소를 입력하세요'
                />
              </div>

              {/* 연락처 필드 추가 */}
              <div>
                <label htmlFor='contact' className='mb-2 block text-sm font-medium text-gray-700'>
                  전화번호 <span className='text-red-500'>*</span>
                </label>
                <input
                  id='contact'
                  name='contact'
                  type='tel'
                  value={step1Data.contact}
                  onChange={handleStep1Change}
                  className='w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-rose-500 focus:ring-2 focus:ring-rose-500 focus:outline-none'
                  placeholder='전화번호를 입력하세요 (010-0000-0000)'
                />
              </div>

              {/* 성별 필드 추가 */}
              <div>
                <label htmlFor='gender' className='mb-2 block text-sm font-medium text-gray-700'>
                  성별
                </label>
                <select
                  id='gender'
                  name='gender'
                  value={step1Data.gender || ''}
                  onChange={handleStep1Change}
                  className='w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-rose-500 focus:ring-2 focus:ring-rose-500 focus:outline-none'>
                  <option value=''>선택 안함</option>
                  <option value='MALE'>남성</option>
                  <option value='FEMALE'>여성</option>
                </select>
              </div>
            </div>
          ) : (
            /* 2단계: 직원 상세정보 */
            <div className='space-y-4'>
              <div className='mb-6 text-center'>
                <h3 className='mb-2 text-lg font-semibold text-gray-900'>2단계: HR 정보 설정</h3>
              </div>

              {/* 이름, 이메일, 연락처는 1단계로 이동됨 */}

              <div>
                <label htmlFor='position' className='mb-2 block text-sm font-medium text-gray-700'>
                  직책 <span className='text-red-500'>*</span>
                </label>
                <select
                  id='position'
                  name='position'
                  value={step2Data.position}
                  onChange={handleStep2Change}
                  className='w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-rose-500 focus:ring-2 focus:ring-rose-500 focus:outline-none'>
                  {positionOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor='hire_date' className='mb-2 block text-sm font-medium text-gray-700'>
                  입사일 <span className='text-red-500'>*</span>
                </label>
                <input
                  id='hire_date'
                  name='hire_date'
                  type='date'
                  value={step2Data.hire_date}
                  onChange={handleStep2Change}
                  className='w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-rose-500 focus:ring-2 focus:ring-rose-500 focus:outline-none'
                  style={{
                    position: 'relative',
                    WebkitAppearance: 'none'
                  }}
                />
                <style dangerouslySetInnerHTML={{
                  __html: `
                    input[type="date"]::-webkit-calendar-picker-indicator {
                      position: absolute;
                      top: 0;
                      left: 0;
                      width: 100%;
                      height: 100%;
                      opacity: 0;
                      cursor: pointer;
                    }
                  `
                }} />
              </div>

              <div>
                <label
                  htmlFor='annual_leave_days'
                  className='mb-2 block text-sm font-medium text-gray-700'>
                  연차 일수 <span className='text-red-500'>*</span>
                </label>
                <input
                  id='annual_leave_days'
                  name='annual_leave_days'
                  type='number'
                  min='0'
                  max='365'
                  value={step2Data.annual_leave_days}
                  onChange={handleStep2Change}
                  className='w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-rose-500 focus:ring-2 focus:ring-rose-500 focus:outline-none'
                  placeholder='연차 일수를 입력하세요'
                />
              </div>

              {/* 권한 탭 관리 - STAFF/INTERN만 표시 */}
              {step2Data.position !== 'MANAGER' && (
                <div>
                  <label className='mb-2 block text-sm font-medium text-gray-700'>
                    접근 권한 <span className='text-red-500'>*</span>
                  </label>
                  <div className='space-y-2'>
                    {ALLOWED_TABS_OPTIONS.map((tab) => (
                      <label key={tab.value} className='flex items-center'>
                        <input
                          type='checkbox'
                          checked={step2Data.allowed_tabs.includes(tab.value)}
                          onChange={() => handleAllowedTabsChange(tab.value)}
                          className='mr-2 h-4 w-4 rounded border-gray-300 text-rose-600 focus:ring-rose-500'
                        />
                        <span className='text-sm text-gray-700'>{tab.label}</span>
                      </label>
                    ))}
                  </div>
                  {step2Data.allowed_tabs.length === 0 && (
                    <p className='mt-1 text-sm text-gray-500'>최소 하나의 권한을 선택해주세요</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 에러 메시지 */}
        {errorMessage && (
          <div className='mx-6 mb-2 rounded-lg border border-red-200 bg-red-50 p-3'>
            <p className='text-sm text-red-800'>{errorMessage}</p>
          </div>
        )}

        {/* 버튼 영역 - 고정 위치 */}
        <div className='flex-shrink-0 border-t border-gray-200 px-6 py-4'>
          {currentStep === 1 ? (
            <div className='flex gap-3'>
              <button
                onClick={onClose}
                className='flex-1 rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-300'>
                취소
              </button>
              <button
                onClick={handleNextStep}
                disabled={isLoading}
                className='flex flex-1 items-center justify-center rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed'>
                {isLoading ? (
                  <>
                    <div className='mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent'></div>
                    계정 생성 중...
                  </>
                ) : (
                  <>
                    다음 단계
                    <FiChevronRight className='ml-1 h-4 w-4' />
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className='flex gap-3'>
              <button
                onClick={handlePrevStep}
                className='flex-1 rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-300'>
                이전 단계
              </button>
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className='flex flex-1 items-center justify-center rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50'>
                {isLoading ? (
                  <>
                    <div className='mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent'></div>
                    등록 중...
                  </>
                ) : (
                  <>
                    <FiUserCheck className='mr-2 h-4 w-4' />
                    등록 완료
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeRegistrationModal;
