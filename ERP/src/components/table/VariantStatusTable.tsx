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

      // 성공 시 관련된 모든 캐시 무효화하여 최신 데이터 가져오기
      queryClient.invalidateQueries({ queryKey: ['variantStatus', year, month] });
      queryClient.invalidateQueries({ queryKey: ['inventories'] });
      queryClient.invalidateQueries({ queryKey: ['variantDetail'] });
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
              className='w-full rounded border border-blue-500 px-2 py-1 text-right text-xs focus:outline-none focus:ring-1 focus:ring-blue-500'
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
    <div className='w-full max-w-full'>
      {/* 테이블 */}
      <div className='w-full max-w-full overflow-x-auto border border-gray-200 rounded-lg'>
        <table className='w-full border-collapse text-xs text-gray-700 table-fixed'>
          <thead className='bg-gray-50'>
            <tr>
              <th className='px-1 py-1 text-left text-xs font-medium text-gray-500 uppercase' style={{ width: '4%' }}>
                대분류
              </th>
              <th className='px-1 py-1 text-left text-xs font-medium text-gray-500 uppercase' style={{ width: '4%' }}>
                중분류
              </th>
              <th className='px-1 py-1 text-left text-xs font-medium text-gray-500 uppercase' style={{ width: '5%' }}>
                카테고리
              </th>
              <th className='px-1 py-1 text-left text-xs font-medium text-gray-500 uppercase' style={{ width: '8%' }}>
                설명
              </th>
              <th className='px-1 py-1 text-left text-xs font-medium text-gray-500 uppercase' style={{ width: '12%' }}>
                온라인 품목명
              </th>
              <th className='px-1 py-1 text-left text-xs font-medium text-gray-500 uppercase' style={{ width: '12%' }}>
                오프라인 품목명
              </th>
              <th className='px-1 py-1 text-left text-xs font-medium text-gray-500 uppercase' style={{ width: '4%' }}>
                옵션
              </th>
              <th className='px-1 py-1 text-left text-xs font-medium text-gray-500 uppercase' style={{ width: '5%' }}>
                상세옵션
              </th>
              <th className='px-1 py-1 text-left text-xs font-medium text-gray-500 uppercase' style={{ width: '6%' }}>
                상품코드
              </th>
              <th className='px-1 py-1 text-right text-xs font-medium text-gray-500 uppercase' style={{ width: '5%' }}>
                월초창고재고
              </th>
              <th className='px-1 py-1 text-right text-xs font-medium text-gray-500 uppercase' style={{ width: '5%' }}>
                월초매장재고
              </th>
              <th className='px-1 py-1 text-right text-xs font-medium text-gray-500 uppercase' style={{ width: '5%' }}>
                기초재고
              </th>
              <th className='px-1 py-1 text-right text-xs font-medium text-gray-500 uppercase' style={{ width: '5%' }}>
                당월입고
              </th>
              <th className='px-1 py-1 text-right text-xs font-medium text-gray-500 uppercase' style={{ width: '5%' }}>
                매장판매
              </th>
              <th className='px-1 py-1 text-right text-xs font-medium text-gray-500 uppercase' style={{ width: '5%' }}>
                온라인판매
              </th>
              <th className='px-1 py-1 text-right text-xs font-medium text-gray-500 uppercase' style={{ width: '5%' }}>
                판매합계
              </th>
              <th className='px-1 py-1 text-right text-xs font-medium text-gray-500 uppercase' style={{ width: '5%' }}>
                재고조정수량
              </th>
              <th className='px-1 py-1 text-left text-xs font-medium text-gray-500 uppercase' style={{ width: '8%' }}>
                재고조정상태
              </th>
              <th className='px-1 py-1 text-right text-xs font-medium text-gray-500 uppercase' style={{ width: '5%' }}>
                기말재고
              </th>
            </tr>
          </thead>
          <tbody className='divide-y divide-gray-200 bg-white'>
            {data.map((item, index) => (
              <tr key={`${item.variant_code}-${index}`} className='hover:bg-gray-50'>
                <td
                  className='px-1 sm:px-2 py-2 text-xs text-gray-900 cursor-pointer hover:bg-blue-50'
                  onClick={() => onRowClick?.(item.variant_code || '')}
                  title='클릭하여 상품 상세보기'
                  style={{ width: '4%' }}
                >
                  {item.big_category}
                </td>
                <td
                  className='px-1 sm:px-2 py-2 text-xs text-gray-900 cursor-pointer hover:bg-blue-50'
                  onClick={() => onRowClick?.(item.variant_code || '')}
                  title='클릭하여 상품 상세보기'
                  style={{ width: '4%' }}
                >
                  {item.middle_category}
                </td>
                <td
                  className='px-1 sm:px-2 py-2 text-xs text-gray-900 cursor-pointer hover:bg-blue-50'
                  onClick={() => onRowClick?.(item.variant_code || '')}
                  title='클릭하여 상품 상세보기'
                  style={{ width: '5%' }}
                >
                  {item.category}
                </td>
                <td
                  className='px-1 sm:px-2 py-2 text-xs text-gray-900 cursor-pointer hover:bg-blue-50'
                  onClick={() => onRowClick?.(item.variant_code || '')}
                  title={`${item.description} - 클릭하여 상품 상세보기`}
                  style={{ width: '8%' }}
                >
                  {item.description}
                </td>
                <td
                  className='px-1 sm:px-2 py-2 text-xs text-gray-900 cursor-pointer hover:bg-blue-50'
                  onClick={() => onRowClick?.(item.variant_code || '')}
                  title={`${item.online_name} - 클릭하여 상품 상세보기`}
                  style={{ width: '12%' }}
                >
                  {item.online_name}
                </td>
                <td
                  className='px-1 sm:px-2 py-2 text-xs text-gray-900 cursor-pointer hover:bg-blue-50'
                  onClick={() => onRowClick?.(item.variant_code || '')}
                  title={`${item.offline_name} - 클릭하여 상품 상세보기`}
                  style={{ width: '12%' }}
                >
                  {item.offline_name}
                </td>
                <td
                  className='px-1 sm:px-2 py-2 text-xs text-gray-900 cursor-pointer hover:bg-blue-50'
                  onClick={() => onRowClick?.(item.variant_code || '')}
                  title='클릭하여 상품 상세보기'
                  style={{ width: '4%' }}
                >
                  {item.option}
                </td>
                <td
                  className='px-1 sm:px-2 py-2 text-xs text-gray-900 cursor-pointer hover:bg-blue-50'
                  onClick={() => onRowClick?.(item.variant_code || '')}
                  title='클릭하여 상품 상세보기'
                  style={{ width: '5%' }}
                >
                  {item.detail_option}
                </td>
                <td
                  className='px-1 sm:px-2 py-2 text-xs font-medium text-blue-600 cursor-pointer hover:bg-blue-100 hover:text-blue-800'
                  onClick={() => onRowClick?.(item.variant_code || '')}
                  title='클릭하여 상품 상세보기'
                  style={{ width: '6%' }}
                >
                  {item.product_code}
                </td>
                {renderEditableCell(
                  index,
                  'warehouse_stock_start',
                  item.warehouse_stock_start,
                  item.variant_code || '',
                  'px-1 sm:px-2 py-2 text-right text-xs text-gray-900',
                  { width: '5%' }
                )}
                {renderEditableCell(
                  index,
                  'store_stock_start',
                  item.store_stock_start,
                  item.variant_code || '',
                  'px-1 sm:px-2 py-2 text-right text-xs text-gray-900',
                  { width: '5%' }
                )}
                <td className='px-1 sm:px-2 py-2 text-right text-xs font-medium text-gray-900' style={{ width: '5%' }}>
                  {item.initial_stock?.toLocaleString() || 0}
                </td>
                {renderEditableCell(
                  index,
                  'inbound_quantity',
                  item.inbound_quantity,
                  item.variant_code || '',
                  'px-1 sm:px-2 py-2 text-right text-xs text-gray-900',
                  { width: '5%' }
                )}
                {renderEditableCell(
                  index,
                  'store_sales',
                  item.store_sales,
                  item.variant_code || '',
                  'px-1 sm:px-2 py-2 text-right text-xs text-gray-900',
                  { width: '5%' }
                )}
                {renderEditableCell(
                  index,
                  'online_sales',
                  item.online_sales,
                  item.variant_code || '',
                  'px-1 sm:px-2 py-2 text-right text-xs text-gray-900',
                  { width: '5%' }
                )}
                <td className='px-1 sm:px-2 py-2 text-right text-xs font-medium text-gray-900' style={{ width: '5%' }}>
                  {item.total_sales?.toLocaleString() || 0}
                </td>
                <td className='px-1 sm:px-2 py-2 text-right text-xs text-gray-900' style={{ width: '5%' }}>
                  {(item as any).adjustment_quantity ? Number((item as any).adjustment_quantity).toLocaleString() : 0}
                </td>
                <td className='px-1 sm:px-2 py-2 text-xs text-gray-900' style={{ width: '8%' }}>
                  <div className='whitespace-pre-line'>
                    {(() => {
                      const adjustmentStatus = (item as any).adjustment_status;
                      if (typeof adjustmentStatus === 'string') {
                        // 쉼표로 구분된 문자열인 경우 줄바꿈 처리
                        return adjustmentStatus.split(',').join('\n');
                      }
                      if (adjustmentStatus) {
                        try {
                          // JSON 문자열인 경우 파싱 시도
                          let parsed;
                          if (typeof adjustmentStatus === 'string') {
                            parsed = JSON.parse(adjustmentStatus);
                          } else {
                            parsed = adjustmentStatus;
                          }

                          const statusArray = Array.isArray(parsed) ? parsed : [parsed];
                          return statusArray.map((status: any) => {
                            if (typeof status === 'object' && status) {
                              const createdBy = status.created_by || '';
                              const quantity = status.quantity || 0;
                              return `${createdBy}: ${quantity > 0 ? '+' : ''}${quantity}`;
                            }
                            return String(status);
                          }).join('\n');
                        } catch {
                          return String(adjustmentStatus);
                        }
                      }
                      return '-';
                    })()}
                  </div>
                </td>
                <td className='px-1 sm:px-2 py-2 text-right text-xs font-medium text-green-600' style={{ width: '5%' }}>
                  {item.ending_stock?.toLocaleString() || 0}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default VariantStatusTable;
