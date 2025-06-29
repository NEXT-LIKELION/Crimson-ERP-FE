import { useMutation } from '@tanstack/react-query';
import { login } from '../../api/auth';
import { setCookie } from '../../utils/cookies';

export const useLogin = (onSuccessCallback?: () => void) =>
    useMutation({
        mutationFn: login,
        onSuccess: (res) => {
            const access = res.data.access_token;
            const refresh = res.data.refresh_token;

            // 쿠키에 토큰 저장 (7일 만료)
            setCookie('accessToken', access, 7);
            setCookie('refreshToken', refresh, 30); // refresh 토큰은 더 길게

            // 기존 localStorage 제거 (보안)
            localStorage.removeItem('token');
            localStorage.removeItem('refresh');

            console.log('✅ 로그인 성공');
            if (onSuccessCallback) onSuccessCallback();
        },
        onError: (err: any) => {
            // ❌ alert 제거, 대신 에러는 그대로 상위로 throw됨
            throw err;
        },
    });
