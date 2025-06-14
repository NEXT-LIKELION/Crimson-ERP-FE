import { useMutation } from "@tanstack/react-query";
import { signup } from "../../api/auth";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

export const useSignup = (onSuccess?: () => void) => {
  const navigate = useNavigate();
  const loginStore = useAuthStore((state) => state.login);

  return useMutation({
    mutationFn: signup,
    onSuccess: (response) => {
      // 토큰 저장
      const { access_token, refresh_token } = response.data;
      localStorage.setItem("token", access_token);
      localStorage.setItem("refresh", refresh_token);
      
      // 사용자 정보 저장 (기본값으로 설정)
      const userData = {
        id: 1,
        username: "새 사용자",
        role: "일반 사용자" as const,
      };
      loginStore(userData);
      
      // 성공 콜백 실행
      if (onSuccess) {
        onSuccess();
      }
      
      // 대시보드로 리다이렉트
      navigate("/");
    },
    onError: (error) => {
      console.error("회원가입 실패:", error);
    },
  });
};