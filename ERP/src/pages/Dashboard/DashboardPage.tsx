import Table from '../../components/table/table';
import { HiArchiveBox } from 'react-icons/hi2';
import { IoClipboard } from 'react-icons/io5';
import { IoPeopleSharp } from 'react-icons/io5';
import { Link } from 'react-router-dom';
import { useDashboard } from '../../hooks/queries/useDashboard';

const DashboardPage = () => {
  const { data: dashboardData, isLoading, error } = useDashboard();

  if (isLoading) {
    return (
      <div className='p-6'>
        <div className='flex h-64 items-center justify-center'>
          <div className='text-lg'>데이터를 불러오는 중...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='p-6'>
        <div className='flex h-64 items-center justify-center'>
          <div className='text-lg text-red-600'>데이터를 불러오는데 실패했습니다.</div>
        </div>
      </div>
    );
  }

  // 재고 부족 상품 테이블 데이터
  const lowStockColumns = ['제품코드', '제품명', '옵션', '현재 재고', '최소 재고'];
  const lowStockData =
    dashboardData?.top_low_stock.map((item) => ({
      ['제품코드']: item.variant_code,
      ['제품명']: item.product_name,
      ['옵션']: item.option,
      ['현재 재고']: item.stock,
      ['최소 재고']: item.min_stock,
    })) || [];

  // 최근 발주 현황 테이블 데이터
  const recentOrdersColumns = ['발주번호', '업체', '발주일', '예상 입고일', '담당자', '상태'];
  const recentOrdersData =
    dashboardData?.recent_orders.map((item) => ({
      ['발주번호']: item.order_id,
      ['업체']: item.supplier,
      ['발주일']: item.order_date,
      ['예상 입고일']: item.expected_delivery_date,
      ['담당자']: item.manager,
      ['상태']: item.status,
    })) || [];

  const vacations = dashboardData?.recent_vacations ?? [];

  return (
    <div className='p-6'>
      <h1 className='mb-4 text-2xl font-bold'>대시보드</h1>
      <div className='mb-6 grid grid-cols-3 gap-4'>
        <Link to='/inventory' className='flex items-center rounded-lg bg-indigo-600 p-4 text-white'>
          <HiArchiveBox className='mr-3 h-10 w-9' />
          <div className='flex-col'>
            <h3 className='text-lg font-bold'>재고 관리</h3>
            <p>전체 상품 재고 확인 및 관리</p>
          </div>
        </Link>
        <Link to='/orders' className='flex items-center rounded-lg bg-green-600 p-4 text-white'>
          <IoClipboard className='mr-3 h-10 w-9' />
          <div className='flex-col'>
            <h3 className='text-lg font-bold'>발주 관리</h3>
            <p>발주 요청 및 승인 프로세스 관리</p>
          </div>
        </Link>
        <Link to='/hr' className='flex items-center rounded-lg bg-purple-600 p-4 text-white'>
          <IoPeopleSharp className='mr-3 h-10 w-9' />
          <div className='flex-col'>
            <h3 className='text-lg font-bold'>HR 관리</h3>
            <p>직원 정보 및 관리</p>
          </div>
        </Link>
      </div>
      <div className='flex gap-6'>
        <div className='flex-1 rounded-lg bg-white p-4 shadow-md'>
          <div className='border-b- flex h-17.25 items-center justify-between border-b-1 pt-5 pr-4 pb-5.25'>
            <h2 className='mb-2 text-lg font-medium text-gray-900'>재고 부족 상품</h2>
            <img src='/images/warn.png' className='h-6 w-6' />
          </div>
          <div className='mt-4'>
            <Table columns={lowStockColumns} data={lowStockData} />
          </div>
          <div className='mt-4 flex cursor-pointer items-center space-x-1 text-indigo-600 hover:text-indigo-800'>
            <Link to='/inventory' className='flex items-center space-x-1'>
              <span className='text-sm font-medium'>전체 재고 확인하기</span>
              <svg
                xmlns='http://www.w3.org/2000/svg'
                className='h-4 w-4'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  d='M9 5l7 7-7 7'
                />
              </svg>
            </Link>
          </div>
        </div>
        <div className='flex-1 rounded-lg bg-white p-4 shadow-md'>
          <div className='flex h-17.25 items-center justify-between border-b-1 pt-5 pr-4 pb-5.25'>
            <h2 className='mb-2 text-lg font-medium text-gray-900'>최근 발주 현황</h2>
            <img src='/images/status.png' className='h-6 w-6' />
          </div>
          <div className='mt-4'>
            <Table columns={recentOrdersColumns} data={recentOrdersData} />
          </div>
          <div className='mt-4 flex cursor-pointer items-center space-x-1 text-indigo-600 hover:text-indigo-800'>
            <Link to='/orders' className='flex items-center space-x-1'>
              <span className='text-sm font-medium'>전체 발주 확인하기</span>
              <svg
                xmlns='http://www.w3.org/2000/svg'
                className='h-4 w-4'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  d='M9 5l7 7-7 7'
                />
              </svg>
            </Link>
          </div>
        </div>
      </div>
      <div className='mt-4'>
        <div className='flex items-center'>
          <img src='/images/alert.png' className='mb-1.5 h-6 w-6' />
          <h2 className='mb-2 text-lg font-medium text-gray-900'>입고 예정 발주</h2>
        </div>
        <div className='rounded-lg bg-white p-4 shadow-md'>
          <div className='grid grid-cols-1 gap-3'>
            {dashboardData?.arriving_soon_orders.map((order) => (
              <div
                key={order.order_id}
                className='rounded border-l-4 border-blue-500 bg-blue-50 p-4'>
                <div className='flex items-center justify-between'>
                  <div>
                    <span className='font-medium text-gray-900'>발주번호: {order.order_id}</span>
                    <span className='ml-4 text-gray-600'>업체: {order.supplier}</span>
                  </div>
                  <div className='text-sm text-gray-500'>
                    예상 입고일: {order.expected_delivery_date}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className='mt-6 grid grid-cols-2 gap-6'>
        <div className='rounded-lg bg-white p-6 shadow-md'>
          <div className='mb-4 flex items-center'>
            <img src='/images/sales.png' alt='매출 아이콘' className='mr-2 h-5 w-5' />
            <h2 className='text-lg font-medium text-gray-900'>총 매출</h2>
          </div>
          <div className='rounded-lg bg-gray-50 p-6'>
            <div className='mb-1 flex items-center text-gray-600'>
              <img src='/images/month.png' alt='총 매출' className='mr-1 h-4 w-4' />
              <span className='text-sm'>월별 업로드된 POS 데이터 기준</span>
            </div>
            <div className='text-3xl font-bold text-gray-900'>
              ₩{dashboardData?.total_sales.toLocaleString() || 0}
            </div>
          </div>
        </div>

        <div className='rounded-lg bg-white p-6 shadow-md'>
          <div className='mb-4 flex items-center'>
            <img src='/images/productcode.svg' alt='최고 매출 상품' className='mr-2 h-5 w-5' />
            <h2 className='text-lg font-medium text-gray-900'>최고 매출 상품</h2>
          </div>
          <div className='space-y-3'>
            {dashboardData?.top_sales.slice(0, 3).map((item, index) => (
              <div
                key={item.variant_code}
                className='flex items-center justify-between rounded bg-gray-50 p-3'>
                <div>
                  <div className='font-medium text-gray-900'>{item.product_name}</div>
                  <div className='text-sm text-gray-500'>{item.option}</div>
                </div>
                <div className='text-right'>
                  <div className='font-bold text-gray-900'>₩{item.sales.toLocaleString()}</div>
                  <div className='text-xs text-gray-500'>#{index + 1}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className='mt-6 rounded-lg bg-white p-6 shadow-md'>
        <div className='mb-4 flex items-center'>
          <IoPeopleSharp className='mr-2 h-5 w-5 text-purple-600' />
          <h2 className='text-lg font-medium text-gray-900'>최근 휴가 현황</h2>
        </div>
        <div className='space-y-3'>
          {vacations.length > 0 ? (
            vacations.map((vacation, index) => (
              <div key={index} className='flex items-center justify-between rounded bg-gray-50 p-3'>
                <div>
                  <div className='font-medium text-gray-900'>{vacation.employee}</div>
                  <div className='text-sm text-gray-500'>{vacation.leave_type}</div>
                </div>
                <div className='text-right'>
                  <div className='text-sm font-medium text-gray-900'>
                    {vacation.start_date} ~ {vacation.end_date}
                  </div>
                  <div className='text-xs text-gray-500'>
                    신청일: {new Date(vacation.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className='py-4 text-center text-gray-500'>최근 휴가 신청이 없습니다.</div>
          )}
        </div>
        <div className='mt-4 flex cursor-pointer items-center space-x-1 text-indigo-600 hover:text-indigo-800'>
          <Link to='/hr' className='flex items-center space-x-1'>
            <span className='text-sm font-medium'>HR 관리 바로가기</span>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              className='h-4 w-4'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M9 5l7 7-7 7' />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
