import { useState } from 'react';
import { IoMdSettings } from 'react-icons/io';
import type { TableColumn } from '../../types/tableColumns';

interface ColumnSettingsModalProps {
  columns: TableColumn[];
  columnVisibility: Record<string, boolean>;
  onToggleColumn: (columnId: string) => void;
  onShowAll: () => void;
  onReset: () => void;
}

const ColumnSettingsModal = ({
  columns,
  columnVisibility,
  onToggleColumn,
  onShowAll,
  onReset,
}: ColumnSettingsModalProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = (columnId: string) => {
    const column = columns.find((col) => col.id === columnId);
    if (column?.required) {
      return; // 필수 컬럼은 토글 불가
    }
    onToggleColumn(columnId);
  };

  return (
    <>
      {/* 설정 버튼 */}
      <button
        onClick={() => setIsOpen(true)}
        className='flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50'
        title='컬럼 설정'>
        <IoMdSettings size={18} />
        <span>컬럼 설정</span>
      </button>

      {/* 모달 */}
      {isOpen && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm'
          onClick={() => setIsOpen(false)}>
          <div
            className='w-full max-w-md rounded-lg bg-white p-6 shadow-xl'
            onClick={(e) => e.stopPropagation()}>
            {/* 헤더 */}
            <div className='mb-4 flex items-center justify-between'>
              <h2 className='text-xl font-semibold text-gray-900'>컬럼 표시 설정</h2>
              <button
                onClick={() => setIsOpen(false)}
                className='text-gray-400 transition-colors hover:text-gray-600'>
                <svg className='h-6 w-6' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M6 18L18 6M6 6l12 12'
                  />
                </svg>
              </button>
            </div>

            {/* 컬럼 리스트 */}
            <div className='mb-4 max-h-96 overflow-y-auto'>
              <div className='space-y-2'>
                {columns.map((column) => {
                  const isVisible = columnVisibility[column.id] ?? true;
                  const isRequired = column.required ?? false;

                  return (
                    <label
                      key={column.id}
                      className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
                        isRequired
                          ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
                          : 'border-gray-200 bg-white cursor-pointer hover:bg-gray-50'
                      }`}>
                      <input
                        type='checkbox'
                        checked={isVisible}
                        onChange={() => handleToggle(column.id)}
                        disabled={isRequired}
                        className='h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 disabled:cursor-not-allowed'
                      />
                      <span className={`flex-1 text-sm ${isRequired ? 'text-gray-500' : 'text-gray-900'}`}>
                        {column.label}
                        {isRequired && (
                          <span className='ml-2 text-xs text-gray-400'>(필수)</span>
                        )}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* 액션 버튼 */}
            <div className='flex items-center justify-between gap-3 border-t border-gray-200 pt-4'>
              <div className='flex gap-2'>
                <button
                  onClick={onShowAll}
                  className='rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50'>
                  모두 표시
                </button>
                <button
                  onClick={onReset}
                  className='rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50'>
                  기본값 복원
                </button>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className='rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700'>
                닫기
                </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ColumnSettingsModal;

