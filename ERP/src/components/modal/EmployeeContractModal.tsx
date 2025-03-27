// src/components/modals/EmployeeContractModal.tsx
import React from 'react';
import { FiX, FiUser, FiCalendar, FiPrinter, FiDownload } from 'react-icons/fi';

interface EmployeeContractModalProps {
    employee: any;
    onClose: () => void;
    onViewInfo: () => void;
}

const EmployeeContractModal: React.FC<EmployeeContractModalProps> = ({ employee, onClose, onViewInfo }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-auto">
            <div className="w-[896px] max-h-[90vh] bg-white rounded-lg shadow-xl flex flex-col overflow-auto">
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
                            className="w-96 h-10 flex items-center justify-center bg-white text-gray-700"
                            onClick={onViewInfo}
                        >
                            <FiUser className="mr-2" />
                            <span className="text-base font-medium">직원 정보</span>
                        </button>
                        <button className="w-96 h-10 flex items-center justify-center bg-indigo-600 text-white">
                            <FiCalendar className="mr-2" />
                            <span className="text-base font-medium">근로계약서</span>
                        </button>
                    </div>

                    {/* 근로계약서 내용 */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <div className="text-center mb-6">
                            <h3 className="text-xl font-bold">근 로 계 약 서 (기간제)</h3>
                        </div>

                        <div className="flex justify-between mb-8">
                            <div>
                                <p className="font-bold mb-1">(甲)사용자</p>
                                <p>회 사 명: ㈜ 고대미래</p>
                                <p>대표자명: 유 시 진</p>
                            </div>
                            <div>
                                <p className="font-bold mb-1">(乙)근로자</p>
                                <p>성 명: {employee.name}</p>
                                <p>
                                    주민등록번호:{' '}
                                    {employee.birthdate
                                        ? employee.birthdate.substring(0, 6) + '-*******'
                                        : '******-*******'}
                                </p>
                                <p>주 소: {employee.address || '미등록'}</p>
                                <p>전화번호: {employee.phone || '미등록'}</p>
                            </div>
                        </div>

                        <p className="text-center mb-6">
                            아래의 근로조건을 성실히 이행할 것을 약정하고 근로계약을 체결한다.
                        </p>
                        <p className="text-center mb-6">- 아 래 -</p>

                        {/* 계약 내용 테이블 */}
                        <div className="border border-gray-200 mb-8">
                            <div className="flex border-b border-gray-200">
                                <div className="w-40 p-2 bg-gray-50 font-bold text-center border-r border-gray-200">
                                    직 무
                                </div>
                                <div className="flex-1 p-2">{employee.job || '크림슨스토어 판매 및 관리'}</div>
                            </div>
                            <div className="flex border-b border-gray-200">
                                <div className="w-40 p-2 bg-gray-50 font-bold text-center border-r border-gray-200">
                                    근무장소
                                </div>
                                <div className="flex-1 p-2">㈜고대미래 크림슨스토어 매장</div>
                            </div>
                            <div className="flex border-b border-gray-200">
                                <div className="w-40 p-2 bg-gray-50 font-bold text-center border-r border-gray-200">
                                    계약기간
                                </div>
                                <div className="flex-1 p-2">
                                    {employee.contractPeriod || `${employee.startDate} ~ (1년)`}
                                </div>
                            </div>
                            <div className="flex border-b border-gray-200">
                                <div className="w-40 p-2 bg-gray-50 font-bold text-center border-r border-gray-200">
                                    임금
                                </div>
                                <div className="flex-1 p-2">
                                    <p>①연봉:xx,000,000(월 x,xxx,xxx원)</p>
                                    <p>②월봉내역: 월소정근로:x,xxx,xxx원(세전 지급액)</p>
                                    <p>③연봉 외에 x년차 근속수당으로 월 xx만원을 추가 지급함</p>
                                    <p>④임금은 매월 25일에 지급함 (임금계산기간 매월 1일~말일)</p>
                                </div>
                            </div>
                            <div className="flex border-b border-gray-200">
                                <div className="w-40 p-2 bg-gray-50 font-bold text-center border-r border-gray-200">
                                    근로시간/휴게
                                </div>
                                <div className="flex-1 p-2">
                                    <p>
                                        {employee.workHours ||
                                            '출퇴근시간은 평일 오전09:00 ~오후18:00 로 하며, 점심시간은 12:00~13:00 시 로 하되 근무여건에 따라서 조정하기로 함.'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex border-b border-gray-200">
                                <div className="w-40 p-2 bg-gray-50 font-bold text-center border-r border-gray-200">
                                    연차휴가
                                </div>
                                <div className="flex-1 p-2">
                                    <p>
                                        근속 1년 미만자는 1월간 개근 시 1일을, 1년간 8할 이상 출근한 직원에 대하여
                                        15일의 유급휴가를 주는 등 '자체직원 인사규정'에 준함.
                                    </p>
                                </div>
                            </div>
                            <div className="flex border-b border-gray-200">
                                <div className="w-40 p-2 bg-gray-50 font-bold text-center border-r border-gray-200">
                                    사직절차
                                </div>
                                <div className="flex-1 p-2">
                                    <p>
                                        계약기간 중 사직하고자 할 경우에는 사직일로부터 30일전에 사표를 제출하고 업무
                                        인수인계 및 후임자를 선임 할 때까지 성실하게 근무하여야 함.
                                    </p>
                                </div>
                            </div>
                            <div className="flex border-b border-gray-200">
                                <div className="w-40 p-2 bg-gray-50 font-bold text-center border-r border-gray-200">
                                    근무성적 평가
                                </div>
                                <div className="flex-1 p-2">
                                    <p>
                                        甲은 乙의 근무성적에 대하여 근무성적평가를 할 수 있으며 세부사항은 '자체직원
                                        인사규정'의 정한 바에 따름.
                                    </p>
                                </div>
                            </div>
                            <div className="flex border-b border-gray-200">
                                <div className="w-40 p-2 bg-gray-50 font-bold text-center border-r border-gray-200">
                                    해지사유
                                </div>
                                <div className="flex-1 p-2">
                                    <p>①상기 계약기간의 만료일</p>
                                    <p>②'자체직원 인사규정'에서 정한 징계사유 중 해고된 때</p>
                                    <p>
                                        ③계약기간 중이라도 사업의 폐지,중단,종료된 때 또는 乙의 직무가 부득이하게
                                        불필요하게 된 때
                                    </p>
                                </div>
                            </div>
                            <div className="flex">
                                <div className="w-40 p-2 bg-gray-50 font-bold text-center border-r border-gray-200">
                                    기타근로조건
                                </div>
                                <div className="flex-1 p-2">
                                    <p>①본 계약서에 명시되지 않은 사항은 '자체직원 인사규정'의 정한 바에 따름.</p>
                                    <p>
                                        ②乙은 직무를 수행함에 있어 지득한 정보의 중요사항을 외부에 누설하여서는 아니됨.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="text-center mb-8">
                            <p>
                                {employee.startDate?.substring(0, 4) || '2025'}년{' '}
                                {employee.startDate?.substring(5, 7) || '01'}월{' '}
                                {employee.startDate?.substring(8, 10) || '01'}일
                            </p>
                        </div>

                        <div className="flex justify-center mb-8">
                            <div className="text-right mr-8">
                                <p className="font-bold">( 甲 )</p>
                                <p>㈜고대미래 대표이사 유 시 진 (인)</p>
                            </div>
                            <div>
                                <p className="font-bold">( 乙 )</p>
                                <p>성 명: {employee.name} (인)</p>
                            </div>
                        </div>

                        <div className="flex justify-center">
                            <button className="px-4 py-2 bg-blue-600 text-white rounded flex items-center mr-4">
                                <FiPrinter className="w-6 h-6 mr-2" />
                                <span>계약서 인쇄</span>
                            </button>
                            <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded flex items-center">
                                <FiDownload className="w-6 h-6 mr-2" />
                                <span>PDF 다운로드</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmployeeContractModal;
