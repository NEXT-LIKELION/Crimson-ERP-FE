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
  meta?: {
    upload_channel?: 'online' | 'offline';
    upload_type?: string;
    upload_reason?: string;
    filename?: string;
    filesize?: number;
    [key: string]: any;
  };
}

/**
 * 두 스냅샷 간 변경된 제품들을 찾는 함수 (필요시 사용)
 * 현재는 meta.upload_channel을 직접 사용하므로 사용하지 않음
 */
export const findChangedProducts = (
  currentItems: SnapshotItem[],
  previousItems: SnapshotItem[]
): SnapshotItem[] => {
  if (!currentItems || !previousItems) return [];

  const changedProducts: SnapshotItem[] = [];
  const previousMap = new Map(previousItems.map((item) => [item.variant_code, item]));

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
 * 스냅샷에서 채널 정보를 추출 (백엔드 meta.upload_channel 우선 사용)
 */
export const detectUploadChannel = (currentSnapshot: Snapshot): 'online' | 'offline' | null => {
  // 1️⃣ 최우선: 백엔드에서 제공하는 명확한 채널 정보
  if (currentSnapshot.meta?.upload_channel) {
    return currentSnapshot.meta.upload_channel;
  }

  // 2️⃣ Fallback: reason 필드에서 키워드 검색 (기존 데이터 호환성)
  const reason = currentSnapshot.reason || '';

  if (reason.includes('온라인') || reason.includes('online')) {
    return 'online';
  }

  if (reason.includes('오프라인') || reason.includes('offline')) {
    return 'offline';
  }

  // 3️⃣ 알 수 없는 경우
  return null;
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

  const filtered = snapshots.filter((snap) => snap.detectedChannel === channel);
  return filtered[0]?.created_at || null;
};

/**
 * 모든 채널의 최신 업데이트 날짜를 반환 (최적화된 버전)
 */
export const getAllChannelUpdateDates = (
  snapshots: (Snapshot & { detectedChannel?: 'online' | 'offline' | null })[]
): {
  onlineDate: string | null;
  offlineDate: string | null;
  allDate: string | null;
} => {
  if (!snapshots || snapshots.length === 0) {
    return {
      onlineDate: null,
      offlineDate: null,
      allDate: null,
    };
  }

  let onlineDate: string | null = null;
  let offlineDate: string | null = null;
  const allDate = snapshots[0]?.created_at || null;

  // 한 번의 순회로 온라인/오프라인 최신 날짜 찾기
  for (const snapshot of snapshots) {
    if (snapshot.detectedChannel === 'online' && !onlineDate) {
      onlineDate = snapshot.created_at;
    }
    if (snapshot.detectedChannel === 'offline' && !offlineDate) {
      offlineDate = snapshot.created_at;
    }

    // 둘 다 찾았으면 조기 종료
    if (onlineDate && offlineDate) {
      break;
    }
  }

  return {
    onlineDate,
    offlineDate,
    allDate,
  };
};

/**
 * 스냅샷이 유효한 업로드 스냅샷인지 확인
 */
export const isValidUploadSnapshot = (snapshot: Snapshot): boolean => {
  // POS 데이터 업로드 관련 스냅샷만 고려
  const reason = snapshot.reason || '';
  const hasUploadKeyword = reason.includes('업로드') || reason.includes('POS');
  const hasChannelInfo = !!snapshot.meta?.upload_channel;

  return hasUploadKeyword || hasChannelInfo;
};
