// src/pages/HR/HRPage.tsx
import React, { useState, useEffect } from 'react';
import { FiSearch, FiUser, FiUsers, FiCalendar, FiTrash2, FiEye } from 'react-icons/fi';
import GreenButton from '../../components/button/GreenButton';
import StatusBadge from '../../components/common/StatusBadge';
import SearchInput from '../../components/input/SearchInput';
import SelectInput from '../../components/input/SelectInput';
import EmployeeDetailsModal from '../../components/modal/EmployeeDetailsModal';
import EmployeeContractModal from '../../components/modal/EmployeeContractModal';
import NewEmployeeModal from '../../components/modal/NewEmployeeModal';
import {
    useEmployees,
    useCreateEmployee,
    useUpdateEmployee,
    useTerminateEmployee,
} from '../../hooks/queries/useEmployees';
import { Employee, MappedEmployee } from '../../api/hr';

// 직원 상태 타입
type EmployeeStatus = 'active' | 'vacation' | 'leave' | 'terminated';

// 랜덤 이모지 생성 함수
const getRandomEmoji = (employeeId: number): string => {
    const emojis = [
        '👨‍💼',
        '👩‍💼',
        '🧑‍💼',
        '👨‍💻',
        '👩‍💻',
        '🧑‍💻',
        '👨‍🔧',
        '👩‍🔧',
        '🧑‍🔧',
        '👨‍🎨',
        '👩‍🎨',
        '🧑‍🎨',
        '👨‍🍳',
        '👩‍🍳',
        '🧑‍🍳',
        '👨‍⚕️',
        '👩‍⚕️',
        '🧑‍⚕️',
        '👨‍🏫',
        '👩‍🏫',
        '🧑‍🏫',
        '👨‍🎓',
        '👩‍🎓',
        '🧑‍🎓',
    ];
    // employeeId를 시드로 사용하여 일관된 이모지 반환
    return emojis[employeeId % emojis.length];
};

// 날짜 형식 변환 함수 (ISO 8601 형식 지원)
const formatDateToKorean = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}년 ${month}월 ${day}일`;
};

// Role 매핑 함수
const mapRoleToKorean = (role: string): string => {
    switch (role) {
        case 'MANAGER':
            return '대표';
        case 'STAFF':
            return '직원';
        default:
            return role;
    }
};

// 백엔드 Employee를 프론트엔드 MappedEmployee로 변환
const mapEmployeeData = (emp: Employee): MappedEmployee => ({
    id: emp.id,
    name: emp.username,
    position: mapRoleToKorean(emp.role),
    department: emp.role === 'MANAGER' ? '경영진' : '일반', // 부서 정보가 없으므로 role 기반으로 설정
    email: emp.email,
    phone: emp.contact || '',
    status: emp.is_active ? 'active' : 'terminated', // is_active 기반으로 status 결정
    hire_date: emp.date_joined,
    created_at: '',
    updated_at: '',
});

const HRPage: React.FC = () => {
    // API 훅 사용
    const { data: employeesData, isLoading, error } = useEmployees();
    const createEmployee = useCreateEmployee();
    const updateEmployee = useUpdateEmployee();
    const terminateEmployee = useTerminateEmployee();

    // 직원 목록 상태
    const [employees, setEmployees] = useState<MappedEmployee[]>([]);

    // 검색어 상태
    const [searchQuery, setSearchQuery] = useState('');
    // 직급 필터 상태
    const [positionFilter, setPositionFilter] = useState('');
    // 상태 필터 상태
    const [statusFilter, setStatusFilter] = useState('');

    // 모달 상태 관리
    const [selectedEmployee, setSelectedEmployee] = useState<MappedEmployee | null>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showContractModal, setShowContractModal] = useState(false);
    const [showNewEmployeeModal, setShowNewEmployeeModal] = useState(false);

    // API 데이터 로드
    useEffect(() => {
        if (employeesData?.data) {
            const mapped = employeesData.data.map((emp: Employee) => mapEmployeeData(emp));
            setEmployees(mapped);
        }
    }, [employeesData]);

    // 필터링된 직원 목록
    const filteredEmployees = employees.filter((employee) => {
        // 검색어 필터링
        const matchesSearch = searchQuery
            ? employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              employee.id.toString().includes(searchQuery.toLowerCase())
            : true;

        // 직급 필터링
        const matchesPosition =
            positionFilter === '' || positionFilter === '전체' ? true : employee.position === positionFilter;

        // 상태 필터링
        const matchesStatus = statusFilter === '' ? true : employee.status === statusFilter;

        return matchesSearch && matchesPosition && matchesStatus;
    });

    // 직원 정보 업데이트
    const handleUpdateEmployee = async (updatedEmployee: MappedEmployee) => {
        try {
            // 백엔드 API에 맞게 필드명 변경 (username은 수정 불가능하므로 제외)
            const updateData = {
                role: updatedEmployee.position === '대표' ? 'MANAGER' : 'STAFF',
                email: updatedEmployee.email,
                contact: updatedEmployee.phone,
            };

            console.log('직원 정보 수정 요청 데이터:', JSON.stringify(updateData, null, 2));

            await updateEmployee.mutateAsync({
                employeeId: updatedEmployee.id,
                data: updateData,
            });

            // 로컬 상태 업데이트
            setEmployees((prev) =>
                prev.map((emp) => (emp.id === updatedEmployee.id ? { ...emp, ...updatedEmployee } : emp))
            );
            setSelectedEmployee(updatedEmployee);
        } catch (error: any) {
            console.error('직원 정보 업데이트 실패:', error);
            console.error('업데이트 응답 데이터:', error.response?.data);
            console.error('업데이트 상태 코드:', error.response?.status);
            throw error; // 에러를 다시 던져서 모달에서 처리하도록 함
        }
    };

    // 직원 카드 컴포넌트
    const EmployeeCard: React.FC<{ employee: MappedEmployee }> = ({ employee }) => {
        // 상태에 따른 StatusBadge 컴포넌트 설정
        const getStatusBadge = (status: EmployeeStatus) => {
            switch (status) {
                case 'active':
                    return <StatusBadge text="재직중" theme="active" />;
                case 'vacation':
                    return <StatusBadge text="휴가중" theme="approved" />;
                case 'leave':
                    return <StatusBadge text="휴직중" theme="pending" />;
                case 'terminated':
                    return <StatusBadge text="퇴사" theme="rejected" />;
                default:
                    return <StatusBadge text="재직중" theme="active" />;
            }
        };

        // 직원 상세 정보 보기
        const handleViewDetails = () => {
            setSelectedEmployee(employee);
            setShowDetailsModal(true);
        };

        // 직원 퇴사 처리
        const handleTerminateEmployee = async () => {
            if (window.confirm(`${employee.name} 직원을 퇴사 처리하시겠습니까?`)) {
                try {
                    await terminateEmployee.mutateAsync(employee.id);

                    // 로컬 상태 업데이트 - 해당 직원의 status를 'terminated'로 변경
                    setEmployees((prev) =>
                        prev.map((emp) => (emp.id === employee.id ? { ...emp, status: 'terminated' as const } : emp))
                    );

                    alert('퇴사 처리가 완료되었습니다.');
                } catch (error: any) {
                    console.error('퇴사 처리 실패:', error);
                    console.error('퇴사 처리 응답 데이터:', error.response?.data);
                    console.error('퇴사 처리 상태 코드:', error.response?.status);

                    let errorMessage = '퇴사 처리에 실패했습니다.';
                    if (error.response?.data?.message) {
                        errorMessage += ` 오류: ${error.response.data.message}`;
                    }
                    alert(errorMessage);
                }
            }
        };

        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* 카드 상단 영역 */}
                <div className="p-6">
                    <div className="flex items-start space-x-4">
                        {/* 프로필 이모지 */}
                        <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex-shrink-0 flex items-center justify-center text-3xl shadow-sm">
                            {getRandomEmoji(employee.id)}
                        </div>

                        {/* 정보 영역 */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-2">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 truncate">{employee.name}</h3>
                                    <p className="text-sm text-gray-500">사번 #{employee.id}</p>
                                </div>
                                {getStatusBadge(employee.status as EmployeeStatus)}
                            </div>

                            <div className="space-y-1">
                                <div className="flex items-center text-sm text-gray-600">
                                    <FiUser className="w-4 h-4 mr-2 text-gray-400" />
                                    <span>{employee.position}</span>
                                    <span className="mx-2">•</span>
                                    <span>{employee.department}</span>
                                </div>
                                <div className="flex items-center text-sm text-gray-600">
                                    <FiCalendar className="w-4 h-4 mr-2 text-gray-400" />
                                    <span>{formatDateToKorean(employee.hire_date)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 카드 하단 액션 영역 */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                    <div className="flex items-center justify-end space-x-2">
                        <button
                            className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-lg flex items-center text-sm font-medium hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 shadow-sm"
                            onClick={handleViewDetails}
                        >
                            <FiEye className="w-4 h-4 mr-1" />
                            상세보기
                        </button>
                        {employee.status === 'active' && (
                            <button
                                className="px-3 py-1.5 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center text-sm font-medium hover:bg-red-100 hover:border-red-300 transition-all duration-200 shadow-sm"
                                onClick={handleTerminateEmployee}
                            >
                                <FiTrash2 className="w-4 h-4 mr-1" />
                                퇴사
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    // 직급 옵션 (필터링에 사용)
    const positionOptions = ['전체', '대표', '직원'];

    // 상태 옵션 (필터링에 사용)
    const statusOptions = [
        { value: '', label: '전체' },
        { value: 'active', label: '재직중' },
        { value: 'vacation', label: '휴가중' },
        { value: 'leave', label: '휴직중' },
        { value: 'terminated', label: '퇴사' },
    ];

    // 새 직원 등록
    const handleAddEmployee = async (employeeData: any) => {
        try {
            // 백엔드 API에 맞게 필드명 변경
            const apiData = {
                username: employeeData.username,
                role: employeeData.role,
                email: employeeData.email,
                contact: employeeData.contact,
                password: employeeData.password,
            };

            console.log('보내는 데이터:', JSON.stringify(apiData, null, 2));
            console.log('요청 URL:', '/hr/employees/');
            await createEmployee.mutateAsync(apiData);
            setShowNewEmployeeModal(false);
            alert('새 직원이 등록되었습니다.');
        } catch (error: any) {
            console.error('직원 등록 실패 전체 에러:', error);
            console.error('응답 데이터:', JSON.stringify(error.response?.data, null, 2));
            console.error('상태 코드:', error.response?.status);
            console.error('요청 URL:', error.config?.url);
            console.error('요청 메서드:', error.config?.method);
            console.error('전체 응답:', error.response);

            let errorMessage = '직원 등록에 실패했습니다.';
            if (error.response?.data?.message) {
                errorMessage += ` 오류: ${error.response.data.message}`;
            } else if (error.response?.data) {
                errorMessage += ` 상세: ${JSON.stringify(error.response.data)}`;
            }

            alert(errorMessage);
        }
    };

    // 모달 제어 함수
    const handleOpenNewEmployeeModal = () => {
        setShowNewEmployeeModal(true);
    };

    const handleCloseModals = () => {
        setShowDetailsModal(false);
        setShowContractModal(false);
        setShowNewEmployeeModal(false);
        setSelectedEmployee(null);
    };

    const handleViewContractTab = () => {
        setShowDetailsModal(false);
        setShowContractModal(true);
    };

    const handleViewInfoTab = () => {
        setShowContractModal(false);
        setShowDetailsModal(true);
    };

    if (isLoading)
        return (
            <div className="flex justify-center items-center h-96">
                <div className="flex flex-col items-center">
                    <div className="w-8 h-8 border-4 border-rose-200 border-t-rose-600 rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-600 font-medium">직원 정보를 불러오는 중...</p>
                </div>
            </div>
        );

    if (error)
        return (
            <div className="flex justify-center items-center h-96">
                <div className="text-center p-8 bg-red-50 rounded-lg border border-red-200">
                    <div className="w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-red-800 mb-2">오류가 발생했습니다</h3>
                    <p className="text-red-600">직원 정보를 불러올 수 없습니다. 잠시 후 다시 시도해주세요.</p>
                </div>
            </div>
        );

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* 페이지 헤더 */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center">
                            <div className="w-12 h-12 bg-gradient-to-r from-rose-500 to-rose-600 rounded-lg flex items-center justify-center mr-4">
                                <FiUsers className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">HR 관리</h1>
                                <p className="text-gray-600 mt-1">
                                    총 <span className="font-semibold text-rose-600">{employees.length}명</span>의
                                    직원이 등록되어 있습니다
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="hidden sm:flex items-center text-sm text-gray-500">
                                <div className="flex items-center mr-4">
                                    <div className="w-3 h-3 bg-green-400 rounded-full mr-2"></div>
                                    재직: {employees.filter((emp) => emp.status === 'active').length}명
                                </div>
                                <div className="flex items-center">
                                    <div className="w-3 h-3 bg-gray-400 rounded-full mr-2"></div>
                                    퇴사: {employees.filter((emp) => emp.status === 'terminated').length}명
                                </div>
                            </div>
                            <GreenButton text="새 직원 등록" icon={<FiUser />} onClick={handleOpenNewEmployeeModal} />
                        </div>
                    </div>
                </div>

                {/* 검색 및 필터 영역 */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                            <FiSearch className="w-5 h-5 mr-2 text-gray-600" />
                            직원 검색 및 필터
                        </h2>
                        <div className="text-sm text-gray-500">
                            검색 결과: <span className="font-semibold text-gray-900">{filteredEmployees.length}명</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* 검색 입력 */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">직원 검색</label>
                            <SearchInput
                                placeholder="이름 또는 사번으로 검색하세요"
                                onSearch={(query) => setSearchQuery(query)}
                            />
                        </div>

                        {/* 직급 필터 */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">직급 필터</label>
                            <SelectInput
                                defaultText="모든 직급"
                                options={positionOptions}
                                onChange={(value) => setPositionFilter(value === '전체' ? '' : value)}
                            />
                        </div>

                        {/* 상태 필터 */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">상태 필터</label>
                            <SelectInput
                                defaultText="모든 상태"
                                options={statusOptions.map((option) => option.label)}
                                onChange={(value) => {
                                    const selectedOption = statusOptions.find((option) => option.label === value);
                                    setStatusFilter(selectedOption ? selectedOption.value : '');
                                }}
                            />
                        </div>
                    </div>

                    {/* 필터 요약 */}
                    {(searchQuery || positionFilter || statusFilter) && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-600 mb-2">적용된 필터:</p>
                            <div className="flex flex-wrap gap-2">
                                {searchQuery && (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        검색: {searchQuery}
                                    </span>
                                )}
                                {positionFilter && (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        직급: {positionFilter}
                                    </span>
                                )}
                                {statusFilter && (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                        상태: {statusOptions.find((option) => option.value === statusFilter)?.label}
                                    </span>
                                )}
                                <button
                                    onClick={() => {
                                        setSearchQuery('');
                                        setPositionFilter('');
                                        setStatusFilter('');
                                    }}
                                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 hover:bg-red-200 transition-colors"
                                >
                                    필터 초기화
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* 직원 카드 그리드 */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredEmployees.map((employee) => (
                        <EmployeeCard key={employee.id} employee={employee} />
                    ))}
                </div>

                {/* 결과가 없을 경우 메시지 */}
                {filteredEmployees.length === 0 && (
                    <div className="bg-white p-12 rounded-xl text-center border border-gray-200 shadow-sm">
                        <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                            <FiUsers className="w-10 h-10 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-3">
                            {employees.length === 0 ? '등록된 직원이 없습니다' : '검색 결과가 없습니다'}
                        </h3>
                        <p className="text-gray-600 mb-6">
                            {employees.length === 0
                                ? '새 직원을 등록하여 시작해보세요.'
                                : '다른 검색 조건으로 시도해보세요.'}
                        </p>
                        {employees.length === 0 && (
                            <GreenButton
                                text="첫 직원 등록하기"
                                icon={<FiUser />}
                                onClick={handleOpenNewEmployeeModal}
                            />
                        )}
                    </div>
                )}
            </div>

            {/* 직원 상세 정보 모달 */}
            {showDetailsModal && selectedEmployee && (
                <EmployeeDetailsModal
                    employee={selectedEmployee}
                    onClose={handleCloseModals}
                    onViewContract={handleViewContractTab}
                    onUpdateEmployee={handleUpdateEmployee}
                />
            )}

            {/* 근로계약서 모달 */}
            {showContractModal && selectedEmployee && (
                <EmployeeContractModal
                    employee={selectedEmployee}
                    onClose={handleCloseModals}
                    onViewInfo={handleViewInfoTab}
                />
            )}

            {/* 새 직원 등록 모달 */}
            {showNewEmployeeModal && <NewEmployeeModal onClose={handleCloseModals} onSubmit={handleAddEmployee} />}
        </div>
    );
};

export default HRPage;
