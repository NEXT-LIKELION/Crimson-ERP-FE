import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateOrderStatus } from "../../api/orders";

// 발주 상태 변경 훅
export const useOrderStatus = (onSuccessCallback?: () => void) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orderId,
      status,
    }: {
      orderId: number;
      status: "대기" | "발주완료" | "입고완료"; // 서버에서 허용하는 상태
    }) => updateOrderStatus(orderId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] }); // 전체 목록 갱신

      if (onSuccessCallback) {
        onSuccessCallback();
      }
    },
    onError: (err) => {
      console.error("상태 변경 실패:", err);
    },
  });
};
