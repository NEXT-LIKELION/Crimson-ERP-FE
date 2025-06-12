import { useQuery } from "@tanstack/react-query";
import { fetchOrderById } from "../../api/orders";

// 특정 발주 조회 훅
export const useOrderById = (orderId: number) =>
  useQuery({
    queryKey: ["order", orderId], // 개별 발주 식별용 캐시 키
    queryFn: () => fetchOrderById(orderId), // 서버 요청
    enabled: !!orderId, // orderId가 있을 때만 요청 수행
    staleTime: 1000 * 60, // 1분간 fresh
  });
