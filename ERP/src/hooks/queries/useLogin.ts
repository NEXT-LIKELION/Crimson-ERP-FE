import { useMutation } from '@tanstack/react-query';
import { login, getCurrentUser } from '../../api/auth';
import { setCookie } from '../../utils/cookies';
import { useAuthStore } from '../../store/authStore';

export const useLogin = (onSuccessCallback?: (userData: any) => void) =>
    useMutation({
        mutationFn: login,
        onSuccess: async (res) => {
            const access = res.data.access_token;
            const refresh = res.data.refresh_token;
            const user = res.data.user;

            // 쿠키에 토큰 저장 (7일 만료)
            setCookie('accessToken', access, 7);
            setCookie('refreshToken', refresh, 30); // refresh 토큰은 더 길게

            // 토큰 저장 후 현재 사용자 정보 가져오기
            try {
                const userResponse = await getCurrentUser();
                const userData = userResponse.data;

                console.log('✅ 로그인 성공, 사용자 정보:', userData);

                if (onSuccessCallback) {
                    onSuccessCallback(userData);
                }
            } catch (error) {
                console.error('사용자 정보 가져오기 실패:', error);
                // 기본값으로 폴백
                if (onSuccessCallback) {
                    onSuccessCallback({
                        id: 1,
                        username: '사용자',
                        role: '일반 사용자',
                    });
                }
            }
        },
        onError: (err: any) => {
            throw err;
        },
    });
