// 스냅샷 분석을 통한 채널 추론 유틸리티

interface SnapshotItem {
  variant_code: string;
  stock: number;
  price: number;
  order_count?: number;
  return_count?: number;
  channels?: string[];
}

interface Snapshot {
  id: number;
  created_at: string;
  reason: string;
  items?: SnapshotItem[];
}

/**
 * 두 스냅샷 간 변경된 제품들을 찾는 함수
 */
export const findChangedProducts = (
  currentItems: SnapshotItem[],
  previousItems: SnapshotItem[]
): SnapshotItem[] => {
  if (!currentItems || !previousItems) return [];

  const changedProducts: SnapshotItem[] = [];
  const previousMap = new Map(
    previousItems.map(item => [item.variant_code, item])
  );

  for (const currentItem of currentItems) {
    const previousItem = previousMap.get(currentItem.variant_code);

    if (!previousItem) {
      // 새로 추가된 제품
      changedProducts.push(currentItem);
      continue;
    }

    // 재고, 가격, 주문수량, 환불수량 중 하나라도 변경되었으면 변경된 것으로 간주
    const hasStockChange = currentItem.stock !== previousItem.stock;
    const hasPriceChange = currentItem.price !== previousItem.price;
    const hasOrderChange = (currentItem.order_count || 0) !== (previousItem.order_count || 0);
    const hasReturnChange = (currentItem.return_count || 0) !== (previousItem.return_count || 0);

    if (hasStockChange || hasPriceChange || hasOrderChange || hasReturnChange) {
      changedProducts.push(currentItem);
    }
  }

  return changedProducts;
};

/**
 * 스냅샷 reason을 분석하여 온라인/오프라인 중 어떤 채널이 업데이트되었는지 추론
 */
export const detectUploadChannel = (
  currentSnapshot: Snapshot,
  previousSnapshot: Snapshot
): 'online' | 'offline' | null => {
  const reason = currentSnapshot.reason || '';

  // reason 필드에서 키워드 검색
  if (reason.includes('온라인') || reason.includes('online')) {
    return 'online';
  }

  if (reason.includes('오프라인') || reason.includes('offline')) {
    return 'offline';
  }

  // POS 데이터 업로드인 경우 (백엔드에서 reason을 변경하지 않았으므로)
  if (reason.includes('POS') || reason.includes('업로드')) {
    // 임시로 온라인으로 간주 (실제로는 더 정교한 로직 필요)
    return 'online';
  }

  // 기존 items 기반 분석 로직 (items가 있는 경우)
  const currentItems = currentSnapshot.items || [];
  const previousItems = previousSnapshot.items || [];

  if (currentItems.length === 0 || previousItems.length === 0) {
    return null;
  }

  const changedProducts = findChangedProducts(currentItems, previousItems);

  if (changedProducts.length === 0) return null;

  // 변경된 제품들의 채널 분포 분석
  let onlineCount = 0;
  let offlineCount = 0;

  for (const product of changedProducts) {
    const channels = product.channels || [];

    if (channels.includes('online')) {
      onlineCount++;
    }
    if (channels.includes('offline')) {
      offlineCount++;
    }
  }

  // POS는 무조건 하나의 채널만 업데이트하므로 더 많은 쪽으로 판단
  if (onlineCount === 0 && offlineCount === 0) return null;

  return onlineCount >= offlineCount ? 'online' : 'offline';
};

/**
 * 채널별 최신 업데이트 날짜를 가져오는 함수
 */
export const getLatestUpdateByChannel = (
  snapshots: (Snapshot & { detectedChannel?: 'online' | 'offline' | null })[],
  channel: 'online' | 'offline' | 'all'
): string | null => {
  if (!snapshots || snapshots.length === 0) return null;

  if (channel === 'all') {
    return snapshots[0]?.created_at || null;
  }

  const filtered = snapshots.filter(snap => snap.detectedChannel === channel);
  return filtered[0]?.created_at || null;
};

/**
 * 모든 채널의 최신 업데이트 날짜를 반환
 */
export const getAllChannelUpdateDates = (
  snapshots: (Snapshot & { detectedChannel?: 'online' | 'offline' | null })[]
): {
  onlineDate: string | null;
  offlineDate: string | null;
  allDate: string | null;
} => {
  return {
    onlineDate: getLatestUpdateByChannel(snapshots, 'online'),
    offlineDate: getLatestUpdateByChannel(snapshots, 'offline'),
    allDate: getLatestUpdateByChannel(snapshots, 'all'),
  };
};