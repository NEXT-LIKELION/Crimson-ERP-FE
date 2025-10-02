import React, { useState } from 'react';
import { FiX, FiAlertTriangle } from 'react-icons/fi';
import { FaHistory, FaUndo } from 'react-icons/fa';
import { useInventorySnapshots, useRollbackInventory } from '../../hooks/queries/useInventorySnapshots';
import Pagination from '../pagination/pagination';
import { useEscapeKey } from '../../hooks/useEscapeKey';

interface InventoryRollbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface InventorySnapshot {
  id: number;
  created_at: string;
  reason: string;
  actor_name: string;
  meta: {
    filename?: string;
    upload_type?: string;
    filesize?: number;
  };
}

const InventoryRollbackModal: React.FC<InventoryRollbackModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSnapshot, setSelectedSnapshot] = useState<InventorySnapshot | null>(null);
  const [rollbackReason, setRollbackReason] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    data: snapshotsData,
    isLoading,
    error,
  } = useInventorySnapshots({
    page: currentPage,
  });

  const rollbackMutation = useRollbackInventory();

  const snapshots: InventorySnapshot[] = snapshotsData?.results || [];
  const totalCount = snapshotsData?.count || 0;
  const itemsPerPage = 10;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatFileSize = (size?: number) => {
    if (!size) return '-';
    if (size < 1024) return `${size}B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)}KB`;
    return `${(size / (1024 * 1024)).toFixed(1)}MB`;
  };

  const handleRollbackClick = (snapshot: InventorySnapshot) => {
    setSelectedSnapshot(snapshot);
    setRollbackReason(`스냅샷 #${snapshot.id}로 롤백`);
    setShowConfirm(true);
  };

  const handleConfirmRollback = async () => {
    if (!selectedSnapshot) return;

    try {
      await rollbackMutation.mutateAsync({
        snapshotId: selectedSnapshot.id,
        reason: rollbackReason,
      });

      alert('롤백이 완료되었습니다.');
      setShowConfirm(false);
      setSelectedSnapshot(null);
      setRollbackReason('');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('롤백 실패:', error);
      alert('롤백 중 오류가 발생했습니다.');
    }
  };

  const handleCancelConfirm = () => {
    setShowConfirm(false);
    setSelectedSnapshot(null);
    setRollbackReason('');
  };

  useEscapeKey(onClose, isOpen);

  if (!isOpen) return null;

  if (showConfirm) {
    return (
      <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm'>
        <div className='mx-4 w-full max-w-md rounded-lg bg-white shadow-lg'>
          <div className='flex items-center justify-between border-b border-gray-300 px-6 py-4'>
            <div className='flex items-center gap-2'>
              <FiAlertTriangle className='text-amber-500' />
              <h2 className='text-lg font-semibold'>롤백 확인</h2>
            </div>
            <button onClick={handleCancelConfirm}>
              <FiX className='h-6 w-6 text-gray-500 hover:text-gray-700' />
            </button>
          </div>

          <div className='p-6'>
            <div className='mb-4 rounded-lg bg-amber-50 border border-amber-200 p-4'>
              <div className='flex items-start'>
                <FiAlertTriangle className='mt-1 mr-3 text-amber-600 flex-shrink-0' />
                <div className='text-sm text-amber-800'>
                  <p className='font-medium mb-2'>⚠️ 주의사항</p>
                  <ul className='list-disc list-inside space-y-1 text-xs'>
                    <li>현재 재고 상태가 백업된 후 롤백됩니다</li>
                    <li>롤백 후에는 되돌릴 수 없습니다</li>
                    <li>모든 재고, 가격, 주문/반품 데이터가 복원됩니다</li>
                  </ul>
                </div>
              </div>
            </div>

            {selectedSnapshot && (
              <div className='mb-4 rounded-lg bg-gray-50 p-4'>
                <h4 className='font-medium text-gray-900 mb-2'>롤백할 스냅샷</h4>
                <div className='text-sm text-gray-600 space-y-1'>
                  <p><span className='font-medium'>ID:</span> #{selectedSnapshot.id}</p>
                  <p><span className='font-medium'>생성일시:</span> {formatDate(selectedSnapshot.created_at)}</p>
                  <p><span className='font-medium'>사유:</span> {selectedSnapshot.reason}</p>
                  {selectedSnapshot.meta?.filename && (
                    <p><span className='font-medium'>파일:</span> {selectedSnapshot.meta.filename}</p>
                  )}
                </div>
              </div>
            )}

            <div className='mb-6'>
              <label className='mb-2 block text-sm font-medium text-gray-700'>
                롤백 사유
              </label>
              <textarea
                value={rollbackReason}
                onChange={(e) => setRollbackReason(e.target.value)}
                placeholder='롤백 사유를 입력하세요'
                className='w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-blue-500'
                rows={3}
                required
              />
            </div>

            <div className='flex justify-end gap-3'>
              <button
                onClick={handleCancelConfirm}
                className='rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50'>
                취소
              </button>
              <button
                onClick={handleConfirmRollback}
                disabled={!rollbackReason.trim() || rollbackMutation.isPending}
                className='rounded-md bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50'>
                {rollbackMutation.isPending ? '롤백 중...' : '롤백 실행'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm'>
      <div className='mx-4 flex max-h-[90vh] w-full max-w-5xl flex-col rounded-lg bg-white shadow-lg'>
        <div className='flex items-center justify-between border-b border-gray-300 px-6 py-4'>
          <div className='flex items-center gap-2'>
            <FaHistory className='text-blue-500' />
            <h2 className='text-lg font-semibold'>재고 스냅샷 롤백</h2>
          </div>
          <button onClick={onClose}>
            <FiX className='h-6 w-6 text-gray-500 hover:text-gray-700' />
          </button>
        </div>

        <div className='border-b border-gray-200 p-6'>
          <div className='rounded-lg bg-blue-50 border border-blue-200 p-4'>
            <div className='flex items-start'>
              <FaHistory className='mt-1 mr-3 text-blue-600 flex-shrink-0' />
              <div className='text-sm text-blue-800'>
                <p className='font-medium mb-1'>📄 재고 백업 기록</p>
                <p className='text-xs'>
                  데이터 업로드 전에 자동으로 저장된 재고 현황입니다.
                  문제가 발생했을 때 이전 상태로 되돌릴 수 있습니다.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className='flex-1 overflow-auto p-6'>
          {isLoading ? (
            <div className='flex h-64 items-center justify-center'>
              <div className='text-gray-500'>로딩 중...</div>
            </div>
          ) : error ? (
            <div className='flex h-64 items-center justify-center'>
              <div className='text-red-500'>데이터 로드 중 오류가 발생했습니다.</div>
            </div>
          ) : snapshots.length === 0 ? (
            <div className='flex h-64 items-center justify-center'>
              <div className='text-gray-500'>스냅샷이 없습니다.</div>
            </div>
          ) : (
            <div className='relative overflow-x-auto'>
              <table className='w-full border-collapse text-sm text-gray-700'>
                <thead className='border-b border-gray-300 bg-gray-50 text-xs uppercase'>
                  <tr>
                    <th className='min-w-[60px] px-4 py-3 text-left'>ID</th>
                    <th className='min-w-[140px] px-4 py-3 text-left'>생성일시</th>
                    <th className='min-w-[200px] px-4 py-3 text-left'>사유</th>
                    <th className='min-w-[80px] px-4 py-3 text-left'>수행자</th>
                    <th className='min-w-[250px] px-4 py-3 text-left'>파일명</th>
                    <th className='min-w-[80px] px-4 py-3 text-left'>파일크기</th>
                    <th className='min-w-[80px] px-4 py-3 text-center'>작업</th>
                  </tr>
                </thead>
                <tbody>
                  {snapshots.map((snapshot, index) => (
                    <tr
                      key={snapshot.id}
                      className={`border-b border-gray-200 hover:bg-gray-50 ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      }`}>
                      <td className='min-w-[60px] px-4 py-3 text-left text-sm font-medium'>#{snapshot.id}</td>
                      <td className='min-w-[140px] px-4 py-3 text-left text-sm'>{formatDate(snapshot.created_at)}</td>
                      <td className='min-w-[200px] px-4 py-3 text-left text-sm' title={snapshot.reason}>
                        <div className='max-w-[200px] truncate'>{snapshot.reason}</div>
                      </td>
                      <td className='min-w-[80px] px-4 py-3 text-left text-sm'>{snapshot.actor_name || 'System'}</td>
                      <td className='min-w-[250px] px-4 py-3 text-left text-sm' title={snapshot.meta?.filename || '-'}>
                        <div className='max-w-[250px] truncate'>{snapshot.meta?.filename || '-'}</div>
                      </td>
                      <td className='min-w-[80px] px-4 py-3 text-left text-sm'>
                        {formatFileSize(snapshot.meta?.filesize)}
                      </td>
                      <td className='min-w-[80px] px-4 py-3 text-center'>
                        <button
                          onClick={() => handleRollbackClick(snapshot)}
                          className='inline-flex items-center gap-1 rounded-md bg-red-50 px-3 py-1 text-xs text-red-700 hover:bg-red-100 whitespace-nowrap'>
                          <FaUndo size={12} />
                          롤백
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {totalCount > 0 && (
          <div className='border-t border-gray-200 px-6 py-4'>
            <div className='flex items-center justify-between'>
              <div className='text-sm text-gray-500'>
                총 {totalCount.toLocaleString()}개의 스냅샷
              </div>
              <Pagination
                currentPage={currentPage}
                totalItems={totalCount}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryRollbackModal;