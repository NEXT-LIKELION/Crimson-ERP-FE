import React, { useState } from "react";
import { FiX, FiCalendar, FiFileText, FiSend } from "react-icons/fi";
import { useCreateVacation } from "../../hooks/queries/useVacations";
import { VacationCreateData, LEAVE_TYPE_OPTIONS, LeaveType, fetchEmployees } from "../../api/hr";
import { useAuthStore } from "../../store/authStore";
import { getCurrentUser } from "../../api/auth";

interface VacationRequestModalProps {
    onClose: () => void;
    onSuccess?: () => void;
}

const VacationRequestModal: React.FC<VacationRequestModalProps> = ({ onClose, onSuccess }) => {
    const currentUser = useAuthStore((state) => state.user);
    const createVacationMutation = useCreateVacation();

    const [formData, setFormData] = useState<Omit<VacationCreateData, "employee">>({
        leave_type: "VACATION",
        start_date: "",
        end_date: "",
        reason: "",
    });

    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    // 폼 데이터 변경 핸들러
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));

        // 에러 클리어
        if (errors[name]) {
            setErrors((prev) => ({
                ...prev,
                [name]: "",
            }));
        }
    };

    // 폼 검증
    const validateForm = (): boolean => {
        const newErrors: { [key: string]: string } = {};

        if (!formData.leave_type) {
            newErrors.leave_type = "휴가 유형을 선택해주세요.";
        }

        if (!formData.start_date) {
            newErrors.start_date = "시작일을 선택해주세요.";
        }

        if (!formData.end_date) {
            newErrors.end_date = "종료일을 선택해주세요.";
        }

        if (formData.start_date && formData.end_date && formData.start_date > formData.end_date) {
            newErrors.end_date = "종료일은 시작일보다 늦어야 합니다.";
        }

        if (!formData?.reason?.trim()) {
            newErrors.reason = "사유를 입력해주세요.";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // 휴가 신청 제출
    const handleSubmit = async () => {
        console.log("휴가 신청 시작 - 현재 사용자 정보:", currentUser);
        console.log("현재 사용자의 모든 속성:", Object.keys(currentUser || {}));
        console.log("localStorage auth-storage:", localStorage.getItem("auth-storage"));

        if (!validateForm()) {
            return;
        }

        if (!currentUser) {
            console.error("currentUser가 null입니다");
            alert("로그인 정보가 없습니다. 다시 로그인해주세요.");
            return;
        }

        // 사용자 ID 확인 (여러 필드 시도)
        let employeeId = currentUser.id;

        if (!employeeId) {
            // 다른 필드명들도 시도해보기
            employeeId =
                (currentUser as any).employee_id ||
                (currentUser as any).user_id ||
                (currentUser as any).pk ||
                currentUser.username; // username도 시도

            console.log("대체 ID 필드 시도 결과:", employeeId);
        }

        // 만약 여전히 employeeId가 없다면 API에서 현재 사용자 정보를 다시 가져와서 시도
        if (!employeeId) {
            try {
                console.log("API에서 현재 사용자 정보 다시 가져오는 중...");
                const response = await getCurrentUser();
                const freshUserData = response.data;
                console.log("API에서 가져온 사용자 정보:", freshUserData);

                employeeId =
                    freshUserData.id ||
                    freshUserData.employee_id ||
                    freshUserData.user_id ||
                    freshUserData.pk ||
                    freshUserData.username;

                console.log("API에서 추출한 employeeId:", employeeId);
            } catch (error) {
                console.error("현재 사용자 정보 조회 실패:", error);
            }
        }

        if (!employeeId) {
            console.error("모든 ID 필드 시도 실패. currentUser 전체:", currentUser);
            alert("사용자 ID 정보를 찾을 수 없습니다. 관리자에게 문의하세요.");
            return;
        }

        try {
            // employeeId를 숫자로 변환 시도
            let numericEmployeeId: number;

            if (typeof employeeId === "number") {
                numericEmployeeId = employeeId;
            } else if (typeof employeeId === "string") {
                // 문자열인 경우 숫자로 변환 시도
                const parsed = parseInt(employeeId, 10);
                if (isNaN(parsed)) {
                    // 숫자로 변환할 수 없는 경우 (username 등), 직원 목록에서 해당 사용자의 ID를 찾기
                    try {
                        console.log("직원 목록에서 사용자 ID 찾는 중...", employeeId);
                        const employeesResponse = await fetchEmployees();
                        const employees = employeesResponse.data;
                        console.log("직원 목록:", employees);

                        const currentEmployee = employees.find(
                            (emp: any) => emp.username === employeeId || emp.username === currentUser.username
                        );

                        if (currentEmployee) {
                            numericEmployeeId = currentEmployee.id;
                            console.log("찾은 직원 ID:", numericEmployeeId);
                        } else {
                            alert("직원 목록에서 현재 사용자를 찾을 수 없습니다. 관리자에게 문의하세요.");
                            return;
                        }
                    } catch (error) {
                        console.error("직원 목록 조회 실패:", error);
                        alert("직원 정보를 조회할 수 없습니다. 관리자에게 문의하세요.");
                        return;
                    }
                } else {
                    numericEmployeeId = parsed;
                }
            } else {
                alert("잘못된 사용자 ID 형식입니다. 관리자에게 문의하세요.");
                return;
            }

            const requestData: VacationCreateData = {
                employee: numericEmployeeId,
                ...formData,
            };

            console.log("휴가 신청 요청 데이터:", requestData);
            console.log("employee ID 타입:", typeof requestData.employee);
            await createVacationMutation.mutateAsync(requestData);

            alert("휴가 신청이 완료되었습니다.");
            onSuccess?.();
            onClose();
        } catch (error: any) {
            console.error("휴가 신청 실패:", error);
            console.error("오류 응답 데이터:", error.response?.data);

            let errorMessage = "휴가 신청에 실패했습니다.";

            if (error.response?.data) {
                // 다양한 오류 메시지 형식 처리
                const responseData = error.response.data;
                if (typeof responseData === "string") {
                    errorMessage = responseData;
                } else if (responseData.message) {
                    errorMessage = responseData.message;
                } else if (responseData.error) {
                    errorMessage = responseData.error;
                } else if (responseData.detail) {
                    errorMessage = responseData.detail;
                } else if (responseData.non_field_errors) {
                    errorMessage = Array.isArray(responseData.non_field_errors)
                        ? responseData.non_field_errors.join(", ")
                        : responseData.non_field_errors;
                } else {
                    // 필드별 오류 메시지 처리
                    const fieldErrors = Object.entries(responseData)
                        .filter(([value]) => Array.isArray(value))
                        .map(([key, value]) => `${key}: ${(value as string[]).join(", ")}`)
                        .join("\n");

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
            if ((value === "HALF_DAY_AM" || value === "HALF_DAY_PM") && prev.start_date) {
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
            if (prev.leave_type === "HALF_DAY_AM" || prev.leave_type === "HALF_DAY_PM") {
                newData.end_date = value;
            }

            return newData;
        });
    };

    // 반차 여부 확인
    const isHalfDay = formData.leave_type === "HALF_DAY_AM" || formData.leave_type === "HALF_DAY_PM";

    // 배경 클릭 시 모달 닫기
    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
            onClick={handleBackdropClick}
        >
            <div
                className="w-full max-w-md bg-white rounded-xl shadow-lg border border-gray-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* 헤더 */}
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                            <FiCalendar className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">휴가 신청</h2>
                            <p className="text-sm text-gray-500">새로운 휴가를 신청합니다</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <FiX className="w-5 h-5" />
                    </button>
                </div>

                {/* 콘텐츠 */}
                <div className="p-6">
                    <div className="space-y-4">
                        {/* 휴가 유형 */}
                        <div>
                            <label htmlFor="leave_type" className="block text-sm font-medium text-gray-700 mb-2">
                                휴가 유형 <span className="text-red-500">*</span>
                            </label>
                            <select
                                id="leave_type"
                                name="leave_type"
                                value={formData.leave_type}
                                onChange={handleLeaveTypeChange}
                                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                    errors.leave_type ? "border-red-300" : "border-gray-300"
                                }`}
                            >
                                {LEAVE_TYPE_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            {errors.leave_type && <p className="text-red-500 text-sm mt-1">{errors.leave_type}</p>}
                        </div>

                        {/* 시작일 */}
                        <div>
                            <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-2">
                                {isHalfDay ? "날짜" : "시작일"} <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    id="start_date"
                                    name="start_date"
                                    type="date"
                                    value={formData.start_date}
                                    onChange={handleStartDateChange}
                                    className={`w-full px-3 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                        errors.start_date ? "border-red-300" : "border-gray-300"
                                    }`}
                                />
                                <FiCalendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            </div>
                            {errors.start_date && <p className="text-red-500 text-sm mt-1">{errors.start_date}</p>}
                        </div>

                        {/* 종료일 (반차가 아닌 경우만) */}
                        {!isHalfDay && (
                            <div>
                                <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-2">
                                    종료일 <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        id="end_date"
                                        name="end_date"
                                        type="date"
                                        value={formData.end_date}
                                        onChange={handleChange}
                                        className={`w-full px-3 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                            errors.end_date ? "border-red-300" : "border-gray-300"
                                        }`}
                                    />
                                    <FiCalendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                </div>
                                {errors.end_date && <p className="text-red-500 text-sm mt-1">{errors.end_date}</p>}
                            </div>
                        )}

                        {/* 사유 */}
                        <div>
                            <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
                                사유 <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <textarea
                                    id="reason"
                                    name="reason"
                                    value={formData.reason}
                                    onChange={handleChange}
                                    rows={3}
                                    placeholder="휴가 사유를 입력해주세요"
                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none ${
                                        errors.reason ? "border-red-300" : "border-gray-300"
                                    }`}
                                />
                                <FiFileText className="absolute right-3 top-3 text-gray-400 w-4 h-4" />
                            </div>
                            {errors.reason && <p className="text-red-500 text-sm mt-1">{errors.reason}</p>}
                        </div>
                    </div>

                    {/* 버튼 영역 */}
                    <div className="mt-6 pt-4 border-t border-gray-200">
                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                            >
                                취소
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={createVacationMutation.isPending}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {createVacationMutation.isPending ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                        신청 중...
                                    </>
                                ) : (
                                    <>
                                        <FiSend className="w-4 h-4 mr-2" />
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
