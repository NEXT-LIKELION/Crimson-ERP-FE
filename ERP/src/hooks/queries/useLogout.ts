import { useMutation } from '@tanstack/react-query';
import { logout } from '../../api/auth';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { clearAuthCookies } from '../../utils/cookies';

export const useLogout = () => {
    const navigate = useNavigate();
    const logoutStore = useAuthStore((state) => state.logout);

    return useMutation({
        mutationFn: logout,
        onSuccess: () => {
            // 쿠키와 localStorage 모두 삭제
            clearAuthCookies();
            localStorage.removeItem('token');
            localStorage.removeItem('refresh');
            localStorage.removeItem('auth-storage');

            logoutStore();
            navigate('/auth');
        },
        onError: (err: any) => {
            console.error('로그아웃 실패:', err);
            console.error('로그아웃 응답 데이터:', err.response?.data);
            console.error('로그아웃 상태 코드:', err.response?.status);
            console.error('로그아웃 요청 URL:', err.config?.url);

            // 실패해도 모든 토큰 삭제 및 상태 초기화
            clearAuthCookies();
            localStorage.removeItem('token');
            localStorage.removeItem('refresh');
            localStorage.removeItem('auth-storage');

            logoutStore();
            navigate('/auth');
        },
    });
};
