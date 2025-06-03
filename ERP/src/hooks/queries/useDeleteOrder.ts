import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteOrder } from "../../api/orders";

// 발주 삭제 훅
export const useDeleteOrder = (onSuccessCallback?: () => void) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteOrder, // 삭제 요청
    onSuccess: () => {
      // 발주 목록을 다시 불러오도록 invalidate
      queryClient.invalidateQueries({ queryKey: ["orders"] });

      if (onSuccessCallback) {
        onSuccessCallback();
      }
    },
    onError: (err) => {
      console.error("발주 삭제 실패:", err);
    },
  });
};
