// src/pages/HR/HRPage.tsx
import React, { useState } from 'react';
import { FiSearch, FiUser, FiCalendar, FiEdit, FiTrash2, FiEye } from 'react-icons/fi';
import PrimaryButton from '../../components/button/PrimaryButton';
import GreenButton from '../../components/button/GreenButton';
import StatusBadge from '../../components/common/StatusBadge';
import SearchInput from '../../components/input/SearchInput';
import SelectInput from '../../components/input/SelectInput';
import EmployeeDetailsModal from '../../components/modal/EmployeeDetailsModal';
import EmployeeContractModal from '../../components/modal/EmployeeContractModal';
import NewEmployeeModal from '../../components/modal/NewEmployeeModal';

// 직원 상태 타입
type EmployeeStatus = 'active' | 'vacation' | 'leave' | 'terminated';

// 직원 데이터 인터페이스
interface Employee {
    id: string;
    name: string;
    position: string;
    startDate: string;
    status: EmployeeStatus;
    profileImage?: string;
    // 추가 상세 정보 필드
    email?: string;
    phone?: string;
    birthdate?: string;
    gender?: string;
    address?: string;
    emergencyContact?: string;
    job?: string;
    contractPeriod?: string;
    workHours?: string;
    remainingLeave?: string;
}

const HRPage: React.FC = () => {
    // 직원 목록 상태 (더미 데이터로 초기화)
    const [employees, setEmployees] = useState<Employee[]>([
        {
            id: 'EMP-2025-0001',
            name: '김정현',
            position: '직원',
            startDate: '2025-01-08',
            status: 'active',
            email: 'junghyun@example.com',
            phone: '010-1234-1234',
            birthdate: '1975-06-01',
            gender: '남성',
            address: '서울시 성북구 종암로108다길 55',
            emergencyContact: '010-9876-5432 (배우자)',
            job: '크림슨스토어 판매 및 관리',
            contractPeriod: '2025-01-08 ~ 2026-01-07',
            workHours: '평일 09:00 ~ 18:00',
            remainingLeave: '15일',
        },
        {
            id: 'EMP-2025-0002',
            name: '신현성',
            position: '직원',
            startDate: '2025-01-15',
            status: 'vacation',
            email: 'hyunsung@example.com',
            phone: '010-2345-6789',
        },
        {
            id: 'EMP-2025-0003',
            name: '배연준',
            position: '직원',
            startDate: '2025-02-01',
            status: 'active',
            email: 'yeonjun@example.com',
            phone: '010-3456-7890',
        },
        {
            id: 'EMP-2025-0004',
            name: '이수진',
            position: '직원',
            startDate: '2024-11-15',
            status: 'active',
            email: 'sujin@example.com',
            phone: '010-4567-8901',
        },
        {
            id: 'EMP-2025-0005',
            name: '박민지',
            position: '직원',
            startDate: '2025-01-22',
            status: 'leave',
            email: 'minji@example.com',
            phone: '010-5678-9012',
        },
        {
            id: 'EMP-2025-0006',
            name: '유시진',
            position: '대표',
            startDate: '2024-10-05',
            status: 'active',
            email: 'sijin@example.com',
            phone: '010-6789-0123',
            birthdate: '1970-05-15',
            gender: '남성',
            address: '서울시 강남구 테헤란로 123',
        },
    ]);

    // 검색어 상태
    const [searchQuery, setSearchQuery] = useState('');
    // 직급 필터 상태
    const [positionFilter, setPositionFilter] = useState('');
    // 상태 필터 상태
    const [statusFilter, setStatusFilter] = useState('');

    // 모달 상태 관리
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showContractModal, setShowContractModal] = useState(false);
    const [showNewEmployeeModal, setShowNewEmployeeModal] = useState(false);

    // 필터링된 직원 목록
    const filteredEmployees = employees.filter((employee) => {
        // 검색어 필터링
        const matchesSearch = searchQuery
            ? employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              employee.id.toLowerCase().includes(searchQuery.toLowerCase())
            : true;

        // 직급 필터링
        const matchesPosition =
            positionFilter === '' || positionFilter === '전체' ? true : employee.position === positionFilter;

        // 상태 필터링
        const matchesStatus = statusFilter === '' ? true : employee.status === statusFilter;

        return matchesSearch && matchesPosition && matchesStatus;
    });

    // 직원 정보 업데이트
    const handleUpdateEmployee = (updatedEmployee: Employee) => {
        setEmployees((prev) => prev.map((emp) => (emp.id === updatedEmployee.id ? updatedEmployee : emp)));

        // 선택된 직원 정보도 업데이트
        setSelectedEmployee(updatedEmployee);
    };

    // 직원 카드 컴포넌트
    const EmployeeCard: React.FC<{ employee: Employee }> = ({ employee }) => {
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

        // 직원 삭제 처리
        const handleDeleteEmployee = () => {
            if (window.confirm(`${employee.name} 직원을 정말 삭제하시겠습니까?`)) {
                setEmployees((prevEmployees) => prevEmployees.filter((emp) => emp.id !== employee.id));
            }
        };

        // 휴가 등록 처리
        const handleRegisterVacation = () => {
            if (window.confirm(`${employee.name} 직원의 휴가를 등록하시겠습니까?`)) {
                setEmployees((prevEmployees) =>
                    prevEmployees.map((emp) => (emp.id === employee.id ? { ...emp, status: 'vacation' } : emp))
                );
            }
        };

        return (
            <div className="w-96 h-44 bg-white rounded-lg shadow-sm overflow-hidden">
                {/* 카드 상단 영역 */}
                <div className="p-4 flex items-start">
                    {/* 프로필 이미지 */}
                    <div className="w-20 h-20 bg-gray-400 rounded-full flex-shrink-0"></div>

                    {/* 정보 영역 */}
                    <div className="ml-4 flex-1">
                        <div className="flex justify-between items-start">
                            <h3 className="text-lg font-semibold text-gray-900">{employee.name}</h3>
                            {getStatusBadge(employee.status)}
                        </div>
                        <p className="text-sm text-gray-600">{employee.id}</p>
                        <div className="mt-1">
                            <p className="text-sm text-gray-600 flex items-center">
                                <FiUser className="w-3 h-3 mr-2 text-gray-600" /> {employee.position}
                            </p>
                            <p className="text-sm text-gray-600 flex items-center">
                                <FiCalendar className="w-3 h-3 mr-2 text-gray-600" /> 입사일: {employee.startDate}
                            </p>
                        </div>
                    </div>
                </div>

                {/* 카드 하단 액션 영역 */}
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">{/* 아이콘들 */}</div>
                        <div className="flex items-center space-x-2">
                            <button
                                className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md flex items-center text-xs font-medium"
                                onClick={handleRegisterVacation}
                                disabled={employee.status === 'vacation'}
                            >
                                <FiCalendar className="w-3 h-3 mr-1" />
                                휴가등록
                            </button>
                            <button
                                className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-md flex items-center text-xs font-medium"
                                onClick={handleViewDetails}
                            >
                                <FiEye className="w-3 h-3 mr-1" />
                                상세보기
                            </button>
                            <button
                                className="px-2 py-1 bg-red-100 text-red-700 rounded-md flex items-center text-xs font-medium"
                                onClick={handleDeleteEmployee}
                            >
                                <FiTrash2 className="w-3 h-3 mr-1" />
                                삭제
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // 직급 옵션 (필터링에 사용) - 간소화된 옵션
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
    const handleAddEmployee = (employeeData: any) => {
        // 가장 최근 ID 찾아서 다음 번호 부여
        const lastEmpId = employees.map((e) => parseInt(e.id.split('-')[2])).sort((a, b) => b - a)[0];
        const newId = `EMP-2025-${String(lastEmpId + 1).padStart(4, '0')}`;

        const newEmployee: Employee = {
            id: newId,
            name: employeeData.name || '새 직원',
            position: employeeData.position || '직원',
            startDate: employeeData.startDate || new Date().toISOString().split('T')[0],
            status: 'active',
            ...employeeData,
        };

        setEmployees([...employees, newEmployee]);
        setShowNewEmployeeModal(false);
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

    return (
        <div className="flex flex-col space-y-6">
            {/* 페이지 헤더 */}
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">HR 관리</h1>
                <GreenButton text="새 직원 등록" icon={<FiUser />} onClick={handleOpenNewEmployeeModal} />
            </div>

            {/* 검색 및 필터 영역 */}
            <div className="p-4 bg-white rounded-lg shadow-sm">
                <div className="flex items-start gap-4">
                    {/* 검색 입력 */}
                    <div className="flex-1 flex flex-col gap-1">
                        <label className="text-sm font-medium text-gray-700">직원 검색</label>
                        <SearchInput
                            placeholder="이름 또는 사번으로 검색"
                            onSearch={(query) => setSearchQuery(query)}
                        />
                    </div>

                    {/* 직급 필터 */}
                    <div className="min-w-32 flex flex-col gap-1">
                        <label className="text-sm font-medium text-gray-700">직급</label>
                        <SelectInput
                            defaultText="모든 직급"
                            options={positionOptions}
                            onChange={(value) => setPositionFilter(value === '전체' ? '' : value)}
                        />
                    </div>

                    {/* 상태 필터 */}
                    <div className="min-w-32 flex flex-col gap-1">
                        <label className="text-sm font-medium text-gray-700">상태</label>
                        <SelectInput
                            defaultText="모든 상태"
                            options={statusOptions.map((option) => option.label)}
                            onChange={(value) => {
                                const selectedOption = statusOptions.find((option) => option.label === value);
                                setStatusFilter(selectedOption ? selectedOption.value : '');
                            }}
                        />
                    </div>

                    {/* 검색 버튼 */}
                    <div className="flex items-end">
                        <PrimaryButton
                            text="검색하기"
                            icon={<FiSearch />}
                            onClick={() => {
                                // 이미 state 업데이트가 되어 있으므로 별도 작업 필요 없음
                                console.log('검색 수행:', { searchQuery, positionFilter, statusFilter });
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* 직원 카드 그리드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEmployees.map((employee) => (
                    <EmployeeCard key={employee.id} employee={employee} />
                ))}
            </div>

            {/* 결과가 없을 경우 메시지 */}
            {filteredEmployees.length === 0 && (
                <div className="bg-white p-8 rounded-lg text-center">
                    <p className="text-gray-500">검색 결과가 없습니다.</p>
                </div>
            )}

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
