import { useMutation } from '@tanstack/react-query';
import { login } from '../../api/auth';
import { setCookie } from '../../utils/cookies';
import { useAuthStore } from '../../store/authStore';

export interface User {
  id?: number;
  username: string;
  role: string;
  first_name?: string;
  email?: string;
  contact?: string;
  status?: string;
}

export const useLogin = (onSuccessCallback?: (userData: User) => void) =>
  useMutation({
    mutationFn: login,
    onSuccess: (res) => {
      const access = res.data.access_token;
      const refresh = res.data.refresh_token;
      const user = res.data.user as User;

      // 쿠키에 토큰 저장 (7일 만료)
      setCookie('accessToken', access, 7);
      setCookie('refreshToken', refresh, 30); // refresh 토큰은 더 길게

      // zustand에 user 정보 저장
      useAuthStore.getState().setUser(user);

      if (onSuccessCallback) {
        onSuccessCallback(user);
      }
    },
    onError: (err: unknown) => {
      throw err;
    },
  });
