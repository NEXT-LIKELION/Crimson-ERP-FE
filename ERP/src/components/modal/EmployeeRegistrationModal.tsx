import React, { useState } from 'react';
import { FiX, FiUser, FiChevronRight, FiCalendar, FiUserCheck } from 'react-icons/fi';
import { MappedEmployee } from '../../pages/HR/HRPage';
import { registerEmployee, EmployeeRegistrationData, ALLOWED_TABS_OPTIONS } from '../../api/hr';

interface EmployeeRegistrationModalProps {
    onClose: () => void;
    onRegisterComplete: (newEmployee: MappedEmployee) => void;
}

interface Step1Data {
    username: string;
    password: string;
    confirmPassword: string;
}

interface Step2Data {
    first_name: string;
    email: string;
    contact: string;
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

    // 1단계 데이터 (아이디, 비밀번호)
    const [step1Data, setStep1Data] = useState<Step1Data>({
        username: '',
        password: '',
        confirmPassword: '',
    });

    // 2단계 데이터 (직원 상세정보)
    const [step2Data, setStep2Data] = useState<Step2Data>({
        first_name: '',
        email: '',
        contact: '',
        position: 'STAFF', // 기본값: 직원
        hire_date: '',
        annual_leave_days: 24, // 기본 24일
        allowed_tabs: [],
    });

    // 직책 옵션
    const positionOptions = [
        { value: 'STAFF', label: '직원' },
        { value: 'MANAGER', label: '대표' },
    ];

    // 1단계 폼 처리
    const handleStep1Change = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setStep1Data(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    // 2단계 폼 처리
    const handleStep2Change = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setStep2Data(prev => ({
            ...prev,
            [name]: name === 'annual_leave_days' ? parseInt(value) || 0 : value,
        }));
    };

    // 허용된 탭 변경 처리
    const handleAllowedTabsChange = (tabValue: string) => {
        const currentTabs = step2Data.allowed_tabs;
        const newTabs = currentTabs.includes(tabValue)
            ? currentTabs.filter(tab => tab !== tabValue)
            : [...currentTabs, tabValue];
        
        setStep2Data(prev => ({
            ...prev,
            allowed_tabs: newTabs
        }));
    };

    // 1단계 검증
    const validateStep1 = (): boolean => {
        if (!step1Data.username || !step1Data.password || !step1Data.confirmPassword) {
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

        return true;
    };

    // 2단계 검증
    const validateStep2 = (): boolean => {
        if (!step2Data.first_name || !step2Data.email || !step2Data.contact || !step2Data.hire_date) {
            setErrorMessage('모든 필드를 입력해주세요.');
            return false;
        }

        // 이메일 형식 검증
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(step2Data.email)) {
            setErrorMessage('올바른 이메일 형식을 입력해주세요.');
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

    // 다음 단계로 이동
    const handleNextStep = () => {
        setErrorMessage('');
        
        if (validateStep1()) {
            setCurrentStep(2);
        }
    };

    // 이전 단계로 이동
    const handlePrevStep = () => {
        setErrorMessage('');
        setCurrentStep(1);
    };

    // 직원 등록 완료
    const handleSubmit = async () => {
        setErrorMessage('');
        
        if (!validateStep2()) {
            return;
        }

        setIsLoading(true);

        try {
            // API 호출을 위한 데이터 구성
            const registrationData: EmployeeRegistrationData = {
                username: step1Data.username,
                password: step1Data.password,
                first_name: step2Data.first_name,
                email: step2Data.email,
                contact: step2Data.contact,
                role: step2Data.position,
                hire_date: step2Data.hire_date,
                annual_leave_days: step2Data.annual_leave_days,
                allowed_tabs: step2Data.position === 'MANAGER' ? ['INVENTORY', 'ORDER', 'SUPPLIER', 'HR'] : step2Data.allowed_tabs,
            };

            console.log('직원 등록 데이터:', registrationData);

            // 실제 API 호출
            const response = await registerEmployee(registrationData);
            console.log('직원 등록 응답:', response.data);

            // API 응답으로부터 새 직원 데이터 구성
            const newEmployee: MappedEmployee = {
                id: response.data.id || Date.now(), // API에서 ID를 받지 못하는 경우 임시 ID 사용
                name: step2Data.first_name,
                username: step1Data.username, // API 호출 시 사용할 실제 username
                role: step2Data.position,
                position: step2Data.position === 'STAFF' ? '직원' : step2Data.position === 'INTERN' ? '인턴' : '대표',
                department: step2Data.position === 'MANAGER' ? '경영진' : '일반',
                email: step2Data.email,
                phone: step2Data.contact,
                status: 'denied', // 새로 등록된 직원은 승인 대기 상태
                hire_date: step2Data.hire_date,
                annual_leave_days: step2Data.annual_leave_days,
                allowed_tabs: registrationData.allowed_tabs,
                remaining_leave_days: step2Data.annual_leave_days, // 초기에는 전체 연차가 남은 연차
                vacation_days: [],
                vacation_pending_days: [],
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };

            // 성공 시 콜백 호출
            onRegisterComplete(newEmployee);
            
            alert('직원 등록이 완료되었습니다. 승인 후 활성화됩니다.');
            onClose();

        } catch (error: any) {
            console.error('직원 등록 실패:', error);
            setErrorMessage(error.response?.data?.message || '직원 등록에 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    // 배경 클릭 시 모달 닫기
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
                className="w-full max-w-md bg-white rounded-xl shadow-lg border border-gray-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* 헤더 */}
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <div className="flex items-center">
                        <div className="w-10 h-10 bg-rose-100 rounded-lg flex items-center justify-center mr-3">
                            <FiUser className="w-5 h-5 text-rose-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">직원 등록</h2>
                            <p className="text-sm text-gray-500">
                                {currentStep === 1 ? '계정 정보' : '상세 정보'} ({currentStep}/2)
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <FiX className="w-5 h-5" />
                    </button>
                </div>

                {/* 진행 표시 바 */}
                <div className="px-6 pt-4">
                    <div className="flex items-center">
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                            currentStep >= 1 ? 'bg-rose-600 text-white' : 'bg-gray-200 text-gray-600'
                        }`}>
                            1
                        </div>
                        <div className={`flex-1 h-1 mx-2 ${
                            currentStep >= 2 ? 'bg-rose-600' : 'bg-gray-200'
                        }`} />
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                            currentStep >= 2 ? 'bg-rose-600 text-white' : 'bg-gray-200 text-gray-600'
                        }`}>
                            2
                        </div>
                    </div>
                </div>

                {/* 콘텐츠 */}
                <div className="p-6">
                    {currentStep === 1 ? (
                        /* 1단계: 계정 정보 */
                        <div className="space-y-4">
                            <div className="text-center mb-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">계정 정보 입력</h3>
                                <p className="text-sm text-gray-600">새 직원의 로그인 아이디와 비밀번호를 설정해주세요</p>
                            </div>

                            <div>
                                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                                    사용자 아이디 <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="username"
                                    name="username"
                                    type="text"
                                    value={step1Data.username}
                                    onChange={handleStep1Change}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                                    placeholder="로그인 아이디를 입력하세요"
                                />
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                    비밀번호 <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    value={step1Data.password}
                                    onChange={handleStep1Change}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                                    placeholder="비밀번호를 입력하세요 (최소 6자)"
                                />
                            </div>

                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                                    비밀번호 확인 <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    value={step1Data.confirmPassword}
                                    onChange={handleStep1Change}
                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:border-rose-500 ${
                                        step1Data.confirmPassword && step1Data.password !== step1Data.confirmPassword
                                            ? 'border-red-300 focus:ring-red-500'
                                            : 'border-gray-300 focus:ring-rose-500'
                                    }`}
                                    placeholder="비밀번호를 다시 입력하세요"
                                />
                                {step1Data.confirmPassword && step1Data.password !== step1Data.confirmPassword && (
                                    <p className="text-red-500 text-sm mt-1">비밀번호가 일치하지 않습니다.</p>
                                )}
                            </div>
                        </div>
                    ) : (
                        /* 2단계: 직원 상세정보 */
                        <div className="space-y-4">
                            <div className="text-center mb-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">직원 상세정보</h3>
                                <p className="text-sm text-gray-600">직원의 개인정보와 근무정보를 입력해주세요</p>
                            </div>

                            <div>
                                <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-2">
                                    이름 <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="first_name"
                                    name="first_name"
                                    type="text"
                                    value={step2Data.first_name}
                                    onChange={handleStep2Change}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                                    placeholder="이름을 입력하세요"
                                />
                            </div>

                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                    이메일 <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={step2Data.email}
                                    onChange={handleStep2Change}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                                    placeholder="이메일 주소를 입력하세요"
                                />
                            </div>

                            <div>
                                <label htmlFor="contact" className="block text-sm font-medium text-gray-700 mb-2">
                                    전화번호 <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="contact"
                                    name="contact"
                                    type="tel"
                                    value={step2Data.contact}
                                    onChange={handleStep2Change}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                                    placeholder="전화번호를 입력하세요"
                                />
                            </div>

                            <div>
                                <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-2">
                                    직책 <span className="text-red-500">*</span>
                                </label>
                                <select
                                    id="position"
                                    name="position"
                                    value={step2Data.position}
                                    onChange={handleStep2Change}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                                >
                                    {positionOptions.map(option => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label htmlFor="hire_date" className="block text-sm font-medium text-gray-700 mb-2">
                                    입사일 <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        id="hire_date"
                                        name="hire_date"
                                        type="date"
                                        value={step2Data.hire_date}
                                        onChange={handleStep2Change}
                                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                                    />
                                    <FiCalendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="annual_leave_days" className="block text-sm font-medium text-gray-700 mb-2">
                                    연차 일수 <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="annual_leave_days"
                                    name="annual_leave_days"
                                    type="number"
                                    min="0"
                                    max="365"
                                    value={step2Data.annual_leave_days}
                                    onChange={handleStep2Change}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                                    placeholder="연차 일수를 입력하세요"
                                />
                            </div>

                            {/* 권한 탭 관리 - STAFF/INTERN만 표시 */}
                            {step2Data.position !== 'MANAGER' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        접근 권한 <span className="text-red-500">*</span>
                                    </label>
                                    <div className="space-y-2">
                                        {ALLOWED_TABS_OPTIONS.map((tab) => (
                                            <label key={tab.value} className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    checked={step2Data.allowed_tabs.includes(tab.value)}
                                                    onChange={() => handleAllowedTabsChange(tab.value)}
                                                    className="mr-2 h-4 w-4 text-rose-600 focus:ring-rose-500 border-gray-300 rounded"
                                                />
                                                <span className="text-sm text-gray-700">{tab.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                    {step2Data.allowed_tabs.length === 0 && (
                                        <p className="text-sm text-gray-500 mt-1">최소 하나의 권한을 선택해주세요</p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* 에러 메시지 */}
                    {errorMessage && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-800">{errorMessage}</p>
                        </div>
                    )}

                    {/* 버튼 영역 */}
                    <div className="mt-6 pt-4 border-t border-gray-200">
                        {currentStep === 1 ? (
                            <div className="flex gap-3">
                                <button
                                    onClick={onClose}
                                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                                >
                                    취소
                                </button>
                                <button
                                    onClick={handleNextStep}
                                    className="flex-1 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors text-sm font-medium flex items-center justify-center"
                                >
                                    다음 단계
                                    <FiChevronRight className="w-4 h-4 ml-1" />
                                </button>
                            </div>
                        ) : (
                            <div className="flex gap-3">
                                <button
                                    onClick={handlePrevStep}
                                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                                >
                                    이전 단계
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={isLoading}
                                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                            등록 중...
                                        </>
                                    ) : (
                                        <>
                                            <FiUserCheck className="w-4 h-4 mr-2" />
                                            등록 완료
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmployeeRegistrationModal;