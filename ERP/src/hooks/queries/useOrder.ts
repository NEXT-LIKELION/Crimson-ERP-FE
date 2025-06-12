import { useQuery } from "@tanstack/react-query";
import { fetchOrders } from "../../api/orders";

// 발주 목록을 불러오는 커스텀 훅
export const useOrder = () =>
  useQuery({
    queryKey: ["orders"],       // React Query 캐시 키 (데이터 식별용)
    queryFn: fetchOrders,       // 실제 서버 요청 함수
    staleTime: 1000 * 60 * 3,   // 3분간 fresh 상태 유지 (이후 refetch 가능)
    gcTime: 1000 * 60 * 10,     // 10분 후 unused query는 메모리에서 제거
  });
