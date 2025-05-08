import { useMutation } from "@tanstack/react-query";
import { login } from "../../api/auth";

export const useLogin = (onSuccessCallback?: () => void) =>
  useMutation({
    mutationFn: login,
    onSuccess: (res) => {
      const access = res.data.access_token;
      const refresh = res.data.refresh_token;
      localStorage.setItem("token", access);
      localStorage.setItem("refresh", refresh);

      console.log("✅ 로그인 성공");
      if (onSuccessCallback) onSuccessCallback();
    },
    onError: (err: any) => {
      // ❌ alert 제거, 대신 에러는 그대로 상위로 throw됨
      throw err;
    },
  });
