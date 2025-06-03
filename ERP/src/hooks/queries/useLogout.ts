import { useMutation } from "@tanstack/react-query";
import axios from "../../api/axios";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

export const useLogout = () => {
  const navigate = useNavigate();
  const logoutStore = useAuthStore((state) => state.logout);

  return useMutation({
    mutationFn: () => axios.post("/api/v1/authentication/logout/"),
    onSuccess: () => {
      logoutStore();
      navigate("/auth");
    },
    onError: (err) => {
      console.error("로그아웃 실패:", err);
      logoutStore(); // 실패해도 상태 초기화
      navigate("/auth");
    },
  });
};