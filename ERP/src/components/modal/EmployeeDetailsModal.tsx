// src/components/modals/EmployeeDetailsModal.tsx
import React, { useState, useRef } from 'react';
import { FiX, FiUser, FiCalendar, FiMail, FiPhone, FiPrinter, FiEdit, FiCheck, FiXCircle } from 'react-icons/fi';
import StatusBadge from '../common/StatusBadge';
import PrimaryButton from '../button/PrimaryButton';
import SecondaryButton from '../button/SecondaryButton';

interface EmployeeDetailsModalProps {
    employee: any;
    onClose: () => void;
    onViewContract: () => void;
    onUpdateEmployee?: (updatedEmployee: any) => void;
}

const EmployeeDetailsModal: React.FC<EmployeeDetailsModalProps> = ({
    employee,
    onClose,
    onViewContract,
    onUpdateEmployee,
}) => {
    const [activeTab, setActiveTab] = useState<'info' | 'contract'>('info');
    const [isEditing, setIsEditing] = useState(false);
    const [editedEmployee, setEditedEmployee] = useState({ ...employee });
    const printRef = useRef<HTMLDivElement>(null);

    // 상태에 따른 StatusBadge 설정
    const getStatusBadge = (status: string) => {
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

    // 인쇄 기능
    const handlePrint = () => {
        if (printRef.current) {
            // 인쇄 창 열기
            const printWindow = window.open('', '_blank');

            if (printWindow) {
                // 인쇄할 HTML 콘텐츠 생성
                printWindow.document.write(`
          <html>
            <head>
              <title>${employee.name} (${employee.id}) - 직원 정보</title>
              <style>
                body {
                  font-family: Arial, sans-serif;
                  padding: 20px;
                  line-height: 1.5;
                }
                .header {
                  text-align: center;
                  margin-bottom: 20px;
                  padding-bottom: 10px;
                  border-bottom: 1px solid #ccc;
                }
                .section {
                  margin-bottom: 20px;
                }
                .section-title {
                  font-size: 16px;
                  font-weight: bold;
                  margin-bottom: 10px;
                  padding-bottom: 5px;
                  border-bottom: 1px solid #eee;
                }
                .info-grid {
                  display: grid;
                  grid-template-columns: 1fr 1fr;
                  gap: 10px;
                }
                .info-item {
                  margin-bottom: 5px;
                }
                .label {
                  font-weight: bold;
                }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>${employee.name} (${employee.id})</h1>
                <p>직급: ${employee.position} | 상태: ${
                    employee.status === 'active'
                        ? '재직중'
                        : employee.status === 'vacation'
                        ? '휴가중'
                        : employee.status === 'leave'
                        ? '휴직중'
                        : '퇴사'
                }</p>
              </div>
              
              <div class="section">
                <div class="section-title">기본 정보</div>
                <div class="info-grid">
                  <div class="info-item"><span class="label">이메일:</span> ${employee.email || '미등록'}</div>
                  <div class="info-item"><span class="label">전화번호:</span> ${employee.phone || '미등록'}</div>
                  <div class="info-item"><span class="label">입사일:</span> ${employee.startDate || '미등록'}</div>
                </div>
              </div>
              
              <div class="section">
                <div class="section-title">개인 정보</div>
                <div class="info-grid">
                  <div class="info-item"><span class="label">생년월일:</span> ${employee.birthdate || '미등록'}</div>
                  <div class="info-item"><span class="label">성별:</span> ${employee.gender || '미등록'}</div>
                  <div class="info-item"><span class="label">주소:</span> ${employee.address || '미등록'}</div>
                  <div class="info-item"><span class="label">비상 연락처:</span> ${
                      employee.emergencyContact || '미등록'
                  }</div>
                </div>
              </div>
              
              <div class="section">
                <div class="section-title">인사 정보</div>
                <div class="info-grid">
                  <div class="info-item"><span class="label">직무:</span> ${employee.job || '미등록'}</div>
                  <div class="info-item"><span class="label">계약 기간:</span> ${
                      employee.contractPeriod || '미등록'
                  }</div>
                  <div class="info-item"><span class="label">근무 시간:</span> ${employee.workHours || '미등록'}</div>
                  <div class="info-item"><span class="label">잔여 연차:</span> ${
                      employee.remainingLeave || '미등록'
                  }</div>
                </div>
              </div>
              
              <div style="text-align: center; margin-top: 30px; font-size: 12px; color: #666;">
                이 문서는 인사 관리 시스템에서 ${new Date().toLocaleString()}에 생성되었습니다.
              </div>
            </body>
          </html>
        `);

                // 인쇄 및 창 닫기
                printWindow.document.close();
                printWindow.print();
                printWindow.close();
            }
        }
    };

    // 정보 수정 모드 전환
    const handleEditToggle = () => {
        setIsEditing(!isEditing);
        if (!isEditing) {
            setEditedEmployee({ ...employee });
        }
    };

    // 수정된 필드 변경 처리
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setEditedEmployee((prev: any) => ({
            ...prev,
            [name]: value,
        }));
    };

    // 수정 내용 저장
    const handleSaveChanges = () => {
        // 수정된 데이터 업데이트
        if (onUpdateEmployee) {
            onUpdateEmployee(editedEmployee);
        }

        // 편집 모드 해제
        setIsEditing(false);
    };

    // 수정 취소
    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditedEmployee({ ...employee });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="w-[896px] max-h-[900px] bg-white rounded-lg shadow-xl flex flex-col overflow-hidden">
                {/* 헤더 */}
                <div className="px-4 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-lg font-medium text-gray-900">
                        직원 상세보기 - {employee.name} ({employee.id})
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                        <FiX className="w-6 h-6" />
                    </button>
                </div>

                {/* 탭 메뉴 */}
                <div className="p-6 flex flex-col gap-6">
                    <div className="p-px rounded-md outline outline-1 outline-gray-200 flex overflow-hidden">
                        <button
                            className={`w-96 h-10 flex items-center justify-center ${
                                activeTab === 'info' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700'
                            }`}
                            onClick={() => setActiveTab('info')}
                        >
                            <FiUser className="mr-2" />
                            <span className="text-base font-medium">직원 정보</span>
                        </button>
                        <button
                            className={`w-96 h-10 flex items-center justify-center ${
                                activeTab === 'contract' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700'
                            }`}
                            onClick={() => {
                                setActiveTab('contract');
                                onViewContract();
                            }}
                        >
                            <FiCalendar className="mr-2" />
                            <span className="text-base font-medium">근로계약서</span>
                        </button>
                    </div>

                    {/* 직원 정보 내용 */}
                    {activeTab === 'info' && (
                        <div className="flex gap-6">
                            {/* 왼쪽 프로필 영역 */}
                            <div className="w-64 flex flex-col">
                                <div className="p-4 bg-gray-50 rounded-lg flex flex-col gap-4">
                                    {/* 프로필 이미지 & 이름 */}
                                    <div className="flex flex-col items-center">
                                        <div className="w-32 h-32 bg-gray-500 rounded-full mb-4"></div>
                                        <h3 className="text-xl font-bold text-gray-900">{employee.name}</h3>
                                        <p className="text-sm text-gray-600">{employee.id}</p>
                                        <div className="pt-2">{getStatusBadge(employee.status)}</div>
                                    </div>

                                    {/* 기본 정보 */}
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center">
                                            <FiUser className="w-6 h-6 mr-2 text-gray-500" />
                                            <span className="text-sm font-medium text-gray-700">직급:</span>
                                            <span className="text-sm ml-1 text-gray-700">{employee.position}</span>
                                        </div>
                                        <div className="flex items-center">
                                            <FiCalendar className="w-6 h-6 mr-2 text-gray-500" />
                                            <span className="text-sm font-medium text-gray-700">입사일:</span>
                                            <span className="text-sm ml-1 text-gray-700">{employee.startDate}</span>
                                        </div>
                                        <div className="flex items-center">
                                            <FiMail className="w-6 h-6 mr-2 text-gray-500" />
                                            <span className="text-sm ml-1 text-gray-700">
                                                {employee.email || 'example@example.com'}
                                            </span>
                                        </div>
                                        <div className="flex items-center">
                                            <FiPhone className="w-6 h-6 mr-2 text-gray-500" />
                                            <span className="text-sm ml-1 text-gray-700">
                                                {employee.phone || '010-0000-0000'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 오른쪽 상세 정보 영역 */}
                            <div className="flex-1 flex flex-col" ref={printRef}>
                                <div className="p-4 bg-white rounded-lg border border-gray-200 flex flex-col gap-4">
                                    {/* 개인 정보 섹션 */}
                                    <div className="border-b border-gray-200 pb-2">
                                        <h4 className="text-lg font-medium text-gray-900">개인 정보</h4>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex flex-col gap-1">
                                            <label className="text-sm font-medium text-gray-700">생년월일</label>
                                            {isEditing ? (
                                                <input
                                                    type="date"
                                                    name="birthdate"
                                                    value={editedEmployee.birthdate || ''}
                                                    onChange={handleInputChange}
                                                    className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                                                />
                                            ) : (
                                                <div className="p-2 bg-gray-50 rounded">
                                                    <span className="text-base">{employee.birthdate || '미등록'}</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-sm font-medium text-gray-700">성별</label>
                                            {isEditing ? (
                                                <select
                                                    name="gender"
                                                    value={editedEmployee.gender || ''}
                                                    onChange={handleInputChange}
                                                    className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                                                >
                                                    <option value="">선택하세요</option>
                                                    <option value="남성">남성</option>
                                                    <option value="여성">여성</option>
                                                </select>
                                            ) : (
                                                <div className="p-2 bg-gray-50 rounded">
                                                    <span className="text-base">{employee.gender || '미등록'}</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-sm font-medium text-gray-700">주소</label>
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    name="address"
                                                    value={editedEmployee.address || ''}
                                                    onChange={handleInputChange}
                                                    className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                                                />
                                            ) : (
                                                <div className="p-2 bg-gray-50 rounded">
                                                    <span className="text-base">{employee.address || '미등록'}</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-sm font-medium text-gray-700">비상 연락처</label>
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    name="emergencyContact"
                                                    value={editedEmployee.emergencyContact || ''}
                                                    onChange={handleInputChange}
                                                    className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                                                />
                                            ) : (
                                                <div className="p-2 bg-gray-50 rounded">
                                                    <span className="text-base">
                                                        {employee.emergencyContact || '미등록'}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* 인사 정보 섹션 */}
                                    <div className="border-b border-gray-200 pb-2 mt-4">
                                        <h4 className="text-lg font-medium text-gray-900">인사 정보</h4>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex flex-col gap-1">
                                            <label className="text-sm font-medium text-gray-700">직무</label>
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    name="job"
                                                    value={editedEmployee.job || ''}
                                                    onChange={handleInputChange}
                                                    className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                                                />
                                            ) : (
                                                <div className="p-2 bg-gray-50 rounded">
                                                    <span className="text-base">{employee.job || '미등록'}</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-sm font-medium text-gray-700">계약 기간</label>
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    name="contractPeriod"
                                                    value={editedEmployee.contractPeriod || ''}
                                                    onChange={handleInputChange}
                                                    className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                                                />
                                            ) : (
                                                <div className="p-2 bg-gray-50 rounded">
                                                    <span className="text-base">
                                                        {employee.contractPeriod || '미등록'}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-sm font-medium text-gray-700">근무 시간</label>
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    name="workHours"
                                                    value={editedEmployee.workHours || ''}
                                                    onChange={handleInputChange}
                                                    className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                                                />
                                            ) : (
                                                <div className="p-2 bg-gray-50 rounded">
                                                    <span className="text-base">{employee.workHours || '미등록'}</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-sm font-medium text-gray-700">잔여 연차</label>
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    name="remainingLeave"
                                                    value={editedEmployee.remainingLeave || ''}
                                                    onChange={handleInputChange}
                                                    className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                                                />
                                            ) : (
                                                <div className="p-2 bg-gray-50 rounded">
                                                    <span className="text-base">
                                                        {employee.remainingLeave || '미등록'}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* 액션 버튼 */}
                                    <div className="flex pt-2 mt-2">
                                        {isEditing ? (
                                            <>
                                                <button
                                                    onClick={handleSaveChanges}
                                                    className="px-4 py-2 bg-green-600 text-white rounded flex items-center"
                                                >
                                                    <FiCheck className="w-6 h-6 mr-2" />
                                                    <span>저장</span>
                                                </button>
                                                <button
                                                    onClick={handleCancelEdit}
                                                    className="ml-3 px-4 py-2 bg-gray-500 text-white rounded flex items-center"
                                                >
                                                    <FiXCircle className="w-6 h-6 mr-2" />
                                                    <span>취소</span>
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={handlePrint}
                                                    className="px-4 py-2 bg-blue-600 text-white rounded flex items-center"
                                                >
                                                    <FiPrinter className="w-6 h-6 mr-2" />
                                                    <span>인쇄</span>
                                                </button>
                                                <button
                                                    onClick={handleEditToggle}
                                                    className="ml-3 px-4 py-2 bg-indigo-600 text-white rounded flex items-center"
                                                >
                                                    <FiEdit className="w-6 h-6 mr-2" />
                                                    <span>정보 수정</span>
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EmployeeDetailsModal;
