// src/pages/HR/HRPage.tsx
import React, { useState, useEffect } from "react";
import { FiUser, FiUsers, FiCalendar, FiTrash2, FiEye, FiPlusCircle, FiClipboard } from "react-icons/fi";
import StatusBadge from "../../components/common/StatusBadge";
import EmployeeDetailsModal from "../../components/modal/EmployeeDetailsModal";
import EmployeeContractModal from "../../components/modal/EmployeeContractModal";
import EmployeeRegistrationModal from "../../components/modal/EmployeeRegistrationModal";
import VacationRequestModal from "../../components/modal/VacationRequestModal";
import VacationManagementModal from "../../components/modal/VacationManagementModal";
import OrganizationVacationCalendar from "../../components/calendar/OrganizationVacationCalendar";
import { useEmployees, useTerminateEmployee } from "../../hooks/queries/useEmployees";
import { useQueryClient } from "@tanstack/react-query";
import { EmployeeList, approveEmployee, patchEmployee } from "../../api/hr";
import { useAuthStore } from "../../store/authStore";

// 직원 상태 타입
type EmployeeStatus = "active" | "terminated" | "denied";

// 랜덤 이모지 생성 함수
const getRandomEmoji = (employeeId: number): string => {
    const emojis = [
        "👨‍💼",
        "👩‍💼",
        "🧑‍💼",
        "👨‍💻",
        "👩‍💻",
        "🧑‍💻",
        "👨‍🔧",
        "👩‍🔧",
        "🧑‍🔧",
        "👨‍🎨",
        "👩‍🎨",
        "🧑‍🎨",
        "👨‍🍳",
        "👩‍🍳",
        "🧑‍🍳",
        "👨‍⚕️",
        "👩‍⚕️",
        "🧑‍⚕️",
        "👨‍🏫",
        "👩‍🏫",
        "🧑‍🏫",
        "👨‍🎓",
        "👩‍🎓",
        "🧑‍🎓",
    ];
    // employeeId를 시드로 사용하여 일관된 이모지 반환
    return emojis[employeeId % emojis.length];
};

// 날짜 형식 변환 함수 (ISO 8601 형식 지원)
const formatDateToKorean = (dateString: string): string => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}년 ${month}월 ${day}일`;
};

// Role 매핑 함수
const mapRoleToKorean = (role: string): string => {
    switch (role) {
        case "MANAGER":
            return "대표";
        case "STAFF":
            return "직원";
        case "INTERN":
            return "인턴";
        default:
            return role;
    }
};

// 프론트엔드에서 사용할 매핑된 Employee 타입
export interface MappedEmployee {
    id: number;
    name: string; // 화면 표시용 이름 (실제로는 first_name)
    username: string; // API 호출 시 사용할 실제 username
    role: string; // 추가: 영문 role(MANAGER/STAFF/INTERN)
    position: string;
    department: string;
    email: string;
    phone: string;
    status: "active" | "terminated" | "denied";
    hire_date: string;
    annual_leave_days: number;
    allowed_tabs: string[];
    remaining_leave_days: number;
    vacation_days: any[];
    vacation_pending_days: any[];
    created_at: string;
    updated_at: string;
}

// 백엔드 EmployeeList를 프론트엔드 MappedEmployee로 변환
const mapEmployeeData = (emp: EmployeeList): MappedEmployee => ({
    id: emp.id,
    name: emp.first_name || emp.username, // 이름이 있으면 first_name, 없으면 username 사용
    username: emp.username, // API 호출 시 사용할 실제 username
    role: emp.role,
    position: mapRoleToKorean(emp.role),
    department: emp.role === "MANAGER" ? "경영진" : "일반",
    email: emp.email,
    phone: emp.contact || "",
    status: emp.status,
    hire_date: emp.hire_date || "",
    annual_leave_days: 0, // 목록 조회에서는 제공되지 않음
    allowed_tabs: [], // 목록 조회에서는 제공되지 않음
    remaining_leave_days: parseInt(emp.remaining_leave_days) || 0,
    vacation_days: [], // 목록 조회에서는 제공되지 않음
    vacation_pending_days: [], // 목록 조회에서는 제공되지 않음
    created_at: "",
    updated_at: "",
});

const HRPage: React.FC = () => {
    // 현재 로그인한 사용자 정보
    const currentUser = useAuthStore((state) => state.user);
    const isAdmin = currentUser?.role === "MANAGER";

    // API 훅 사용
    const { data: employeesData, isLoading, error } = useEmployees();
    const terminateEmployee = useTerminateEmployee();
    const queryClient = useQueryClient();

    // 직원 목록 상태
    const [employees, setEmployees] = useState<MappedEmployee[]>([]);


    // 모달 상태 관리
    const [selectedEmployee, setSelectedEmployee] = useState<MappedEmployee | null>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showContractModal, setShowContractModal] = useState(false);
    const [showEmployeeRegistrationModal, setShowEmployeeRegistrationModal] = useState(false);
    const [showVacationRequestModal, setShowVacationRequestModal] = useState(false);
    const [showVacationManagementModal, setShowVacationManagementModal] = useState(false);
    const [showOrganizationVacationCalendar, setShowOrganizationVacationCalendar] = useState(false);

    // API 데이터 로드
    useEffect(() => {
        if (employeesData?.data) {
            const mapped = employeesData.data.map((emp: EmployeeList) => mapEmployeeData(emp));
            setEmployees(mapped);
        }
    }, [employeesData]);


    // 직원 정보 업데이트
    const handleUpdateEmployee = async (updatedEmployee: MappedEmployee) => {
        // 관리자 권한 확인
        if (!isAdmin) {
            alert("직원 정보를 수정할 권한이 없습니다.");
            return;
        }

        try {
            // 백엔드 API에 맞게 필드명 변경 (PATCH API 스펙에 맞춤)
            const updateData = {
                email: updatedEmployee.email,
                first_name: updatedEmployee.name,
                contact: updatedEmployee.phone,
                is_active: updatedEmployee.status === "active",
                annual_leave_days: updatedEmployee.annual_leave_days,
                allowed_tabs: updatedEmployee.allowed_tabs,
                hire_date: updatedEmployee.hire_date,
                role: updatedEmployee.role,
            };

            console.log("직원 정보 수정 요청 데이터:", JSON.stringify(updateData, null, 2));

            // patchEmployee 사용 (PATCH 엔드포인트)
            await patchEmployee(updatedEmployee.id, updateData);

            // React Query 캐시 무효화하여 최신 데이터 가져오기
            queryClient.invalidateQueries({ queryKey: ["employees"] });

            // 로컬 상태 업데이트
            setEmployees((prev) =>
                prev.map((emp) => (emp.id === updatedEmployee.id ? { ...emp, ...updatedEmployee } : emp))
            );
            setSelectedEmployee(updatedEmployee);
        } catch (error: any) {
            console.error("직원 정보 업데이트 실패:", error);
            console.error("업데이트 응답 데이터:", error.response?.data);
            console.error("업데이트 상태 코드:", error.response?.status);
            throw error; // 에러를 다시 던져서 모달에서 처리하도록 함
        }
    };

    // 직원 카드 컴포넌트
    const EmployeeCard: React.FC<{ employee: MappedEmployee }> = ({ employee }) => {
        const isTerminated = employee.status === "terminated";
        const isCurrentUser = currentUser?.username === employee.username; // 현재 로그인한 사용자와 같은지 확인

        // 상태에 따른 StatusBadge 컴포넌트 설정
        const getStatusBadge = (status: EmployeeStatus) => {
            switch (status) {
                case "active":
                    return <StatusBadge text="재직중" theme="active" />;
                case "terminated":
                    return <StatusBadge text="퇴사" theme="rejected" />;
                case "denied":
                    return <StatusBadge text="승인 대기" theme="pending" />;
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
            // 관리자 권한 확인
            if (!isAdmin) {
                alert("직원을 퇴사 처리할 권한이 없습니다.");
                return;
            }

            if (window.confirm(`${employee.name} 직원을 퇴사 처리하시겠습니까?`)) {
                try {
                    await terminateEmployee.mutateAsync(employee.id);

                    // 로컬 상태 업데이트 - 해당 직원의 status를 'terminated'로 변경
                    setEmployees((prev) =>
                        prev.map((emp) => (emp.id === employee.id ? { ...emp, status: "terminated" as const } : emp))
                    );

                    alert("퇴사 처리가 완료되었습니다.");
                } catch (error: any) {
                    console.error("퇴사 처리 실패:", error);
                    console.error("퇴사 처리 응답 데이터:", error.response?.data);
                    console.error("퇴사 처리 상태 코드:", error.response?.status);

                    let errorMessage = "퇴사 처리에 실패했습니다.";
                    if (error.response?.data?.message) {
                        errorMessage += ` 오류: ${error.response.data.message}`;
                    }
                    alert(errorMessage);
                }
            }
        };

        // 퇴사한 직원인 경우 카드 전체를 흐리게 처리
        const cardOpacity = isTerminated ? "opacity-60" : "opacity-100";
        const textOpacity = isTerminated ? "text-gray-400" : "text-gray-900";
        const subTextOpacity = isTerminated ? "text-gray-300" : "text-gray-600";

        return (
            <div
                className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-200 ${cardOpacity} ${
                    isTerminated ? "bg-gray-50" : ""
                }`}
            >
                {/* 카드 상단 영역 */}
                <div className="p-6">
                    <div className="flex items-start space-x-4">
                        {/* 프로필 이모지 */}
                        <div
                            className={`pointer-events-none w-16 h-16 rounded-xl flex-shrink-0 flex items-center justify-center text-5xl ${
                                isTerminated ? "grayscale" : ""
                            }`}
                        >
                            {getRandomEmoji(employee.id)}
                        </div>

                        {/* 정보 영역 */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-2">
                                <div>
                                    <h3
                                        className={`mb-10 text-lg font-semibold truncate ${textOpacity} ${
                                            isTerminated ? "line-through" : ""
                                        }`}
                                    >
                                        {employee.name}
                                    </h3>
                                    {/* <p className={`text-sm ${subTextOpacity}`} >사번 #{employee.id}</p> */}
                                </div>
                                {getStatusBadge(employee.status as EmployeeStatus)}
                            </div>

                            <div className="space-y-1">
                                <div className={`flex items-center text-sm ${subTextOpacity}`}>
                                    <FiUser className="w-4 h-4 mr-2 text-gray-400" />
                                    <span>{employee.position}</span>
                                    <span className="mx-2">•</span>
                                    <span>{employee.department}</span>
                                </div>
                                <div className={`flex items-center text-sm ${subTextOpacity}`}>
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
                        {/* 퇴사 버튼: 관리자만 보이고, 재직중이고, 본인이 아닌 경우에만 표시 */}
                        {isAdmin && employee.status === "active" && !isCurrentUser && (
                            <button
                                className="px-3 py-1.5 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center text-sm font-medium hover:bg-red-100 hover:border-red-300 transition-all duration-200 shadow-sm"
                                onClick={handleTerminateEmployee}
                            >
                                <FiTrash2 className="w-4 h-4 mr-1" />
                                퇴사
                            </button>
                        )}
                        {isAdmin && employee.role === "STAFF" && !isTerminated && (
                            <>
                                {employee.status === "denied" ? (
                                    <button
                                        className="px-3 py-1.5 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center text-sm font-medium hover:bg-green-100 hover:border-green-300 transition-all duration-200 shadow-sm"
                                        onClick={async () => {
                                            try {
                                                await approveEmployee(employee.username, "approved");
                                                setEmployees((prev) =>
                                                    prev.map((emp) =>
                                                        emp.id === employee.id
                                                            ? { ...emp, status: "active" as const }
                                                            : emp
                                                    )
                                                );
                                                // React Query 캐시 무효화
                                                queryClient.invalidateQueries({ queryKey: ["employees"] });
                                                alert("승인 완료!");
                                            } catch (e: any) {
                                                alert(e?.response?.data?.error || "승인 실패");
                                            }
                                        }}
                                    >
                                        승인
                                    </button>
                                ) : (
                                    <button
                                        className="px-3 py-1.5 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-lg flex items-center text-sm font-medium hover:bg-yellow-100 hover:border-yellow-300 transition-all duration-200 shadow-sm"
                                        onClick={async () => {
                                            try {
                                                await approveEmployee(employee.username, "denied");
                                                setEmployees((prev) =>
                                                    prev.map((emp) =>
                                                        emp.id === employee.id
                                                            ? { ...emp, status: "denied" as const }
                                                            : emp
                                                    )
                                                );
                                                // React Query 캐시 무효화
                                                queryClient.invalidateQueries({ queryKey: ["employees"] });
                                                alert("거절 처리 완료!");
                                            } catch (e: any) {
                                                alert(e?.response?.data?.error || "거절 실패");
                                            }
                                        }}
                                    >
                                        거절
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        );
    };


    // 모달 제어 함수
    const handleCloseModals = () => {
        setShowDetailsModal(false);
        setShowContractModal(false);
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

    // 직원 등록 완료 핸들러
    const handleEmployeeRegistrationComplete = (newEmployee: MappedEmployee) => {
        // 로컬 상태 업데이트
        setEmployees((prev) => [...prev, newEmployee]);
        setShowEmployeeRegistrationModal(false);

        // React Query 캐시 무효화하여 최신 데이터 가져오기
        queryClient.invalidateQueries({ queryKey: ["employees"] });
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
                                    총 <span className="font-semibold text-rose-600">{employees.length}명</span>의 직원
                                    정보를 관리하고 있습니다
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {/* 휴가 관련 버튼 */}
                            <div className="flex items-center gap-2">
                                {/* 휴가 신청 버튼 - 모든 사용자 */}
                                <button
                                    onClick={() => setShowVacationRequestModal(true)}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center text-sm font-medium transition-colors shadow-sm"
                                >
                                    <FiPlusCircle className="w-4 h-4 mr-2" />
                                    휴가신청
                                </button>

                                {/* 휴가 관리 버튼 */}
                                <button
                                    onClick={() => setShowVacationManagementModal(true)}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center text-sm font-medium transition-colors shadow-sm"
                                >
                                    <FiClipboard className="w-4 h-4 mr-2" />
                                    {isAdmin ? "휴가관리" : "내 휴가"}
                                </button>

                                {/* 조직 휴가 캘린더 버튼 - 관리자만 표시 */}
                                {isAdmin && (
                                    <button
                                        onClick={() => setShowOrganizationVacationCalendar(true)}
                                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center text-sm font-medium transition-colors shadow-sm"
                                    >
                                        <FiCalendar className="w-4 h-4 mr-2" />
                                        조직 캘린더
                                    </button>
                                )}
                            </div>

                            {/* 구분선 */}
                            <div className="w-px h-6 bg-gray-300"></div>

                            {/* 직원등록 버튼 - MANAGER만 표시 */}
                            {isAdmin && (
                                <button
                                    onClick={() => setShowEmployeeRegistrationModal(true)}
                                    className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 flex items-center text-sm font-medium transition-colors shadow-sm"
                                >
                                    <FiUser className="w-4 h-4 mr-2" />
                                    직원등록
                                </button>
                            )}

                        </div>
                    </div>
                </div>


                {/* 직원 카드 그리드 */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {employees.map((employee) => (
                        <EmployeeCard key={employee.id} employee={employee} />
                    ))}
                </div>

                {/* 결과가 없을 경우 메시지 */}
                {employees.length === 0 && (
                    <div className="bg-white p-12 rounded-xl text-center border border-gray-200 shadow-sm">
                        <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                            <FiUsers className="w-10 h-10 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-3">직원 정보가 없습니다</h3>
                        <p className="text-gray-600 mb-6">직원 정보를 불러올 수 없습니다.</p>
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
                    isAdmin={isAdmin}
                />
            )}

            {/* 근로계약서 모달 - 관리자만 접근 가능 */}
            {showContractModal && selectedEmployee && isAdmin && (
                <EmployeeContractModal
                    employee={selectedEmployee}
                    onClose={handleCloseModals}
                    onViewInfo={handleViewInfoTab}
                />
            )}

            {/* 직원 등록 모달 - 관리자만 접근 가능 */}
            {showEmployeeRegistrationModal && isAdmin && (
                <EmployeeRegistrationModal
                    onClose={() => setShowEmployeeRegistrationModal(false)}
                    onRegisterComplete={handleEmployeeRegistrationComplete}
                />
            )}

            {/* 휴가 신청 모달 */}
            {showVacationRequestModal && (
                <VacationRequestModal
                    onClose={() => setShowVacationRequestModal(false)}
                    onSuccess={() => {
                        setShowVacationRequestModal(false);
                        // 휴가 신청 성공 시 휴가 관리 모달 열기
                        setShowVacationManagementModal(true);
                    }}
                />
            )}

            {/* 휴가 관리 모달 */}
            {showVacationManagementModal && (
                <VacationManagementModal onClose={() => setShowVacationManagementModal(false)} />
            )}

            {/* 조직 휴가 캘린더 모달 */}
            {showOrganizationVacationCalendar && (
                <OrganizationVacationCalendar onClose={() => setShowOrganizationVacationCalendar(false)} />
            )}
        </div>
    );
};

export default HRPage;
