import { useState, useRef, useEffect } from 'react';
import { ProductVariantStatus } from '../../types/product';
import { updateVariantStatus } from '../../api/inventory';
import { useQueryClient } from '@tanstack/react-query';

interface VariantStatusTableProps {
  data: ProductVariantStatus[];
  isLoading?: boolean;
  year: number;
  month: number;
  onRowClick?: (variantCode: string) => void;
}

type EditableField = 'warehouse_stock_start' | 'store_stock_start' | 'inbound_quantity' | 'store_sales' | 'online_sales';

interface EditingCell {
  rowIndex: number;
  field: EditableField;
}

const VariantStatusTable: React.FC<VariantStatusTableProps> = ({ data, isLoading, year, month, onRowClick }) => {
  const queryClient = useQueryClient();
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [savingCell, setSavingCell] = useState<EditingCell | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 편집 모드 진입 시 input에 포커스
  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCell]);

  // 셀 더블클릭으로 편집 모드 진입
  const handleCellDoubleClick = (rowIndex: number, field: EditableField, currentValue: number | undefined) => {
    setEditingCell({ rowIndex, field });
    setEditValue(currentValue?.toString() || '0');
  };

  // 편집 취소
  const handleCancelEdit = () => {
    setEditingCell(null);
    setEditValue('');
  };

  // 값 저장
  const handleSaveEdit = async (rowIndex: number, field: EditableField, variantCode: string) => {
    if (!variantCode) {
      alert('상품 코드가 없어 수정할 수 없습니다.');
      return;
    }

    const numericValue = parseInt(editValue);
    if (isNaN(numericValue) || numericValue < 0) {
      alert('0 이상의 숫자만 입력 가능합니다.');
      setEditingCell({ rowIndex, field });
      setEditValue(editValue);
      return;
    }

    setSavingCell({ rowIndex, field });
    setEditingCell(null);

    try {
      const updateData: Record<string, number> = {};
      updateData[field] = numericValue;

      await updateVariantStatus(year, month, variantCode, updateData);

      // 성공 시 캐시 무효화하여 최신 데이터 가져오기
      queryClient.invalidateQueries({ queryKey: ['variantStatus', year, month] });
    } catch (error: unknown) {
      console.error('수정 실패:', error);
      const errorMessage =
        error && typeof error === 'object' && 'response' in error
          ? (error as { response?: { data?: { detail?: string } } }).response?.data?.detail || '수정 중 오류가 발생했습니다.'
          : '수정 중 오류가 발생했습니다.';
      alert(errorMessage);
      // 실패 시 편집 모드로 다시 진입
      setEditingCell({ rowIndex, field });
      setEditValue(numericValue.toString());
    } finally {
      setSavingCell(null);
    }
  };

  // Enter 키로 저장, ESC 키로 취소
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    rowIndex: number,
    field: EditableField,
    variantCode: string
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveEdit(rowIndex, field, variantCode);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelEdit();
    }
  };

  // 편집 가능한 셀 렌더링
  const renderEditableCell = (
    rowIndex: number,
    field: EditableField,
    value: number | undefined,
    variantCode: string,
    className: string = ''
  ) => {
    const isEditing = editingCell?.rowIndex === rowIndex && editingCell?.field === field;
    const isSaving = savingCell?.rowIndex === rowIndex && savingCell?.field === field;
    const displayValue = value?.toLocaleString() || 0;

    if (isEditing) {
      return (
        <td className={className}>
            <input
              ref={inputRef}
              type='number'
              value={editValue}
              onChange={(e) => {
                const value = e.target.value;
                // 음수 입력 방지
                if (value === '' || (!isNaN(Number(value)) && Number(value) >= 0)) {
                  setEditValue(value);
                }
              }}
              onBlur={() => handleSaveEdit(rowIndex, field, variantCode)}
              onKeyDown={(e) => handleKeyDown(e, rowIndex, field, variantCode)}
              className='w-full rounded border border-blue-500 px-2 py-1 text-right text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
              min='0'
              step='1'
            />
        </td>
      );
    }

    return (
      <td
        className={`${className} ${isSaving ? 'opacity-50' : 'cursor-pointer hover:bg-blue-50'} transition-colors`}
        onDoubleClick={() => handleCellDoubleClick(rowIndex, field, value)}
        title='더블클릭하여 수정'>
        {isSaving ? '저장 중...' : displayValue}
      </td>
    );
  };
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
              <th className='px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'>
                대분류
              </th>
              <th className='px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'>
                중분류
              </th>
              <th className='px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'>
                카테고리
              </th>
              <th className='px-2 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase w-32'>
                설명
              </th>
              <th className='px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'>
                온라인 품목명
              </th>
              <th className='px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'>
                오프라인 품목명
              </th>
              <th className='px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'>
                옵션
              </th>
              <th className='px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'>
                상세옵션
              </th>
              <th className='px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'>
                상품코드
              </th>
              <th className='px-4 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase'>
                월초창고재고
              </th>
              <th className='px-4 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase'>
                월초매장재고
              </th>
              <th className='px-4 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase'>
                기초재고
              </th>
              <th className='px-4 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase'>
                당월입고
              </th>
              <th className='px-4 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase'>
                매장판매
              </th>
              <th className='px-4 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase'>
                쇼핑몰판매
              </th>
              <th className='px-4 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase'>
                판매합계
              </th>
              <th className='px-4 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase'>
                재고조정
              </th>
              <th className='px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'>
                재고조정사유
              </th>
              <th className='px-4 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase'>
                기말재고
              </th>
            </tr>
          </thead>
          <tbody className='divide-y divide-gray-200 bg-white'>
            {data.map((item, index) => (
              <tr key={`${item.variant_code}-${index}`} className='hover:bg-gray-50'>
                <td
                  className='px-4 py-3 text-sm whitespace-nowrap text-gray-900 cursor-pointer hover:bg-blue-50'
                  onClick={() => onRowClick?.(item.variant_code || '')}
                  title='클릭하여 상품 상세보기'
                >
                  {item.big_category}
                </td>
                <td
                  className='px-4 py-3 text-sm whitespace-nowrap text-gray-900 cursor-pointer hover:bg-blue-50'
                  onClick={() => onRowClick?.(item.variant_code || '')}
                  title='클릭하여 상품 상세보기'
                >
                  {item.middle_category}
                </td>
                <td
                  className='px-4 py-3 text-sm whitespace-nowrap text-gray-900 cursor-pointer hover:bg-blue-50'
                  onClick={() => onRowClick?.(item.variant_code || '')}
                  title='클릭하여 상품 상세보기'
                >
                  {item.category}
                </td>
                <td
                  className='px-2 py-3 text-sm text-gray-900 cursor-pointer hover:bg-blue-50 max-w-32 truncate'
                  onClick={() => onRowClick?.(item.variant_code || '')}
                  title={`클릭하여 상품 상세보기 - ${item.description}`}
                >
                  {item.description}
                </td>
                <td
                  className='px-4 py-3 text-sm text-gray-900 cursor-pointer hover:bg-blue-50'
                  onClick={() => onRowClick?.(item.variant_code || '')}
                  title='클릭하여 상품 상세보기'
                >
                  {item.online_name}
                </td>
                <td
                  className='px-4 py-3 text-sm text-gray-900 cursor-pointer hover:bg-blue-50'
                  onClick={() => onRowClick?.(item.variant_code || '')}
                  title='클릭하여 상품 상세보기'
                >
                  {item.offline_name}
                </td>
                <td
                  className='px-4 py-3 text-sm whitespace-nowrap text-gray-900 cursor-pointer hover:bg-blue-50'
                  onClick={() => onRowClick?.(item.variant_code || '')}
                  title='클릭하여 상품 상세보기'
                >
                  {item.option}
                </td>
                <td
                  className='px-4 py-3 text-sm whitespace-nowrap text-gray-900 cursor-pointer hover:bg-blue-50'
                  onClick={() => onRowClick?.(item.variant_code || '')}
                  title='클릭하여 상품 상세보기'
                >
                  {item.detail_option}
                </td>
                <td
                  className='px-4 py-3 text-sm font-medium whitespace-nowrap text-blue-600 cursor-pointer hover:bg-blue-100 hover:text-blue-800'
                  onClick={() => onRowClick?.(item.variant_code || '')}
                  title='클릭하여 상품 상세보기'
                >
                  {item.product_code}
                </td>
                {renderEditableCell(
                  index,
                  'warehouse_stock_start',
                  item.warehouse_stock_start,
                  item.variant_code || '',
                  'px-4 py-3 text-right text-sm whitespace-nowrap text-gray-900'
                )}
                {renderEditableCell(
                  index,
                  'store_stock_start',
                  item.store_stock_start,
                  item.variant_code || '',
                  'px-4 py-3 text-right text-sm whitespace-nowrap text-gray-900'
                )}
                <td className='px-4 py-3 text-right text-sm font-medium whitespace-nowrap text-gray-900'>
                  {item.initial_stock?.toLocaleString() || 0}
                </td>
                {renderEditableCell(
                  index,
                  'inbound_quantity',
                  item.inbound_quantity,
                  item.variant_code || '',
                  'px-4 py-3 text-right text-sm whitespace-nowrap text-gray-900'
                )}
                {renderEditableCell(
                  index,
                  'store_sales',
                  item.store_sales,
                  item.variant_code || '',
                  'px-4 py-3 text-right text-sm whitespace-nowrap text-gray-900'
                )}
                {renderEditableCell(
                  index,
                  'online_sales',
                  item.online_sales,
                  item.variant_code || '',
                  'px-4 py-3 text-right text-sm whitespace-nowrap text-gray-900'
                )}
                <td className='px-4 py-3 text-right text-sm font-medium whitespace-nowrap text-gray-900'>
                  {item.total_sales?.toLocaleString() || 0}
                </td>
                <td className='px-4 py-3 text-right text-sm whitespace-nowrap text-gray-900'>
                  {item.adjustment_total ? Number(item.adjustment_total).toLocaleString() : 0}
                </td>
                <td className='px-4 py-3 text-sm text-gray-900'>{item.stock_adjustment_reason || '-'}</td>
                <td className='px-4 py-3 text-right text-sm font-medium whitespace-nowrap text-green-600'>
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
