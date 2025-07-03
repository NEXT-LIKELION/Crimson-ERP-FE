import Pagination from '../../components/pagination/pagination';
import Table from '../../components/table/table';
import { HiArchiveBox } from 'react-icons/hi2';
import { IoClipboard } from 'react-icons/io5';
import { IoPeopleSharp } from 'react-icons/io5';
import { Link } from 'react-router-dom';
import AlertCard from '../../components/common/AlertCard';
import { useState, useEffect } from 'react';

const DashboardPage = () => {
    const [reorderItems, setReorderItems] = useState<any[]>([]);
    const [orderItems, setOrderItems] = useState<any[]>([]);
    const [salesData, setSalesData] = useState<any>({});
    const [columns1, setColumns1] = useState<string[]>([]);
    const [columns2, setColumns2] = useState<string[]>([]);
    const [data1, setData1] = useState<any[]>([]);
    const [data2, setData2] = useState<any[]>([]);
    const [reorderAlert, setReorderAlert] = useState<any[]>([]);

    useEffect(() => {
        fetch('/data/dummy.json')
            .then((response) => response.json())
            .then((json) => {
                setReorderItems(json.reorderItems);
                setOrderItems(json.orderItems);
                setSalesData(json.salesData);
                setReorderAlert(json.reorderAlert);

                // 컬럼 수동 설정
                setColumns1(['제품코드', '제품명', '카테고리', '현재 재고']);
                setColumns2(['발주번호', '업체', '날짜', '금액', '상태']);

                // 데이터 매핑
                const mappedData1 = json.reorderItems.map((item: any) => ({
                    ['제품코드']: item.product_id,
                    ['제품명']: item.productName,
                    ['카테고리']: item.category,
                    ['현재 재고']: item.stock,
                }));

                const mappedData2 = json.orderItems.map((item: any) => ({
                    ['발주번호']: item.orderNumber,
                    ['업체']: item.company,
                    ['날짜']: item.date,
                    ['금액']: item.amount,
                    ['상태']: item.status,
                }));

                setData1(mappedData1);
                setData2(mappedData2);
            })
            .catch((error) => console.error('Error fetching data:', error));
    }, []);

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
                        <Table columns={columns1} data={data1} />
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
                        <Table columns={columns2} data={data2} />
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
                    <h2 className="text-lg font-medium text-gray-900 mb-2">재발주 임박 상품</h2>
                </div>
                <div className="grid grid-cols-3 gap-4">
                    {reorderAlert.map((reorderAlert, index) => (
                        <div key={index}>
                            <AlertCard
                                productName={reorderAlert.productName}
                                product_id={reorderAlert.product_id}
                                stock={reorderAlert.stock}
                                avgSales={reorderAlert.avgSales}
                                orderDeadline={reorderAlert.orderDeadline}
                            />
                        </div>
                    ))}
                </div>
            </div>
            <div className="bg-white shadow-md rounded-lg p-6 mt-6">
                <div className="flex items-center mb-4">
                    <img src="/images/sales.png" alt="매출 아이콘" className="w-5 h-5 mr-2" />
                    <h2 className="text-lg font-medium text-gray-900">매출 현황</h2>
                </div>
                <div className="flex justify-between gap-4">
                    {/* 이번 달 총매출 */}
                    <div className="bg-gray-50 rounded-lg p-6 flex-1">
                        <div className="flex items-center text-gray-600 mb-1">
                            <img src="/images/month.png" alt="이번 달 총매출" className="w-4 h-4 mr-1" />
                            <span className="text-sm">이번 달 총매출</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900">{salesData.month}</div>
                    </div>

                    {/* 이번 주 총매출 */}
                    <div className="bg-gray-50 rounded-lg p-6 flex-1">
                        <div className="flex items-center text-gray-600 mb-1">
                            <img src="/images/week.png" alt="이번 주 총매출" className="w-4 h-4 mr-1" />
                            <span className="text-sm">이번 주 총매출</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900">{salesData.week}</div>
                    </div>

                    {/* 오늘 총매출 */}
                    <div className="bg-gray-50 rounded-lg p-6 flex-1">
                        <div className="flex items-center text-gray-600 mb-1">
                            <img src="/images/day.png" alt="오늘 총매출" className="w-4 h-4 mr-1" />
                            <span className="text-sm">오늘 총매출</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900">{salesData.day}</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
