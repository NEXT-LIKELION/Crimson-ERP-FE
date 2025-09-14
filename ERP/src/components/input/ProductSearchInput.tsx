import React, { useState, useEffect, useRef } from 'react';
import { FiSearch, FiLoader } from 'react-icons/fi';
import { useProductSearch } from '../../hooks/queries/useProductSearch';
import { ProductOption } from '../../types/product';

interface ProductSearchInputProps {
  placeholder?: string;
  value?: string;
  onSelect: (product: ProductOption) => void;
  disabled?: boolean;
}

const ProductSearchInput: React.FC<ProductSearchInputProps> = ({
  placeholder = '상품 검색... (Enter키로 검색)',
  value = '',
  onSelect,
  disabled = false
}) => {
  const [query, setQuery] = useState(value);
  const [searchQuery, setSearchQuery] = useState(''); // 실제 검색에 사용되는 쿼리
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // useProductSearch 훅 사용
  const {
    data: searchResults,
    isLoading: isSearching,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage
  } = useProductSearch({
    product_name: searchQuery || undefined // 빈 문자열이면 undefined로 전체 검색
  });

  // 검색 결과가 있으면 드롭다운 열기
  useEffect(() => {
    if (searchResults && searchResults.length > 0 && !disabled) {
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
          // 드롭다운이 열려있고 항목이 선택된 경우 - 선택된 항목 선택
          handleSelect(searchResults[selectedIndex]);
        } else {
          // 검색 실행
          handleSearch();
        }
        break;

      case 'ArrowDown':
        if (isDropdownOpen && searchResults.length > 0) {
          e.preventDefault();
          setSelectedIndex(prev =>
            prev < searchResults.length - 1 ? prev + 1 : 0
          );
        }
        break;

      case 'ArrowUp':
        if (isDropdownOpen && searchResults.length > 0) {
          e.preventDefault();
          setSelectedIndex(prev =>
            prev > 0 ? prev - 1 : searchResults.length - 1
          );
        }
        break;

      case 'Escape':
        setIsDropdownOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // 검색 실행 함수
  const handleSearch = () => {
    setSearchQuery(query.trim());
    setSelectedIndex(-1);
  };

  const handleSelect = (product: ProductOption) => {
    setQuery(product.name);
    setIsDropdownOpen(false);
    setSelectedIndex(-1);
    onSelect(product);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleInputFocus = () => {
    // 포커스할 때 검색 결과가 있으면 드롭다운 열기
    if (searchResults.length > 0) {
      setIsDropdownOpen(true);
    }
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {isSearching ? (
            <FiLoader className="h-4 w-4 text-gray-400 animate-spin" />
          ) : (
            <FiSearch className="h-4 w-4 text-gray-400" />
          )}
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
      </div>

      {/* 검색 결과 드롭다운 */}
      {isDropdownOpen && (
        <div
          ref={dropdownRef}
          className="absolute z-[9999] w-full mt-1 bg-white border border-gray-300 rounded-md shadow-xl max-h-60 overflow-y-auto"
          style={{ zIndex: 9999 }}
          onScroll={(e) => {
            const target = e.target as HTMLDivElement;
            const isAtBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 10;
            if (isAtBottom && hasNextPage && !isFetchingNextPage) {
              fetchNextPage();
            }
          }}>

          {searchResults.length === 0 && !isSearching ? (
            <div className="px-3 py-2 text-sm text-gray-500">
              {searchQuery ? '검색 결과가 없습니다' : 'Enter키를 눌러 검색하세요'}
            </div>
          ) : (
            <>
              {searchResults.map((product, index) => (
                <button
                  key={product.variant_code || product.product_id}
                  onClick={() => handleSelect(product)}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${
                    index === selectedIndex ? 'bg-blue-50 text-blue-900' : 'text-gray-900'
                  }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{product.name}</div>
                      <div className="text-xs text-gray-500">
                        ID: {product.product_id}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
              {isFetchingNextPage && (
                <div className="px-3 py-2 text-center text-sm text-gray-500">
                  <FiLoader className="inline animate-spin mr-2" />
                  더 불러오는 중...
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductSearchInput;