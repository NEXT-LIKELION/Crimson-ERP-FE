import { useMutation } from '@tanstack/react-query';
import { login } from '../../api/auth';
import { setTokens } from '../../utils/localStorage';
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

      // localStorage에 토큰 저장
      setTokens(access, refresh);

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
