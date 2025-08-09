import Table from "../../components/table/table";
import { HiArchiveBox } from "react-icons/hi2";
import { IoClipboard } from "react-icons/io5";
import { IoPeopleSharp } from "react-icons/io5";
import { Link } from "react-router-dom";
import { useDashboard } from "../../hooks/queries/useDashboard";

const DashboardPage = () => {
    const { data: dashboardData, isLoading, error } = useDashboard();

    if (isLoading) {
        return (
            <div className="p-6">
                <div className="flex justify-center items-center h-64">
                    <div className="text-lg">데이터를 불러오는 중...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <div className="flex justify-center items-center h-64">
                    <div className="text-lg text-red-600">데이터를 불러오는데 실패했습니다.</div>
                </div>
            </div>
        );
    }

    // 재고 부족 상품 테이블 데이터
    const lowStockColumns = ["제품코드", "제품명", "옵션", "현재 재고", "최소 재고"];
    const lowStockData =
        dashboardData?.top_low_stock.map((item) => ({
            ["제품코드"]: item.variant_code,
            ["제품명"]: item.product_name,
            ["옵션"]: item.option,
            ["현재 재고"]: item.stock,
            ["최소 재고"]: item.min_stock,
        })) || [];

    // 최근 발주 현황 테이블 데이터
    const recentOrdersColumns = ["발주번호", "업체", "발주일", "예상 입고일", "담당자", "상태"];
    const recentOrdersData =
        dashboardData?.recent_orders.map((item) => ({
            ["발주번호"]: item.order_id,
            ["업체"]: item.supplier,
            ["발주일"]: item.order_date,
            ["예상 입고일"]: item.expected_delivery_date,
            ["담당자"]: item.manager,
            ["상태"]: item.status,
        })) || [];

    const vacations = dashboardData?.recent_vacations ?? [];

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">대시보드</h1>
            <div className="grid grid-cols-3 gap-4 mb-6">
                <Link to="/inventory" className="p-4 rounded-lg bg-indigo-600 text-white flex items-center">
                    <HiArchiveBox className="w-9 h-10 mr-3" />
                    <div className="flex-col">
                        <h3 className="text-lg font-bold">재고 관리</h3>
                        <p>전체 상품 재고 확인 및 관리</p>
                    </div>
                </Link>
                <Link to="/orders" className="p-4 rounded-lg bg-green-600 text-white flex items-center">
                    <IoClipboard className="w-9 h-10 mr-3" />
                    <div className="flex-col">
                        <h3 className="text-lg font-bold">발주 관리</h3>
                        <p>발주 요청 및 승인 프로세스 관리</p>
                    </div>
                </Link>
                <Link to="/hr" className="p-4 rounded-lg bg-purple-600 text-white flex items-center">
                    <IoPeopleSharp className="w-9 h-10 mr-3" />
                    <div className="flex-col">
                        <h3 className="text-lg font-bold">HR 관리</h3>
                        <p>직원 정보 및 관리</p>
                    </div>
                </Link>
            </div>
            <div className="flex gap-6">
                <div className="bg-white shadow-md rounded-lg p-4 flex-1">
                    <div className="flex h-17.25 pt-5 pb-5.25 pr-4 items-center justify-between border-b-1 border-b-">
                        <h2 className="text-lg font-medium text-gray-900 mb-2">재고 부족 상품</h2>
                        <img src="/images/warn.png" className="w-6 h-6" />
                    </div>
                    <div className="mt-4">
                        <Table columns={lowStockColumns} data={lowStockData} />
                    </div>
                    <div className="flex items-center space-x-1 text-indigo-600 hover:text-indigo-800 cursor-pointer mt-4">
                        <Link to="/inventory" className="flex items-center space-x-1">
                            <span className="text-sm font-medium">전체 재고 확인하기</span>
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="w-4 h-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                            </svg>
                        </Link>
                    </div>
                </div>
                <div className="bg-white shadow-md rounded-lg p-4 flex-1">
                    <div className="flex h-17.25 pt-5 pb-5.25 pr-4 items-center justify-between border-b-1">
                        <h2 className="text-lg font-medium text-gray-900 mb-2">최근 발주 현황</h2>
                        <img src="/images/status.png" className="w-6 h-6" />
                    </div>
                    <div className="mt-4">
                        <Table columns={recentOrdersColumns} data={recentOrdersData} />
                    </div>
                    <div className="flex items-center space-x-1 text-indigo-600 hover:text-indigo-800 cursor-pointer mt-4">
                        <Link to="/orders" className="flex items-center space-x-1">
                            <span className="text-sm font-medium">전체 발주 확인하기</span>
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="w-4 h-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                            </svg>
                        </Link>
                    </div>
                </div>
            </div>
            <div className="mt-4">
                <div className="flex items-center">
                    <img src="/images/alert.png" className="w-6 h-6 mb-1.5" />
                    <h2 className="text-lg font-medium text-gray-900 mb-2">입고 예정 발주</h2>
                </div>
                <div className="bg-white shadow-md rounded-lg p-4">
                    <div className="grid grid-cols-1 gap-3">
                        {dashboardData?.arriving_soon_orders.map((order) => (
                            <div key={order.order_id} className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <span className="font-medium text-gray-900">발주번호: {order.order_id}</span>
                                        <span className="ml-4 text-gray-600">업체: {order.supplier}</span>
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        예상 입고일: {order.expected_delivery_date}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-6 mt-6">
                <div className="bg-white shadow-md rounded-lg p-6">
                    <div className="flex items-center mb-4">
                        <img src="/images/sales.png" alt="매출 아이콘" className="w-5 h-5 mr-2" />
                        <h2 className="text-lg font-medium text-gray-900">총 매출</h2>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-6">
                        <div className="flex items-center text-gray-600 mb-1">
                            <img src="/images/month.png" alt="총 매출" className="w-4 h-4 mr-1" />
                            <span className="text-sm">월별 업로드된 POS 데이터 기준</span>
                        </div>
                        <div className="text-3xl font-bold text-gray-900">
                            ₩{dashboardData?.total_sales.toLocaleString() || 0}
                        </div>
                    </div>
                </div>

                <div className="bg-white shadow-md rounded-lg p-6">
                    <div className="flex items-center mb-4">
                        <img src="/images/productcode.svg" alt="최고 매출 상품" className="w-5 h-5 mr-2" />
                        <h2 className="text-lg font-medium text-gray-900">최고 매출 상품</h2>
                    </div>
                    <div className="space-y-3">
                        {dashboardData?.top_sales.slice(0, 3).map((item, index) => (
                            <div
                                key={item.variant_code}
                                className="flex justify-between items-center p-3 bg-gray-50 rounded"
                            >
                                <div>
                                    <div className="font-medium text-gray-900">{item.product_name}</div>
                                    <div className="text-sm text-gray-500">{item.option}</div>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-gray-900">₩{item.sales.toLocaleString()}</div>
                                    <div className="text-xs text-gray-500">#{index + 1}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="bg-white shadow-md rounded-lg p-6 mt-6">
                <div className="flex items-center mb-4">
                    <IoPeopleSharp className="w-5 h-5 mr-2 text-purple-600" />
                    <h2 className="text-lg font-medium text-gray-900">최근 휴가 현황</h2>
                </div>
                <div className="space-y-3">
                    {vacations.length > 0 ? (
                        vacations.map((vacation, index) => (
                            <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                                <div>
                                    <div className="font-medium text-gray-900">{vacation.employee}</div>
                                    <div className="text-sm text-gray-500">{vacation.leave_type}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-medium text-gray-900">
                                        {vacation.start_date} ~ {vacation.end_date}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        신청일: {new Date(vacation.created_at).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center text-gray-500 py-4">최근 휴가 신청이 없습니다.</div>
                    )}
                </div>
                <div className="flex items-center space-x-1 text-indigo-600 hover:text-indigo-800 cursor-pointer mt-4">
                    <Link to="/hr" className="flex items-center space-x-1">
                        <span className="text-sm font-medium">HR 관리 바로가기</span>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
