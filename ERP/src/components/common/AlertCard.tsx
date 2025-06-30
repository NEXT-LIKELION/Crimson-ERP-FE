import React from 'react';
import StatusBadge from './StatusBadge';

interface AlertCardProps {
    productName: string;
    product_id: string;
    stock: number;
    avgSales: number;
    orderDeadline: string;
}

const AlertCard: React.FC<AlertCardProps> = ({ productName, product_id, stock, avgSales, orderDeadline }) => {
    // 숫자만 추출해서 파싱
    const deadlineNumber = parseInt(orderDeadline.replace(/[^0-9]/g, ''), 10);

    // 조건에 따라 theme 설정
    const badgeTheme: 'rejected' | 'pending' | 'neutral' =
        deadlineNumber <= 9 ? 'rejected' : deadlineNumber <= 20 ? 'pending' : 'neutral';

    return (
        <div
            className="
      bg-white rounded-lg shadow-sm overflow-hidden
      border-l-4 border-yellow-400 font-inter
      w-92 p-4
    "
        >
            <div
                className="
        flex justify-between items-center
        px-4 py-2
      "
            >
                <h3 className="text-lg font-medium text-gray-900">{productName}</h3>
                <div className="flex items-center space-x-1 text-sm">
                    <StatusBadge
                        text={`${orderDeadline} 내 발주 필요`}
                        theme={badgeTheme}
                        icon={<img src="/images/clock.svg" className="w-4 h-4" />}
                    />
                </div>
            </div>
            <div className="p-4 space-y-2">
                <p className="text-sm text-gray-500 flex items-center">
                    <img src="/images/productcode.svg" className="w-4 h-4 mr-1" />
                    제품 코드: {product_id}
                </p>
                <p className="text-sm text-gray-500 flex items-center">
                    <img src="/images/stock.svg" className="w-4 h-4 mr-1" />
                    현재 재고: {stock}개
                </p>
                <p className="text-sm text-gray-500 flex items-center">
                    <img src="/images/average.svg" className="w-4 h-4 mr-1" />
                    평균 판매량: 일 {avgSales}개
                </p>
                <button
                    className="
          text-indigo-600 hover:text-indigo-800
          text-sm font-medium flex mt-2 items-center
        "
                >
                    <img src="/images/request.svg" className="w-4 h-4 mr-1" />
                    발주 요청하기
                </button>
            </div>
        </div>
    );
};

export default AlertCard;
