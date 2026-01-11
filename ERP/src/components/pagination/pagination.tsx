import { useState, useEffect } from 'react';
import { ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/20/solid';

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange?: (itemsPerPage: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
}) => {
  const [isEditingItemsPerPage, setIsEditingItemsPerPage] = useState(false);
  const [tempItemsPerPage, setTempItemsPerPage] = useState(itemsPerPage.toString());

  // itemsPerPage가 변경되면 tempItemsPerPage도 업데이트
  useEffect(() => {
    if (!isEditingItemsPerPage) {
      setTempItemsPerPage(itemsPerPage.toString());
    }
  }, [itemsPerPage, isEditingItemsPerPage]);

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const handleItemsPerPageBlur = () => {
    const newValue = parseInt(tempItemsPerPage);
    if (!isNaN(newValue) && newValue > 0 && newValue !== itemsPerPage) {
      onItemsPerPageChange?.(newValue);
      // 페이지를 1로 리셋 (새로운 itemsPerPage에 맞춰)
      onPageChange(1);
    } else {
      setTempItemsPerPage(itemsPerPage.toString());
    }
    setIsEditingItemsPerPage(false);
  };

  const handleItemsPerPageKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleItemsPerPageBlur();
    } else if (e.key === 'Escape') {
      setTempItemsPerPage(itemsPerPage.toString());
      setIsEditingItemsPerPage(false);
    }
  };

  // 페이지네이션에 표시할 페이지 번호 배열 생성
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 7; // 표시할 최대 페이지 수 (현재 페이지 주변)

    if (totalPages <= maxVisiblePages) {
      // 페이지가 적으면 모두 표시
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // 항상 첫 페이지 표시
      pages.push(1);

      // 현재 페이지 주변 계산
      const sidePages = Math.floor((maxVisiblePages - 3) / 2); // 양쪽에 표시할 페이지 수 (첫/마지막 페이지 제외)
      let startPage = Math.max(2, currentPage - sidePages);
      let endPage = Math.min(totalPages - 1, currentPage + sidePages);

      // 시작 페이지 조정 (첫 페이지와 겹치지 않도록)
      if (startPage <= 2) {
        startPage = 2;
        endPage = Math.min(totalPages - 1, maxVisiblePages - 2);
      }

      // 끝 페이지 조정 (마지막 페이지와 겹치지 않도록)
      if (endPage >= totalPages - 1) {
        endPage = totalPages - 1;
        startPage = Math.max(2, totalPages - (maxVisiblePages - 2));
      }

      // 첫 페이지와 시작 페이지 사이에 '...' 추가
      if (startPage > 2) {
        pages.push('...');
      }

      // 중간 페이지들 추가
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }

      // 끝 페이지와 마지막 페이지 사이에 '...' 추가
      if (endPage < totalPages - 1) {
        pages.push('...');
      }

      // 항상 마지막 페이지 표시
      pages.push(totalPages);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className='flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3'>
      <div className='flex items-center space-x-2 text-sm'>
        <p className='text-gray-700'>항목당 표시</p>
        {isEditingItemsPerPage ? (
          <input
            type='number'
            value={tempItemsPerPage}
            onChange={(e) => setTempItemsPerPage(e.target.value)}
            onBlur={handleItemsPerPageBlur}
            onKeyDown={handleItemsPerPageKeyDown}
            className='inline-flex h-7 w-16 items-center justify-center rounded-md border border-blue-500 bg-white px-2 text-center text-sm font-medium text-black focus:ring-2 focus:ring-blue-500 focus:outline-none'
            min='1'
            autoFocus
          />
        ) : (
          <span
            onClick={() => {
              if (onItemsPerPageChange) {
                setIsEditingItemsPerPage(true);
                setTempItemsPerPage(itemsPerPage.toString());
              }
            }}
            className={`inline-flex h-7 w-10 items-center justify-center rounded-md border border-gray-300 bg-white font-medium text-black ${
              onItemsPerPageChange ? 'cursor-pointer hover:border-blue-500 hover:bg-blue-50' : ''
            }`}>
            {itemsPerPage}
          </span>
        )}
        <p className='text-gray-700'>/ 페이지</p>
      </div>
      <nav className='flex items-center space-x-1'>
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className='flex h-9 w-10 items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50'>
          <ArrowLeftIcon className='h-5 w-5' />
        </button>
        {pageNumbers.map((page, index) => {
          if (page === '...') {
            return (
              <span
                key={`ellipsis-${index}`}
                className='flex h-9 w-10 items-center justify-center text-gray-500'>
                ...
              </span>
            );
          }

          const pageNum = page as number;
          return (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              className={`h-9 w-10 rounded-md ${
                currentPage === pageNum
                  ? 'border-blue-700 bg-blue-100 text-blue-700'
                  : 'border-gray-300 bg-white text-gray-700'
              } flex items-center justify-center border hover:cursor-pointer hover:bg-gray-50`}>
              {pageNum}
            </button>
          );
        })}
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className='flex h-9 w-10 cursor-pointer items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:cursor-default hover:bg-gray-50 disabled:opacity-50'>
          <ArrowRightIcon className='h-5 w-5' />
        </button>
      </nav>
    </div>
  );
};

export default Pagination;
