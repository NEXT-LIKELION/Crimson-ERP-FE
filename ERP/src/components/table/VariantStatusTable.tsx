import { useState, useRef, useEffect } from 'react';
import { ProductVariantStatus } from '../../types/product';
import { updateVariantStatus } from '../../api/inventory';
import { useQueryClient } from '@tanstack/react-query';
import { useColumnVisibility } from '../../hooks/useColumnVisibility';
import ColumnSettingsModal from '../common/ColumnSettingsModal';
import type { TableColumn } from '../../types/tableColumns';

interface VariantStatusTableProps {
  data: ProductVariantStatus[];
  isLoading?: boolean;
  year: number;
  month: number;
  onRowClick?: (variantCode: string) => void;
  onStockAdjust?: (item: ProductVariantStatus) => void;
}

type EditableField =
  | 'warehouse_stock_start'
  | 'store_stock_start'
  | 'inbound_quantity'
  | 'store_sales'
  | 'online_sales';

interface EditingCell {
  rowIndex: number;
  field: EditableField;
}

interface AdjustmentStatusItem {
  created_by?: string;
  quantity?: number;
  [key: string]: unknown;
}

// 컬럼 정의
const VARIANT_STATUS_COLUMNS: TableColumn[] = [
  { id: 'big_category', label: '대분류', defaultVisible: false },
  { id: 'middle_category', label: '중분류', defaultVisible: false },
  { id: 'category', label: '카테고리', defaultVisible: false },
  { id: 'description', label: '설명', defaultVisible: false },
  { id: 'online_name', label: '온라인 품목명', defaultVisible: false },
  { id: 'offline_name', label: '오프라인 품목명', defaultVisible: true },
  { id: 'option', label: '옵션', defaultVisible: false },
  { id: 'detail_option', label: '상세옵션', defaultVisible: false },
  { id: 'product_code', label: '상품코드', defaultVisible: false },
  { id: 'variant_code', label: '품목코드', required: true },
  { id: 'warehouse_stock_start', label: '월초창고재고', defaultVisible: false },
  { id: 'store_stock_start', label: '월초매장재고', defaultVisible: false },
  { id: 'initial_stock', label: '기초재고', defaultVisible: true },
  { id: 'inbound_quantity', label: '당월입고', defaultVisible: true },
  { id: 'store_sales', label: '매장판매', defaultVisible: true },
  { id: 'online_sales', label: '온라인판매', defaultVisible: true },
  { id: 'total_sales', label: '판매합계', defaultVisible: true },
  { id: 'adjustment_quantity', label: '재고조정수량', defaultVisible: false },
  { id: 'adjustment_status', label: '재고조정상태', defaultVisible: false },
  { id: 'ending_stock', label: '기말재고', defaultVisible: true },
];

const VariantStatusTable: React.FC<VariantStatusTableProps> = ({
  data,
  isLoading,
  year,
  month,
  onRowClick,
  onStockAdjust,
}) => {
  const queryClient = useQueryClient();
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [savingCell, setSavingCell] = useState<EditingCell | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 컬럼 표시/숨김 관리
  const { columnVisibility, toggleColumn, showAllColumns, resetToDefault, isColumnVisible } =
    useColumnVisibility({
      columns: VARIANT_STATUS_COLUMNS,
      tableType: 'variantStatus',
    });

  // 편집 모드 진입 시 input에 포커스
  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCell]);

  // 셀 더블클릭으로 편집 모드 진입
  const handleCellDoubleClick = (
    rowIndex: number,
    field: EditableField,
    currentValue: number | undefined
  ) => {
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

      // 성공 시 관련된 모든 캐시 무효화하여 최신 데이터 가져오기
      queryClient.invalidateQueries({ queryKey: ['variantStatus', year, month] });
      queryClient.invalidateQueries({ queryKey: ['inventories'] });
      queryClient.invalidateQueries({ queryKey: ['variantDetail'] });
    } catch (error: unknown) {
      console.error('수정 실패:', error);
      const errorMessage =
        error && typeof error === 'object' && 'response' in error
          ? (error as { response?: { data?: { detail?: string } } }).response?.data?.detail ||
            '수정 중 오류가 발생했습니다.'
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
    className: string = '',
    style: React.CSSProperties = {}
  ) => {
    const isEditing = editingCell?.rowIndex === rowIndex && editingCell?.field === field;
    const isSaving = savingCell?.rowIndex === rowIndex && savingCell?.field === field;
    const displayValue = value?.toLocaleString() || 0;

    if (isEditing) {
      return (
        <td className={className} style={style}>
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
            className='w-full rounded border border-blue-500 px-2 py-1 text-right text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none'
            min='0'
            step='1'
          />
        </td>
      );
    }

    return (
      <td
        className={`${className} whitespace-nowrap ${isSaving ? 'opacity-50' : 'cursor-pointer hover:bg-blue-50'} transition-colors`}
        onDoubleClick={() => handleCellDoubleClick(rowIndex, field, value)}
        title='더블클릭하여 수정'
        style={style}>
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
    <div className='w-full overflow-x-auto'>
      {/* 헤더 */}
      <div className='mb-4 flex items-center justify-end'>
        <ColumnSettingsModal
          columns={VARIANT_STATUS_COLUMNS}
          columnVisibility={columnVisibility}
          onToggleColumn={toggleColumn}
          onShowAll={showAllColumns}
          onReset={resetToDefault}
        />
      </div>
      {/* 테이블 */}
      <div className='rounded-lg border border-gray-200'>
        <table className='w-full table-auto border-collapse text-xs text-gray-700'>
          <thead className='bg-gray-50'>
            <tr>
              {isColumnVisible('big_category') && (
                <th
                  className='px-1 py-1 text-left text-xs font-medium whitespace-nowrap text-gray-500 uppercase'
                  style={{ width: '4%', minWidth: '60px' }}>
                  대분류
                </th>
              )}
              {isColumnVisible('middle_category') && (
                <th
                  className='px-1 py-1 text-left text-xs font-medium whitespace-nowrap text-gray-500 uppercase'
                  style={{ width: '4%', minWidth: '60px' }}>
                  중분류
                </th>
              )}
              {isColumnVisible('category') && (
                <th
                  className='px-1 py-1 text-left text-xs font-medium whitespace-nowrap text-gray-500 uppercase'
                  style={{ width: '5%', minWidth: '80px' }}>
                  카테고리
                </th>
              )}
              {isColumnVisible('description') && (
                <th
                  className='px-1 py-1 text-left text-xs font-medium whitespace-nowrap text-gray-500 uppercase'
                  style={{ width: '8%', minWidth: '120px' }}>
                  설명
                </th>
              )}
              {isColumnVisible('online_name') && (
                <th
                  className='px-1 py-1 text-left text-xs font-medium whitespace-nowrap text-gray-500 uppercase'
                  style={{ width: '12%', minWidth: '180px' }}>
                  온라인 품목명
                </th>
              )}
              {isColumnVisible('offline_name') && (
                <th
                  className='px-1 py-1 text-left text-xs font-medium whitespace-nowrap text-gray-500 uppercase'
                  style={{ width: '12%', minWidth: '180px' }}>
                  오프라인 품목명
                </th>
              )}
              {isColumnVisible('option') && (
                <th
                  className='px-1 py-1 text-left text-xs font-medium whitespace-nowrap text-gray-500 uppercase'
                  style={{ width: '4%', minWidth: '60px' }}>
                  옵션
                </th>
              )}
              {isColumnVisible('detail_option') && (
                <th
                  className='px-1 py-1 text-left text-xs font-medium whitespace-nowrap text-gray-500 uppercase'
                  style={{ width: '5%', minWidth: '80px' }}>
                  상세옵션
                </th>
              )}
              {isColumnVisible('product_code') && (
                <th
                  className='px-1 py-1 text-left text-xs font-medium whitespace-nowrap text-gray-500 uppercase'
                  style={{ width: '6%', minWidth: '100px' }}>
                  상품코드
                </th>
              )}
              {isColumnVisible('variant_code') && (
                <th
                  className='px-1 py-1 text-left text-xs font-medium whitespace-nowrap text-gray-500 uppercase'
                  style={{ width: '6%', minWidth: '100px' }}>
                  품목코드
                </th>
              )}
              {isColumnVisible('warehouse_stock_start') && (
                <th
                  className='px-1 py-1 text-right text-xs font-medium whitespace-nowrap text-gray-500 uppercase'
                  style={{ width: '5%', minWidth: '80px' }}>
                  월초창고재고
                </th>
              )}
              {isColumnVisible('store_stock_start') && (
                <th
                  className='px-1 py-1 text-right text-xs font-medium whitespace-nowrap text-gray-500 uppercase'
                  style={{ width: '5%', minWidth: '80px' }}>
                  월초매장재고
                </th>
              )}
              {isColumnVisible('initial_stock') && (
                <th
                  className='px-1 py-1 text-right text-xs font-medium whitespace-nowrap text-gray-500 uppercase'
                  style={{ width: '5%', minWidth: '80px' }}>
                  기초재고
                </th>
              )}
              {isColumnVisible('inbound_quantity') && (
                <th
                  className='px-1 py-1 text-right text-xs font-medium whitespace-nowrap text-gray-500 uppercase'
                  style={{ width: '5%', minWidth: '80px' }}>
                  당월입고
                </th>
              )}
              {isColumnVisible('store_sales') && (
                <th
                  className='px-1 py-1 text-right text-xs font-medium whitespace-nowrap text-gray-500 uppercase'
                  style={{ width: '5%', minWidth: '80px' }}>
                  매장판매
                </th>
              )}
              {isColumnVisible('online_sales') && (
                <th
                  className='px-1 py-1 text-right text-xs font-medium whitespace-nowrap text-gray-500 uppercase'
                  style={{ width: '5%', minWidth: '80px' }}>
                  온라인판매
                </th>
              )}
              {isColumnVisible('total_sales') && (
                <th
                  className='px-1 py-1 text-right text-xs font-medium whitespace-nowrap text-gray-500 uppercase'
                  style={{ width: '5%', minWidth: '80px' }}>
                  판매합계
                </th>
              )}
              {isColumnVisible('adjustment_quantity') && (
                <th
                  className='px-1 py-1 text-right text-xs font-medium whitespace-nowrap text-gray-500 uppercase'
                  style={{ width: '5%', minWidth: '80px' }}>
                  재고조정수량
                </th>
              )}
              {isColumnVisible('adjustment_status') && (
                <th
                  className='px-1 py-1 text-left text-xs font-medium text-gray-500 uppercase'
                  style={{ width: '8%', minWidth: '120px' }}>
                  재고조정상태
                </th>
              )}
              {isColumnVisible('ending_stock') && (
                <th
                  className='px-1 py-1 text-right text-xs font-medium whitespace-nowrap text-gray-500 uppercase'
                  style={{ width: '5%', minWidth: '80px' }}>
                  기말재고
                </th>
              )}
            </tr>
          </thead>
          <tbody className='divide-y divide-gray-200 bg-white'>
            {data.map((item, index) => (
              <tr key={`${item.variant_code}-${index}`} className='hover:bg-gray-50'>
                {isColumnVisible('big_category') && (
                  <td
                    className='cursor-pointer px-1 py-2 text-xs whitespace-nowrap text-gray-900 hover:bg-blue-50 sm:px-2'
                    onClick={() => onRowClick?.(item.variant_code || '')}
                    title='클릭하여 상품 상세보기'
                    style={{ width: '4%', minWidth: '60px' }}>
                    {item.big_category}
                  </td>
                )}
                {isColumnVisible('middle_category') && (
                  <td
                    className='cursor-pointer px-1 py-2 text-xs whitespace-nowrap text-gray-900 hover:bg-blue-50 sm:px-2'
                    onClick={() => onRowClick?.(item.variant_code || '')}
                    title='클릭하여 상품 상세보기'
                    style={{ width: '4%', minWidth: '60px' }}>
                    {item.middle_category}
                  </td>
                )}
                {isColumnVisible('category') && (
                  <td
                    className='cursor-pointer px-1 py-2 text-xs whitespace-nowrap text-gray-900 hover:bg-blue-50 sm:px-2'
                    onClick={() => onRowClick?.(item.variant_code || '')}
                    title='클릭하여 상품 상세보기'
                    style={{ width: '5%', minWidth: '80px' }}>
                    {item.category}
                  </td>
                )}
                {isColumnVisible('description') && (
                  <td
                    className='cursor-pointer px-1 py-2 text-xs whitespace-nowrap text-gray-900 hover:bg-blue-50 sm:px-2'
                    onClick={() => onRowClick?.(item.variant_code || '')}
                    title={`${item.description} - 클릭하여 상품 상세보기`}
                    style={{ width: '8%', minWidth: '120px' }}>
                    {item.description}
                  </td>
                )}
                {isColumnVisible('online_name') && (
                  <td
                    className='cursor-pointer px-1 py-2 text-xs whitespace-nowrap text-gray-900 hover:bg-blue-50 sm:px-2'
                    onClick={() => onRowClick?.(item.variant_code || '')}
                    title={`${item.online_name} - 클릭하여 상품 상세보기`}
                    style={{ width: '12%', minWidth: '180px' }}>
                    {item.online_name}
                  </td>
                )}
                {isColumnVisible('offline_name') && (
                  <td
                    className='cursor-pointer px-1 py-2 text-xs whitespace-nowrap text-gray-900 hover:bg-blue-50 sm:px-2'
                    onClick={() => onRowClick?.(item.variant_code || '')}
                    title={`${item.offline_name} - 클릭하여 상품 상세보기`}
                    style={{ width: '12%', minWidth: '180px' }}>
                    {item.offline_name}
                  </td>
                )}
                {isColumnVisible('option') && (
                  <td
                    className='cursor-pointer px-1 py-2 text-xs whitespace-nowrap text-gray-900 hover:bg-blue-50 sm:px-2'
                    onClick={() => onRowClick?.(item.variant_code || '')}
                    title='클릭하여 상품 상세보기'
                    style={{ width: '4%', minWidth: '60px' }}>
                    {item.option}
                  </td>
                )}
                {isColumnVisible('detail_option') && (
                  <td
                    className='cursor-pointer px-1 py-2 text-xs whitespace-nowrap text-gray-900 hover:bg-blue-50 sm:px-2'
                    onClick={() => onRowClick?.(item.variant_code || '')}
                    title='클릭하여 상품 상세보기'
                    style={{ width: '5%', minWidth: '80px' }}>
                    {item.detail_option}
                  </td>
                )}
                {isColumnVisible('product_code') && (
                  <td
                    className='cursor-pointer px-1 py-2 text-xs font-medium whitespace-nowrap text-blue-600 hover:bg-blue-100 hover:text-blue-800 sm:px-2'
                    onClick={() => onRowClick?.(item.variant_code || '')}
                    title='클릭하여 상품 상세보기'
                    style={{ width: '6%', minWidth: '100px' }}>
                    {item.product_code}
                  </td>
                )}
                {isColumnVisible('variant_code') && (
                  <td
                    className='cursor-pointer px-1 py-2 text-xs font-medium whitespace-nowrap text-indigo-600 hover:bg-indigo-100 hover:text-indigo-800 sm:px-2'
                    onClick={() => onRowClick?.(item.variant_code || '')}
                    title='클릭하여 상품 상세보기'
                    style={{ width: '6%', minWidth: '100px' }}>
                    {item.variant_code}
                  </td>
                )}
                {isColumnVisible('warehouse_stock_start') &&
                  renderEditableCell(
                    index,
                    'warehouse_stock_start',
                    item.warehouse_stock_start,
                    item.variant_code || '',
                    'px-1 sm:px-2 py-2 text-right text-xs text-gray-900',
                    { width: '5%', minWidth: '80px' }
                  )}
                {isColumnVisible('store_stock_start') &&
                  renderEditableCell(
                    index,
                    'store_stock_start',
                    item.store_stock_start,
                    item.variant_code || '',
                    'px-1 sm:px-2 py-2 text-right text-xs text-gray-900',
                    { width: '5%', minWidth: '80px' }
                  )}
                {isColumnVisible('initial_stock') && (
                  <td
                    className='px-1 py-2 text-right text-xs whitespace-nowrap text-gray-900 sm:px-2'
                    style={{ width: '5%', minWidth: '80px' }}>
                    {item.initial_stock ? Number(item.initial_stock).toLocaleString() : 0}
                  </td>
                )}
                {isColumnVisible('inbound_quantity') &&
                  renderEditableCell(
                    index,
                    'inbound_quantity',
                    item.inbound_quantity,
                    item.variant_code || '',
                    'px-1 sm:px-2 py-2 text-right text-xs text-gray-900',
                    { width: '5%', minWidth: '80px' }
                  )}
                {isColumnVisible('store_sales') &&
                  renderEditableCell(
                    index,
                    'store_sales',
                    item.store_sales,
                    item.variant_code || '',
                    'px-1 sm:px-2 py-2 text-right text-xs text-gray-900',
                    { width: '5%', minWidth: '80px' }
                  )}
                {isColumnVisible('online_sales') &&
                  renderEditableCell(
                    index,
                    'online_sales',
                    item.online_sales,
                    item.variant_code || '',
                    'px-1 sm:px-2 py-2 text-right text-xs text-gray-900',
                    { width: '5%', minWidth: '80px' }
                  )}
                {isColumnVisible('total_sales') && (
                  <td
                    className='px-1 py-2 text-right text-xs font-medium whitespace-nowrap text-gray-900 sm:px-2'
                    style={{ width: '5%', minWidth: '80px' }}>
                    {item.total_sales?.toLocaleString() || 0}
                  </td>
                )}
                {isColumnVisible('adjustment_quantity') && (
                  <td
                    className='cursor-pointer px-1 py-2 text-right text-xs whitespace-nowrap text-gray-900 transition-colors hover:bg-blue-50 sm:px-2'
                    style={{ width: '5%', minWidth: '80px' }}
                    onClick={() => onStockAdjust?.(item)}
                    title='클릭하여 재고 조정'>
                    {item.adjustment_quantity ? Number(item.adjustment_quantity).toLocaleString() : 0}
                  </td>
                )}
                {isColumnVisible('adjustment_status') && (
                  <td
                    className='cursor-pointer px-1 py-2 text-xs text-gray-900 transition-colors hover:bg-blue-50 sm:px-2'
                    style={{ width: '8%' }}
                    onClick={() => onStockAdjust?.(item)}
                    title='클릭하여 재고 조정'>
                    <div className='whitespace-pre-line'>
                      {(() => {
                        const adjustmentStatus = item.adjustment_status;
                        if (typeof adjustmentStatus === 'string') {
                          // 쉼표로 구분된 문자열인 경우 줄바꿈 처리
                          return adjustmentStatus.split(',').join('\n');
                        }
                        if (adjustmentStatus) {
                          try {
                            // JSON 문자열인 경우 파싱 시도
                            let parsed: unknown;
                            if (typeof adjustmentStatus === 'string') {
                              parsed = JSON.parse(adjustmentStatus);
                            } else {
                              parsed = adjustmentStatus;
                            }

                            const statusArray = Array.isArray(parsed) ? parsed : [parsed];
                            return statusArray
                              .map((status: unknown) => {
                                if (typeof status === 'object' && status) {
                                  const statusItem = status as AdjustmentStatusItem;
                                  const createdBy = statusItem.created_by || '';
                                  const quantity = statusItem.quantity || 0;
                                  return `${createdBy}: ${quantity > 0 ? '+' : ''}${quantity}`;
                                }
                                return String(status);
                              })
                              .join('\n');
                          } catch {
                            return String(adjustmentStatus);
                          }
                        }
                        return '-';
                      })()}
                    </div>
                  </td>
                )}
                {isColumnVisible('ending_stock') && (
                  <td
                    className='px-1 py-2 text-right text-xs font-medium whitespace-nowrap text-green-600 sm:px-2'
                    style={{ width: '5%', minWidth: '80px' }}>
                    {item.ending_stock?.toLocaleString() || 0}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default VariantStatusTable;
