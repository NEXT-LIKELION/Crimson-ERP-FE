import { fetchVariantDetail } from '../api/inventory';
import { fetchSuppliers } from '../api/supplier';

const normalize = (value: string): string => (value || '').trim().toLowerCase();

export interface MergePrecheckResult {
  duplicates: Array<{ id: number; name: string }>;
}

/**
 * 병합 전 타깃/소스 간 공급업체 중복을 사전 검출한다.
 */
export async function precheckMergeConflicts(
  targetCode: string,
  sourceCodes: string[]
): Promise<MergePrecheckResult> {
  const requests = [
    fetchVariantDetail(targetCode),
    ...sourceCodes.map((c) => fetchVariantDetail(c)),
  ];
  const responses = await Promise.all(requests);

  const target = responses[0].data;
  const sources = responses.slice(1).map((r) => r.data);

  // 1) 전체 공급업체 목록을 불러와 id<->name 매핑 생성
  const supplierListRes = await fetchSuppliers();
  const suppliers: Array<{ id: number; name: string }> = supplierListRes.data || [];
  const nameToId = new Map<string, number>();
  const idToName = new Map<number, string>();
  suppliers.forEach((s) => {
    const key = normalize(String(s?.name));
    if (!nameToId.has(key)) nameToId.set(key, s.id);
    if (!idToName.has(s.id)) idToName.set(s.id, s.name);
  });

  // 2) target/sources의 공급업체를 ID 기반 집합으로 변환
  interface SupplierInfo {
    name: string;
  }

  interface VariantData {
    suppliers?: SupplierInfo[];
  }

  const targetIds = new Set(
    (target?.suppliers || [])
      .map((s: SupplierInfo) => nameToId.get(normalize(String(s?.name))))
      .filter((id: number | undefined): id is number => typeof id === 'number')
  );

  const sourceIds = new Set(
    sources
      .flatMap((v: VariantData) =>
        (v?.suppliers || []).map((s: SupplierInfo) => nameToId.get(normalize(String(s?.name))))
      )
      .filter((id: number | undefined): id is number => typeof id === 'number')
  );

  // 3) 교집합(중복) 계산 → {id, name} 배열 반환
  const duplicates: Array<{ id: number; name: string }> = Array.from(sourceIds)
    .filter((id) => targetIds.has(id))
    .map((id) => ({ id, name: idToName.get(id) || String(id) }));

  return { duplicates };
}
