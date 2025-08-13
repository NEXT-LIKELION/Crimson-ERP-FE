import { useMutation } from '@tanstack/react-query';
import { logout } from '../../api/auth';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { clearAuthTokens } from '../../utils/localStorage';

export const useLogout = () => {
  const navigate = useNavigate();
  const logoutStore = useAuthStore((state) => state.logout);

  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      // 쿠키와 localStorage 모두 삭제
      clearAuthTokens();

      logoutStore();
      navigate('/auth');
    },
    onError: (err: Error) => {
      console.error('로그아웃 실패:', err);
      // axios 에러인 경우에만 response 정보 로그
      if ('response' in err && 'config' in err) {
        const axiosError = err as ApiError & { config?: { url?: string } };
        console.error('로그아웃 응답 데이터:', axiosError.response?.data);
        console.error('로그아웃 상태 코드:', axiosError.response?.status);
        console.error('로그아웃 요청 URL:', axiosError.config?.url);
      }

      clearAuthTokens();
      localStorage.removeItem('auth-storage');

      logoutStore();
      navigate('/auth');
    },
  });
};
