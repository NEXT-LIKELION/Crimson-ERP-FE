import React, { useState, useEffect, useRef } from 'react';
import { FiSearch, FiLoader } from 'react-icons/fi';
import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchInventories } from '../../api/inventory';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import type { components } from '../../types/api';

type ProductVariant = components['schemas']['ProductVariant'];

interface VariantSearchInputProps {
  placeholder?: string;
  value?: string;
  onSelect: (variant: ProductVariant) => void;
  disabled?: boolean;
}

interface ProductSearchPageData {
  results: ProductVariant[];
  count: number;
  next: string | null;
  previous: string | null;
}

const VariantSearchInput: React.FC<VariantSearchInputProps> = ({
  placeholder = 'variant_code 또는 상품명 검색...',
  value = '',
  onSelect,
  disabled = false,
}) => {
  const [query, setQuery] = useState(value);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const isUserInputRef = useRef(true);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // value prop 변경 시 query 동기화
  useEffect(() => {
    isUserInputRef.current = false;
    setQuery(value);
  }, [value]);

  // 디바운스된 검색어
  const debouncedQuery = useDebouncedValue(query.trim(), 300);

  // variant 검색
  const {
    data: queryData,
    isLoading: isSearching,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['variantSearch', debouncedQuery || undefined],
    queryFn: async ({ pageParam = 1 }) => {
      const params: Record<string, unknown> = {
        page: pageParam,
        page_size: 20,
      };
      if (debouncedQuery) {
        params.product_name = debouncedQuery;
      }
      const response = await fetchInventories(params);
      return response.data as ProductSearchPageData;
    },
    getNextPageParam: (lastPage: ProductSearchPageData) => {
      if (lastPage.next) {
        const url = new URL(lastPage.next, window.location.origin);
        const pageParam = url.searchParams.get('page');
        return pageParam ? Number(pageParam) : undefined;
      }
      return undefined;
    },
    initialPageParam: 1,
    enabled: true,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  // 검색 결과 플랫화
  const searchResults = queryData?.pages.flatMap((page) => page.results || []) || [];

  // 검색 결과가 있으면 드롭다운 열기
  useEffect(() => {
    if (searchResults && searchResults.length > 0 && !disabled && isUserInputRef.current) {
      setIsDropdownOpen(true);
    }
  }, [searchResults, disabled]);

  // 외부 클릭으로 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 키보드 이벤트 핸들러
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        if (isDropdownOpen && selectedIndex >= 0 && searchResults[selectedIndex]) {
          handleSelect(searchResults[selectedIndex]);
        }
        break;

      case 'ArrowDown':
        if (isDropdownOpen && searchResults.length > 0) {
          e.preventDefault();
          setSelectedIndex((prev) => (prev < searchResults.length - 1 ? prev + 1 : 0));
        }
        break;

      case 'ArrowUp':
        if (isDropdownOpen && searchResults.length > 0) {
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : searchResults.length - 1));
        }
        break;

      case 'Escape':
        setIsDropdownOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleSelect = (variant: ProductVariant) => {
    const displayName = variant.offline_name || variant.online_name || variant.variant_code || '';
    setQuery(displayName);
    setIsDropdownOpen(false);
    setSelectedIndex(-1);
    onSelect(variant);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    isUserInputRef.current = true;
    setQuery(e.target.value);
  };

  const handleInputFocus = () => {
    if (searchResults.length > 0) {
      setIsDropdownOpen(true);
    }
  };

  return (
    <div className='relative w-full'>
      <div className='relative'>
        <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3'>
          {isSearching ? (
            <FiLoader className='h-4 w-4 animate-spin text-gray-400' />
          ) : (
            <FiSearch className='h-4 w-4 text-gray-400' />
          )}
        </div>

        <input
          ref={inputRef}
          type='text'
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className='w-full rounded-md border border-gray-300 py-2 pr-3 pl-10 text-sm focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100'
        />
      </div>

      {/* 검색 결과 드롭다운 */}
      {isDropdownOpen && (
        <div
          ref={dropdownRef}
          className='absolute z-[9999] mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-gray-300 bg-white shadow-xl'
          style={{ zIndex: 9999 }}
          onScroll={(e) => {
            const target = e.target as HTMLDivElement;
            const isAtBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 10;
            if (isAtBottom && hasNextPage && !isFetchingNextPage) {
              fetchNextPage();
            }
          }}>
          {searchResults.length === 0 && !isSearching ? (
            <div className='px-3 py-2 text-sm text-gray-500'>
              {debouncedQuery ? '검색 결과가 없습니다' : 'variant_code 또는 상품명을 입력하세요'}
            </div>
          ) : (
            <>
              {searchResults.map((variant, index) => {
                const displayName = variant.offline_name || variant.online_name || '';
                return (
                  <button
                    key={variant.variant_code}
                    onClick={() => handleSelect(variant)}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 ${
                      index === selectedIndex ? 'bg-blue-50 text-blue-900' : 'text-gray-900'
                    }`}>
                    <div className='flex items-center justify-between'>
                      <div>
                        <div className='font-medium'>{displayName || variant.variant_code}</div>
                        <div className='text-xs text-gray-500'>
                          {variant.variant_code} {variant.option ? `- ${variant.option}` : ''}
                          {variant.detail_option ? ` (${variant.detail_option})` : ''}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
              {isFetchingNextPage && (
                <div className='px-3 py-2 text-center text-sm text-gray-500'>
                  <FiLoader className='mr-2 inline animate-spin' />더 불러오는 중...
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default VariantSearchInput;
