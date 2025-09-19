import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchInventorySnapshots,
  fetchInventorySnapshot,
  rollbackToSnapshot
} from '../../api/inventory';

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