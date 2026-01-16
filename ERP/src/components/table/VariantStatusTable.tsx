import { useState, useRef, useEffect } from 'react';
import { ProductVariantStatus } from '../../types/product';
import { updateVariantStatus, deleteVariantStatus, bulkUpdateVariantStatus } from '../../api/inventory';
import { useQueryClient } from '@tanstack/react-query';
import { useColumnVisibility } from '../../hooks/useColumnVisibility';
import ColumnSettingsModal from '../modal/ColumnSettingsModal';
import type { TableColumn } from '../../types/tableColumns';
import { MdOutlineDelete } from 'react-icons/md';
import PrimaryButton from '../button/PrimaryButton';
import SecondaryButton from '../button/SecondaryButton';

interface VariantStatusTableProps {
  data: ProductVariantStatus[];
  isLoading?: boolean;
  year: number;
  month: number;
  onRowClick?: (variantCode: string) => void;
  onStockAdjust?: (item: ProductVariantStatus, year: number, month: number) => void;
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

// 편집 가능한 필드 목록 (노란색 배경 표시용)
const EDITABLE_FIELDS: string[] = [
  'warehouse_stock_start',
  'store_stock_start',
  'inbound_quantity',
  'store_sales',
  'online_sales',
  'adjustment_quantity',
  'adjustment_status',
];

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
  { id: 'adjustment_quantity', label: '재고조정수량', defaultVisible: true },
  { id: 'adjustment_status', label: '재고조정사유', defaultVisible: true },
  { id: 'ending_stock', label: '기말재고', defaultVisible: true },
];

// 편집된 데이터를 저장하는 타입
interface EditedRowData {
  variant_code: string;
  warehouse_stock_start?: number;
  store_stock_start?: number;
  inbound_quantity?: number;
  store_sales?: number;
  online_sales?: number;
  version: number;
}

const VariantStatusTable: React.FC<VariantStatusTableProps> = ({
  data,
  isLoading,
  year,
  month,
  onRowClick,
  onStockAdjust,
}) => {
  const queryClient = useQueryClient();
  const [isLocked, setIsLocked] = useState(false); // 데이터 잠금 상태
  const [editedData, setEditedData] = useState<Map<string, EditedRowData>>(new Map()); // 편집된 데이터 저장
  const [isSaving, setIsSaving] = useState(false); // 저장 중 상태
  const [deletingRows, setDeletingRows] = useState<Set<string>>(new Set()); // 삭제 중인 행들

  // 편집 가능한 필드인지 확인하는 헬퍼 함수
  const isEditableField = (fieldId: string): boolean => {
    return EDITABLE_FIELDS.includes(fieldId);
  };

  // 컬럼 ID로 label을 가져오는 헬퍼 함수
  const getColumnLabel = (columnId: string): string => {
    const column = VARIANT_STATUS_COLUMNS.find((col) => col.id === columnId);
    return column?.label || columnId;
  };

  // 컬럼 표시/숨김 관리
  const { columnVisibility, toggleColumn, showAllColumns, resetToDefault, isColumnVisible } =
    useColumnVisibility({
      columns: VARIANT_STATUS_COLUMNS,
      tableType: 'variantStatus',
    });

  // 셀 값 변경 핸들러
  const handleCellChange = (
    variantCode: string,
    field: EditableField,
    value: string,
    version: number
  ) => {
    if (isLocked) return;

    const numericValue = value === '' ? undefined : parseInt(value);
    if (value !== '' && (isNaN(numericValue!) || numericValue! < 0)) {
      return; // 유효하지 않은 값은 무시
    }

    setEditedData((prev) => {
      const newMap = new Map(prev);
      const existing = newMap.get(variantCode) || {
        variant_code: variantCode,
        version,
      };

      newMap.set(variantCode, {
        ...existing,
        [field]: numericValue,
      });

      return newMap;
    });
  };

  // 행 삭제 핸들러
  const handleDeleteRow = async (variantCode: string) => {
    if (!variantCode) return;

    if (!confirm('정말로 이 행을 삭제하시겠습니까?')) return;

    setDeletingRows((prev) => new Set(prev).add(variantCode));

    try {
      await deleteVariantStatus(year, month, variantCode);
      queryClient.invalidateQueries({ queryKey: ['variantStatus', year, month] });
      alert('행이 성공적으로 삭제되었습니다.');
    } catch (error: unknown) {
      console.error('삭제 실패:', error);
      const errorMessage =
        error && typeof error === 'object' && 'response' in error
          ? (error as { response?: { data?: { detail?: string } } }).response?.data?.detail ||
            '삭제 중 오류가 발생했습니다.'
          : '삭제 중 오류가 발생했습니다.';
      alert(errorMessage);
    } finally {
      setDeletingRows((prev) => {
        const newSet = new Set(prev);
        newSet.delete(variantCode);
        return newSet;
      });
    }
  };

  // 저장하기 핸들러
  const handleSaveAll = async () => {
    if (editedData.size === 0) {
      alert('저장할 변경사항이 없습니다.');
      return;
    }

    setIsSaving(true);

    try {
      const rows = Array.from(editedData.values());
      const response = await bulkUpdateVariantStatus({
        year,
        month,
        rows,
      });

      // 응답에서 conflicts와 errors 확인
      const responseData = response.data as {
        updated?: number;
        conflicts?: unknown[];
        errors?: unknown[];
      };

      const hasConflicts = responseData?.conflicts && responseData.conflicts.length > 0;
      const hasErrors = responseData?.errors && responseData.errors.length > 0;

      if (hasConflicts || hasErrors) {
        alert(
          '다른 사용자가 동시에 수정하여 충돌이 발생했거나 오류가 발생했습니다. 페이지를 새로고침하여 최신 데이터를 불러오세요.'
        );
        // 새로고침 유도
        if (confirm('지금 새로고침하시겠습니까?')) {
          window.location.reload();
        }
        // 충돌/오류가 있어도 일부는 저장되었을 수 있으므로 캐시 무효화
        queryClient.invalidateQueries({ queryKey: ['variantStatus', year, month] });
        // 충돌/오류가 발생한 행은 편집 데이터에서 제거하지 않음 (사용자가 확인할 수 있도록)
        return;
      }

      // 성공 시 편집 데이터 초기화 및 캐시 무효화
      setEditedData(new Map());
      queryClient.invalidateQueries({ queryKey: ['variantStatus', year, month] });
      const updatedCount = responseData?.updated || rows.length;
      alert(`${updatedCount}개 행이 성공적으로 저장되었습니다.`);
    } catch (error: unknown) {
      console.error('저장 실패:', error);

      const errorMessage =
        error && typeof error === 'object' && 'response' in error
          ? (error as { response?: { data?: { detail?: string } } }).response?.data?.detail ||
            '저장 중 오류가 발생했습니다.'
          : '저장 중 오류가 발생했습니다.';
      alert(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  // 편집 가능한 셀 렌더링 (항상 input으로 표시)
  const renderEditableCell = (
    field: EditableField,
    value: number | undefined,
    variantCode: string,
    version: number,
    className: string = '',
    style: React.CSSProperties = {}
  ) => {
    const isEditable = isEditableField(field);
    const editedValue = editedData.get(variantCode)?.[field];
    const displayValue = editedValue !== undefined ? editedValue : value;
    const inputValue = displayValue?.toString() || '';

    if (!isEditable) {
      return (
        <td className={className} style={style}>
          {displayValue?.toLocaleString() || 0}
        </td>
      );
    }

    const isEdited = editedData.has(variantCode) && editedData.get(variantCode)?.[field] !== undefined;

    return (
      <td className={`${className} ${isEditable ? 'bg-yellow-50' : ''}`} style={style}>
        <input
          type='number'
          value={inputValue}
          onChange={(e) => {
            const newValue = e.target.value;
            // 음수 입력 방지
            if (newValue === '' || (!isNaN(Number(newValue)) && Number(newValue) >= 0)) {
              handleCellChange(variantCode, field, newValue, version);
            }
          }}
          disabled={isLocked}
          className={`w-full rounded border px-2 py-1 text-right text-xs focus:ring-1 focus:outline-none ${
            isLocked
              ? 'cursor-not-allowed bg-gray-100 border-gray-300 text-gray-500'
              : isEdited
                ? 'border-blue-500 bg-blue-50 focus:ring-blue-500'
                : 'border-gray-300 focus:ring-blue-500'
          }`}
          min='0'
          step='1'
        />
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
    <div>
      {/* 헤더 */}
      <div className='mb-4 flex items-center justify-between'>
        <ColumnSettingsModal
          columns={VARIANT_STATUS_COLUMNS}
          columnVisibility={columnVisibility}
          onToggleColumn={toggleColumn}
          onShowAll={showAllColumns}
          onReset={resetToDefault}
        />
        <div className='flex items-center gap-2'>
          {editedData.size > 0 && (
            <span className='text-sm text-gray-600'>
              {editedData.size}개 행 수정됨
            </span>
          )}
          <PrimaryButton
            text={isLocked ? '잠금 해제' : '데이터 잠그기'}
            onClick={() => setIsLocked(!isLocked)}
            disabled={isSaving}
          />
          <PrimaryButton
            text='저장하기'
            onClick={handleSaveAll}
            disabled={isLocked || isSaving || editedData.size === 0}
          />
        </div>
      </div>
      {/* 테이블 */}
      <div className='overflow-x-auto'>
        <table className='table-auto border border-gray-200 text-xs text-gray-700'>
          <thead className='bg-gray-50'>
            <tr>
              {isColumnVisible('big_category') && (
                <th
                  className='px-1 py-1 text-left text-xs font-medium whitespace-nowrap text-gray-500 uppercase'
                  style={{ width: '4%', minWidth: '60px' }}>
                  {getColumnLabel('big_category')}
                </th>
              )}
              {isColumnVisible('middle_category') && (
                <th
                  className='px-1 py-1 text-left text-xs font-medium whitespace-nowrap text-gray-500 uppercase'
                  style={{ width: '4%', minWidth: '60px' }}>
                  {getColumnLabel('middle_category')}
                </th>
              )}
              {isColumnVisible('category') && (
                <th
                  className='px-1 py-1 text-left text-xs font-medium whitespace-nowrap text-gray-500 uppercase'
                  style={{ width: '5%', minWidth: '80px' }}>
                  {getColumnLabel('category')}
                </th>
              )}
              {isColumnVisible('description') && (
                <th
                  className='px-1 py-1 text-left text-xs font-medium whitespace-nowrap text-gray-500 uppercase'
                  style={{ width: '8%', minWidth: '120px' }}>
                  {getColumnLabel('description')}
                </th>
              )}
              {isColumnVisible('online_name') && (
                <th
                  className='px-1 py-1 text-left text-xs font-medium whitespace-nowrap text-gray-500 uppercase'
                  style={{ width: '12%', minWidth: '180px' }}>
                  {getColumnLabel('online_name')}
                </th>
              )}
              {isColumnVisible('offline_name') && (
                <th
                  className='px-1 py-1 text-left text-xs font-medium whitespace-nowrap text-gray-500 uppercase'
                  style={{ width: '12%', minWidth: '180px' }}>
                  {getColumnLabel('offline_name')}
                </th>
              )}
              {isColumnVisible('option') && (
                <th
                  className='px-1 py-1 text-left text-xs font-medium whitespace-nowrap text-gray-500 uppercase'
                  style={{ width: '4%', minWidth: '60px' }}>
                  {getColumnLabel('option')}
                </th>
              )}
              {isColumnVisible('detail_option') && (
                <th
                  className='px-1 py-1 text-left text-xs font-medium whitespace-nowrap text-gray-500 uppercase'
                  style={{ width: '5%', minWidth: '80px' }}>
                  {getColumnLabel('detail_option')}
                </th>
              )}
              {isColumnVisible('product_code') && (
                <th
                  className='px-1 py-1 text-left text-xs font-medium whitespace-nowrap text-gray-500 uppercase'
                  style={{ width: '6%', minWidth: '100px' }}>
                  {getColumnLabel('product_code')}
                </th>
              )}
              {isColumnVisible('variant_code') && (
                <th
                  className='px-1 py-1 text-left text-xs font-medium whitespace-nowrap text-gray-500 uppercase'
                  style={{ width: '6%', minWidth: '100px' }}>
                  {getColumnLabel('variant_code')}
                </th>
              )}
              {isColumnVisible('warehouse_stock_start') && (
                <th
                  className={`${isEditableField('warehouse_stock_start') ? 'bg-yellow-50' : ''} px-1 py-1 text-right text-xs font-medium whitespace-nowrap text-gray-500 uppercase`}
                  style={{ width: '5%', minWidth: '80px' }}>
                  {getColumnLabel('warehouse_stock_start')}
                </th>
              )}
              {isColumnVisible('store_stock_start') && (
                <th
                  className={`${isEditableField('store_stock_start') ? 'bg-yellow-50' : ''} px-1 py-1 text-right text-xs font-medium whitespace-nowrap text-gray-500 uppercase`}
                  style={{ width: '5%', minWidth: '80px' }}>
                  {getColumnLabel('store_stock_start')}
                </th>
              )}
              {isColumnVisible('initial_stock') && (
                <th
                  className={`${isEditableField('initial_stock') ? 'bg-yellow-50' : ''} px-1 py-1 text-right text-xs font-medium whitespace-nowrap text-gray-500 uppercase`}
                  style={{ width: '5%', minWidth: '80px' }}>
                  {getColumnLabel('initial_stock')}
                </th>
              )}
              {isColumnVisible('inbound_quantity') && (
                <th
                  className={`${isEditableField('inbound_quantity') ? 'bg-yellow-50' : ''} px-1 py-1 text-right text-xs font-medium whitespace-nowrap text-gray-500 uppercase`}
                  style={{ width: '5%', minWidth: '80px' }}>
                  {getColumnLabel('inbound_quantity')}
                </th>
              )}
              {isColumnVisible('store_sales') && (
                <th
                  className={`${isEditableField('store_sales') ? 'bg-yellow-50' : ''} px-1 py-1 text-right text-xs font-medium whitespace-nowrap text-gray-500 uppercase`}
                  style={{ width: '5%', minWidth: '80px' }}>
                  {getColumnLabel('store_sales')}
                </th>
              )}
              {isColumnVisible('online_sales') && (
                <th
                  className={`${isEditableField('online_sales') ? 'bg-yellow-50' : ''} px-1 py-1 text-right text-xs font-medium whitespace-nowrap text-gray-500 uppercase`}
                  style={{ width: '5%', minWidth: '80px' }}>
                  {getColumnLabel('online_sales')}
                </th>
              )}
              {isColumnVisible('total_sales') && (
                <th
                  className={`${isEditableField('total_sales') ? 'bg-yellow-50' : ''} px-1 py-1 text-right text-xs font-medium whitespace-nowrap text-gray-500 uppercase`}
                  style={{ width: '5%', minWidth: '80px' }}>
                  {getColumnLabel('total_sales')}
                </th>
              )}
              {isColumnVisible('adjustment_quantity') && (
                <th
                  className={`${isEditableField('adjustment_quantity') ? 'bg-yellow-50' : ''} px-1 py-1 text-right text-xs font-medium whitespace-nowrap text-gray-500 uppercase`}
                  style={{ width: '5%', minWidth: '80px' }}>
                  {getColumnLabel('adjustment_quantity')}
                </th>
              )}
              {isColumnVisible('adjustment_status') && (
                <th
                  className={`${isEditableField('adjustment_status') ? 'bg-yellow-50' : ''} px-1 py-1 text-left text-xs font-medium text-gray-500 uppercase`}
                  style={{ width: '8%', minWidth: '120px' }}>
                  {getColumnLabel('adjustment_status')}
                </th>
              )}
              {isColumnVisible('ending_stock') && (
                <th
                  className='px-1 py-1 text-right text-xs font-medium whitespace-nowrap text-gray-500 uppercase'
                  style={{ width: '5%', minWidth: '80px' }}>
                  {getColumnLabel('ending_stock')}
                </th>
              )}
              <th
                className='px-1 py-1 text-center text-xs font-medium whitespace-nowrap text-gray-500 uppercase'
                style={{ width: '3%', minWidth: '50px' }}>
                관리
              </th>
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
                    'warehouse_stock_start',
                    item.warehouse_stock_start,
                    item.variant_code || '',
                    (item as { version?: number }).version || 0,
                    'px-1 sm:px-2 py-2 text-right text-xs text-gray-900',
                    { width: '5%', minWidth: '80px' }
                  )}
                {isColumnVisible('store_stock_start') &&
                  renderEditableCell(
                    'store_stock_start',
                    item.store_stock_start,
                    item.variant_code || '',
                    (item as { version?: number }).version || 0,
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
                    'inbound_quantity',
                    item.inbound_quantity,
                    item.variant_code || '',
                    (item as { version?: number }).version || 0,
                    'px-1 sm:px-2 py-2 text-right text-xs text-gray-900',
                    { width: '5%', minWidth: '80px' }
                  )}
                {isColumnVisible('store_sales') &&
                  renderEditableCell(
                    'store_sales',
                    item.store_sales,
                    item.variant_code || '',
                    (item as { version?: number }).version || 0,
                    'px-1 sm:px-2 py-2 text-right text-xs text-gray-900',
                    { width: '5%', minWidth: '80px' }
                  )}
                {isColumnVisible('online_sales') &&
                  renderEditableCell(
                    'online_sales',
                    item.online_sales,
                    item.variant_code || '',
                    (item as { version?: number }).version || 0,
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
                    className={`${isEditableField('adjustment_quantity') ? 'bg-yellow-50 hover:bg-yellow-100' : 'hover:bg-blue-50'} cursor-pointer px-1 py-2 text-right text-xs whitespace-nowrap text-gray-900 transition-colors sm:px-2`}
                    style={{ width: '5%', minWidth: '80px' }}
                    onClick={() => onStockAdjust?.(item, year, month)}
                    title='클릭하여 재고 조정'>
                    {item.adjustment_quantity
                      ? Number(item.adjustment_quantity).toLocaleString()
                      : 0}
                  </td>
                )}
                {isColumnVisible('adjustment_status') && (
                  <td
                    className={`${isEditableField('adjustment_status') ? 'bg-yellow-50 hover:bg-yellow-100' : 'hover:bg-blue-50'} cursor-pointer px-1 py-2 text-xs text-gray-900 transition-colors sm:px-2`}
                    style={{ width: '8%' }}
                    onClick={() => onStockAdjust?.(item, year, month)}
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
                <td className='px-1 py-2 text-center sm:px-2'>
                  <button
                    onClick={() => handleDeleteRow(item.variant_code || '')}
                    disabled={isLocked || deletingRows.has(item.variant_code || '')}
                    className={`rounded p-1 transition-colors ${
                      isLocked || deletingRows.has(item.variant_code || '')
                        ? 'cursor-not-allowed text-gray-400'
                        : 'text-red-500 hover:bg-red-50 hover:text-red-700'
                    }`}
                    title='행 삭제'>
                    {deletingRows.has(item.variant_code || '') ? (
                      <div className='h-4 w-4 animate-spin rounded-full border-2 border-red-500 border-t-transparent'></div>
                    ) : (
                      <MdOutlineDelete size={18} />
                    )}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {isSaving && (
        <div className='mt-4 flex items-center justify-center gap-2 text-sm text-gray-600'>
          <div className='h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent'></div>
          <span>저장 중...</span>
        </div>
      )}
    </div>
  );
};

export default VariantStatusTable;
