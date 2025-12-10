import { ProductVariantStatus } from '../../types/product';

interface VariantStatusTableProps {
  data: ProductVariantStatus[];
  isLoading?: boolean;
}

const VariantStatusTable: React.FC<VariantStatusTableProps> = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <div className='flex h-64 items-center justify-center'>
        <p className='text-gray-500'>데이터를 불러오는 중...</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className='flex h-64 items-center justify-center'>
        <p className='text-gray-500'>데이터가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      {/* 테이블 */}
      <div className='overflow-x-auto rounded-lg border border-gray-200'>
        <table className='min-w-full divide-y divide-gray-200'>
          <thead className='bg-gray-50'>
            <tr>
              <th className='px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
                대분류
              </th>
              <th className='px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
                중분류
              </th>
              <th className='px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
                카테고리
              </th>
              <th className='px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
                설명
              </th>
              <th className='px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
                온라인 품목명
              </th>
              <th className='px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
                오프라인 품목명
              </th>
              <th className='px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
                옵션
              </th>
              <th className='px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
                상세옵션
              </th>
              <th className='px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
                상품코드
              </th>
              <th className='px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500'>
                월초창고재고
              </th>
              <th className='px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500'>
                월초매장재고
              </th>
              <th className='px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500'>
                기초재고
              </th>
              <th className='px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500'>
                당월입고
              </th>
              <th className='px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500'>
                매장판매
              </th>
              <th className='px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500'>
                쇼핑몰판매
              </th>
              <th className='px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500'>
                판매합계
              </th>
              <th className='px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500'>
                재고조정
              </th>
              <th className='px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
                재고조정사유
              </th>
              <th className='px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500'>
                기말재고
              </th>
            </tr>
          </thead>
          <tbody className='divide-y divide-gray-200 bg-white'>
            {data.map((item, index) => (
              <tr key={`${item.variant_code}-${index}`} className='hover:bg-gray-50'>
                <td className='whitespace-nowrap px-4 py-3 text-sm text-gray-900'>
                  {item.big_category}
                </td>
                <td className='whitespace-nowrap px-4 py-3 text-sm text-gray-900'>
                  {item.middle_category}
                </td>
                <td className='whitespace-nowrap px-4 py-3 text-sm text-gray-900'>
                  {item.category}
                </td>
                <td className='whitespace-nowrap px-4 py-3 text-sm text-gray-900'>
                  {item.description}
                </td>
                <td className='px-4 py-3 text-sm text-gray-900'>{item.online_name}</td>
                <td className='px-4 py-3 text-sm text-gray-900'>{item.offline_name}</td>
                <td className='whitespace-nowrap px-4 py-3 text-sm text-gray-900'>{item.option}</td>
                <td className='whitespace-nowrap px-4 py-3 text-sm text-gray-900'>
                  {item.detail_option}
                </td>
                <td className='whitespace-nowrap px-4 py-3 text-sm font-medium text-blue-600'>
                  {item.product_code}
                </td>
                <td className='whitespace-nowrap px-4 py-3 text-right text-sm text-gray-900'>
                  {item.warehouse_stock_start?.toLocaleString() || 0}
                </td>
                <td className='whitespace-nowrap px-4 py-3 text-right text-sm text-gray-900'>
                  {item.store_stock_start?.toLocaleString() || 0}
                </td>
                <td className='whitespace-nowrap px-4 py-3 text-right text-sm font-medium text-gray-900'>
                  {item.initial_stock?.toLocaleString() || 0}
                </td>
                <td className='whitespace-nowrap px-4 py-3 text-right text-sm text-gray-900'>
                  {item.inbound_quantity?.toLocaleString() || 0}
                </td>
                <td className='whitespace-nowrap px-4 py-3 text-right text-sm text-gray-900'>
                  {item.store_sales?.toLocaleString() || 0}
                </td>
                <td className='whitespace-nowrap px-4 py-3 text-right text-sm text-gray-900'>
                  {item.online_sales?.toLocaleString() || 0}
                </td>
                <td className='whitespace-nowrap px-4 py-3 text-right text-sm font-medium text-gray-900'>
                  {item.total_sales?.toLocaleString() || 0}
                </td>
                <td className='whitespace-nowrap px-4 py-3 text-right text-sm text-gray-900'>
                  {item.stock_adjustment?.toLocaleString() || 0}
                </td>
                <td className='px-4 py-3 text-sm text-gray-900'>{item.stock_adjustment_reason}</td>
                <td className='whitespace-nowrap px-4 py-3 text-right text-sm font-medium text-green-600'>
                  {item.ending_stock?.toLocaleString() || 0}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 데이터 개수 표시 */}
      <div className='text-sm text-gray-500'>
        총 <span className='font-medium text-gray-900'>{data.length}</span>개 항목
      </div>
    </div>
  );
};

export default VariantStatusTable;
