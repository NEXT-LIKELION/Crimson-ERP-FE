import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createOrder } from "../../api/orders";

// 발주 생성 훅
export const useCreateOrder = (onSuccessCallback?: () => void) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createOrder, // 발주 생성 요청 함수
    onSuccess: () => {
      // 기존 발주 목록 invalidate → refetch 유도
      queryClient.invalidateQueries({ queryKey: ["orders"] });

      if (onSuccessCallback) {
        onSuccessCallback();
      }
    },
    onError: (err) => {
      console.error("발주 생성 실패:", err);
    },
  });
};
