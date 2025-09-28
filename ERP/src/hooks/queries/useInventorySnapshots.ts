import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import {
  fetchInventorySnapshots,
  fetchInventorySnapshot,
  rollbackToSnapshot
} from '../../api/inventory';
import { detectUploadChannel, getAllChannelUpdateDates } from '../../utils/snapshotAnalyzer';
import { InventorySnapshot } from '../../types/product';

// 스냅샷 목록 조회
export const useInventorySnapshots = ({ page = 1 }: { page?: number } = {}) => {
  return useQuery({
    queryKey: ['inventorySnapshots', page],
    queryFn: () => fetchInventorySnapshots({ page }),
    select: (response) => response.data,
  });
};

// 스냅샷 상세 조회
export const useInventorySnapshot = (id: number) => {
  return useQuery({
    queryKey: ['inventorySnapshot', id],
    queryFn: () => fetchInventorySnapshot(id),
    enabled: !!id,
  });
};

// 채널 정보가 포함된 스냅샷 목록 조회
export const useSnapshotsWithChannelInfo = ({ page = 1 }: { page?: number } = {}) => {
  const { data: snapshotsData, ...rest } = useInventorySnapshots({ page });

  const snapshotsWithChannel = useMemo(() => {
    if (!snapshotsData?.results || snapshotsData.results.length === 0) {
      return [];
    }

    const snapshots = snapshotsData.results;

    return snapshots.map((snapshot: InventorySnapshot) => {
      const detectedChannel = detectUploadChannel(snapshot);

      return {
        ...snapshot,
        detectedChannel
      };
    });
  }, [snapshotsData]);

  const channelUpdateDates = useMemo(() => {
    return getAllChannelUpdateDates(snapshotsWithChannel);
  }, [snapshotsWithChannel]);

  return {
    snapshots: snapshotsWithChannel,
    channelUpdateDates,
    ...rest
  };
};

// 롤백 실행
export const useRollbackInventory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ snapshotId, reason }: { snapshotId: number; reason?: string }) =>
      rollbackToSnapshot(snapshotId, reason),
    onSuccess: () => {
      // 재고 관련 모든 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['inventories'] });
      queryClient.invalidateQueries({ queryKey: ['inventorySnapshots'] });
    },
  });
};