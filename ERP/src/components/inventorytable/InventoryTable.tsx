import { useState, useEffect, useRef } from 'react';
import { MdOutlineEdit, MdOutlineDelete } from 'react-icons/md';
import { MdOutlineDownload } from 'react-icons/md';
import { RxCaretSort } from 'react-icons/rx';
import { HiArrowUp } from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';
import type { ApiProductVariant } from '../../hooks/queries/useInventories';
import type { components } from '../../types/api';

// ProductVariant 타입 별칭
type ProductVariant = components['schemas']['ProductVariant'];

// Custom type for table data with string variant_id
interface TableProduct extends ProductVariant {
  variant_id: string;
  cost_price: number;
  orderCount: number;
  returnCount: number;
  totalSales: string;
  status: string;
  sales: string; // sales 필드는 string으로 고정
  name: string;
}

interface InventoryTableProps {
  inventories: ApiProductVariant[];
  onDelete: (productId: string) => Promise<void>;
  onExportToExcel: () => void;
  // 무한 스크롤 관련 props
  fetchNextPage: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  infiniteScroll: {
    totalLoaded: number;
    totalFiltered: number;
    totalCount: number;
    hasNextPage: boolean;
    isLoadingMore: boolean;
  };
}

// 정렬 가능한 헤더 컴포넌트
const SortableHeader = ({
  label,
  sortKey,
  sortOrder,
  onSort,
}: {
  label: string;
  sortKey: keyof TableProduct;
  sortOrder: 'asc' | 'desc' | null;
  onSort: (key: keyof TableProduct) => void;
}) => (
  <th
    className='cursor-pointer border-b border-gray-300 px-4 py-3 text-left'
    onClick={() => onSort(sortKey)}>
    <div className='flex w-full items-center justify-between'>
      <span>{label}</span>
      <RxCaretSort className={`transition ${sortOrder ? 'text-black' : 'text-gray-400'}`} />
    </div>
  </th>
);

// 상태별 스타일 클래스를 반환하는 헬퍼 함수
const getStatusStyle = (status: string): string => {
  switch (status) {
    case '품절':
      return 'bg-red-100 text-red-800';
    case '재고부족':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-green-100 text-green-800';
  }
};

const InventoryTable = ({
  inventories,
  onDelete,
  onExportToExcel,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  infiniteScroll,
}: InventoryTableProps) => {
  const navigate = useNavigate();
  const [data, setData] = useState<TableProduct[]>([]);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof TableProduct;
    order: 'asc' | 'desc' | null;
  }>({
    key: 'product_id',
    order: null,
  });

  useEffect(() => {
    if (!Array.isArray(inventories)) return;

    // 백엔드에서 이미 필터링된 데이터를 직접 받아서 상태만 계산
    const rows = inventories.map((item) => {
      const stock = Number(item.stock) || 0;
      const minStock = Number(item.min_stock) || 0;

      // 상태 계산: 품절 > 재고부족 > 정상
      let status = '정상';
      if (stock === 0) {
        status = '품절';
      } else if (stock && stock < minStock) {
        status = '재고부족';
      }

      const row: TableProduct = {
        product_id: item.product_id || '',
        variant_code: item.variant_code || '',
        offline_name: item.offline_name || '',
        option: item.option || '',
        price: item.price || 0,
        cost_price: item.cost_price || 0,
        min_stock: minStock,
        variant_id: item.variant_code || '',
        orderCount: item.order_count ?? 0,
        returnCount: item.return_count ?? 0,
        totalSales: item.sales ? `${item.sales.toLocaleString()}원` : '0원',
        status: status,
        category: item.category || '',
        stock,
        sales: item.sales?.toString() || '0',
        name: item.name || '',
        description: item.description,
        memo: item.memo,
        channels: item.channels,
      };
      return row;
    });

    setData(rows);
  }, [inventories]);

  // 스크롤 기반 무한 스크롤 - 강화된 중복 호출 방지
  const isLoadingRef = useRef(false);
  const lastRequestTimeRef = useRef(0);
  const scrollContainerRef = useRef<HTMLElement | null>(null);

  // 스크롤 컨테이너 찾기 및 스크롤 감지
  useEffect(() => {
    // 실제 스크롤 컨테이너 찾기 (layout.tsx의 section.overflow-auto)
    const mainContainer = document.querySelector('section.overflow-auto') as HTMLElement;
    if (!mainContainer) return;

    scrollContainerRef.current = mainContainer;

    const handleScroll = () => {
      // 스크롤이 시작되면 hasScrolled를 true로 설정
      if (mainContainer.scrollTop > 0 && !hasScrolled) {
        setHasScrolled(true);
      }
    };

    handleScroll();
    mainContainer.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      mainContainer.removeEventListener('scroll', handleScroll);
    };
  }, [hasScrolled]);

  // IntersectionObserver 설정 - 스크롤 컨테이너를 root로 사용
  useEffect(() => {
    const observerTarget = document.getElementById('infinite-scroll-trigger');
    const scrollContainer = scrollContainerRef.current;

    if (!observerTarget || !scrollContainer) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const isIntersecting = entries[0].isIntersecting;
        const now = Date.now();

        // 조건 체크: 교차 + 다음 페이지 있음 + 로딩 중 아님 + 스크롤 한 적 있음 + 최소 간격 보장
        const canTrigger =
          isIntersecting &&
          hasNextPage &&
          !isFetchingNextPage &&
          hasScrolled &&
          !isLoadingRef.current &&
          now - lastRequestTimeRef.current > 150; // 최소 150ms 간격

        if (canTrigger) {
          isLoadingRef.current = true;
          lastRequestTimeRef.current = now;

          fetchNextPage();

          // 로딩 완료 후 상태 초기화
          setTimeout(() => {
            isLoadingRef.current = false;
          }, 200);
        }
      },
      {
        // 스크롤 컨테이너를 root로 설정
        root: scrollContainer,
        // 더 정확한 트리거를 위해 threshold 설정
        threshold: 0.1,
        // rootMargin을 설정하여 조금 더 일찍 트리거
        rootMargin: '100px',
      }
    );

    observer.observe(observerTarget);

    // 컴포넌트 언마운트 시 Observer 정리
    return () => {
      observer.disconnect();
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, hasScrolled]);

  // 스크롤 위로 가기 함수
  const scrollToTop = () => {
    const mainContainer =
      scrollContainerRef.current || document.querySelector('section.overflow-auto');
    if (mainContainer) {
      mainContainer.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    }
  };

  // 정렬 함수
  const handleSort = (key: keyof TableProduct) => {
    let order: 'asc' | 'desc' | null = 'asc';
    if (sortConfig.key === key && sortConfig.order === 'asc') {
      order = 'desc';
    } else if (sortConfig.key === key && sortConfig.order === 'desc') {
      order = null;
    }
    setSortConfig({ key, order });

    if (order) {
      const sortedData = [...data].sort((a, b) => {
        const aValue = a[key];
        const bValue = b[key];

        // totalSales는 문자열이므로 원본 sales 값으로 정렬
        if (key === 'totalSales') {
          const aSales =
            typeof a.sales === 'number'
              ? a.sales
              : typeof a.sales === 'string'
                ? Number(a.sales.replace(/\D/g, '')) || 0
                : 0;
          const bSales =
            typeof b.sales === 'number'
              ? b.sales
              : typeof b.sales === 'string'
                ? Number(b.sales.replace(/\D/g, '')) || 0
                : 0;
          return order === 'asc' ? aSales - bSales : bSales - aSales;
        }

        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return order === 'asc' ? aValue - bValue : bValue - aValue;
        }

        return order === 'asc'
          ? String(aValue).localeCompare(String(bValue))
          : String(bValue).localeCompare(String(aValue));
      });
      setData(sortedData);
    }
  };

  // 백엔드에서 이미 페이지네이션된 데이터를 받으므로 슬라이싱하지 않음
  const paginatedData = data;

  return (
    <div className='rounded-lg bg-white p-6 shadow-md'>
      {/* 헤더 */}
      <div className='mb-4 flex items-center justify-between'>
        <h2 className='flex items-center text-lg font-semibold'>상품별 재고 현황</h2>
        <div className='flex items-center space-x-3 text-gray-500'>
          <span className='text-sm'>
            총 {infiniteScroll.totalCount}개 상품 ({infiniteScroll.totalLoaded}개 로딩됨)
          </span>
          <MdOutlineDownload
            className='cursor-pointer hover:text-gray-700'
            size={20}
            onClick={onExportToExcel || (() => alert('Export 기능이 연결되지 않았습니다.'))}
          />
        </div>
      </div>

      {/* 테이블 */}
      <div className='relative overflow-x-auto sm:rounded-lg'>
        <table className='w-full border-collapse text-sm text-gray-700'>
          <thead className='border-b border-gray-300 bg-gray-50 text-xs uppercase'>
            <tr>
              <SortableHeader
                label='상품코드'
                sortKey='product_id'
                sortOrder={sortConfig.key === 'product_id' ? sortConfig.order : null}
                onSort={handleSort}
              />
              <SortableHeader
                label='품목코드'
                sortKey='variant_code'
                sortOrder={sortConfig.key === 'variant_code' ? sortConfig.order : null}
                onSort={handleSort}
              />
              <SortableHeader
                label='상품명'
                sortKey='offline_name'
                sortOrder={sortConfig.key === 'offline_name' ? sortConfig.order : null}
                onSort={handleSort}
              />
              <SortableHeader
                label='카테고리'
                sortKey='category'
                sortOrder={sortConfig.key === 'category' ? sortConfig.order : null}
                onSort={handleSort}
              />
              <th className='border-b border-gray-300 px-4 py-3'>옵션</th>
              <SortableHeader
                label='판매가'
                sortKey='price'
                sortOrder={sortConfig.key === 'price' ? sortConfig.order : null}
                onSort={handleSort}
              />
              <SortableHeader
                label='매입가'
                sortKey='cost_price'
                sortOrder={sortConfig.key === 'cost_price' ? sortConfig.order : null}
                onSort={handleSort}
              />
              <SortableHeader
                label='재고(최소재고)'
                sortKey='stock'
                sortOrder={sortConfig.key === 'stock' ? sortConfig.order : null}
                onSort={handleSort}
              />
              <SortableHeader
                label='상태'
                sortKey='status'
                sortOrder={sortConfig.key === 'status' ? sortConfig.order : null}
                onSort={handleSort}
              />
              <th className='border-b border-gray-300 px-4 py-3'>결제수량</th>
              <th className='border-b border-gray-300 px-4 py-3'>환불수량</th>
              <SortableHeader
                label='판매합계'
                sortKey='totalSales'
                sortOrder={sortConfig.key === 'totalSales' ? sortConfig.order : null}
                onSort={handleSort}
              />
              <th className='border-b border-gray-300 px-4 py-3'>관리</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((product, index) => (
              <tr
                key={index}
                className={`border-b border-gray-200 ${
                  Number(product.stock) < Number(product.min_stock) ? 'bg-red-50' : 'bg-white'
                }`}>
                <td className='px-4 py-2'>{product.product_id}</td>
                <td className='px-4 py-2'>{product.variant_code}</td>
                <td className='px-4 py-2'>{product.offline_name}</td>
                <td className='px-4 py-2'>{product.category}</td>
                <td className='px-4 py-2'>{product.option}</td>
                <td className='px-4 py-2'>{Number(product.price).toLocaleString()}원</td>
                <td className='px-4 py-2'>{Number(product.cost_price).toLocaleString()}원</td>
                <td className='px-4 py-2'>
                  {product.stock}EA ({product.min_stock !== undefined ? product.min_stock : '-'})
                </td>
                <td className='px-4 py-2'>
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium whitespace-nowrap ${getStatusStyle(product.status)}`}>
                    {product.status}
                  </span>
                </td>
                <td className='px-4 py-2'>{product.orderCount}개</td>
                <td className='px-4 py-2'>{product.returnCount}개</td>
                <td className='px-4 py-2'>{product.totalSales}</td>
                <td className='px-4 py-2 text-center align-middle'>
                  <div className='inline-flex items-center justify-center gap-2'>
                    <MdOutlineEdit
                      className='cursor-pointer text-indigo-500'
                      onClick={() => {
                        navigate(`?edit=${product.variant_id}`);
                      }}
                    />
                    <MdOutlineDelete
                      className='cursor-pointer text-red-500'
                      onClick={() => onDelete(product.variant_id)}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* 무한 스크롤 컨트롤 */}
      <div className='mt-4 flex flex-col items-center gap-3'>
        {isFetchingNextPage && (
          <div className='flex items-center gap-2 text-sm text-gray-600'>
            <div className='h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent'></div>
            <span>더 많은 상품을 불러오는 중...</span>
          </div>
        )}

        {/* 스크롤 기반 무한 로딩 - 더 보기 버튼 제거 */}

        {!hasNextPage && infiniteScroll.totalCount > 0 && (
          <p className='text-sm text-gray-500'>모든 상품을 불러왔습니다.</p>
        )}

        {/* Intersection Observer를 위한 감지 영역 - 테이블 하단에 위치 */}
        {hasNextPage && (
          <div
            id='infinite-scroll-trigger'
            className='flex h-20 w-full items-center justify-center text-sm text-gray-400'>
            스크롤하여 더 많은 상품 보기...
          </div>
        )}
      </div>

      {/* 스크롤 위로 가기 버튼 - 디버깅용으로 항상 표시 */}
      <button
        onClick={scrollToTop}
        className='fixed right-8 bottom-8 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-all duration-300 hover:scale-110 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none'
        title='맨 위로 가기'>
        <HiArrowUp className='h-5 w-5' />
      </button>
    </div>
  );
};

export default InventoryTable;
