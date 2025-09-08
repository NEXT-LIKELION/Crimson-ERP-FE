import { HiArchiveBox } from 'react-icons/hi2';
import { IoClipboard } from 'react-icons/io5';
import { IoPeopleSharp } from 'react-icons/io5';
import { Link } from 'react-router-dom';
import InlineVacationCalendar from '../../components/calendar/InlineVacationCalendar';

const DashboardPage = () => {

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
      
      {/* 휴가 캘린더 섹션 */}
      <div className='rounded-lg bg-white p-6 shadow-md'>
        <div className='mb-6 flex items-center'>
          <IoPeopleSharp className='mr-3 h-6 w-6 text-purple-600' />
          <Link to='/hr' className='cursor-pointer transition-colors hover:text-purple-600'>
            <h2 className='text-xl font-semibold text-gray-900 hover:text-purple-600'>휴가 캘린더</h2>
          </Link>
        </div>
        <InlineVacationCalendar />
      </div>
    </div>
  );
};

export default DashboardPage;
