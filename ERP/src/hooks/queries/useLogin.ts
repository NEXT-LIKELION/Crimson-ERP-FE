import { useMutation } from '@tanstack/react-query';
import { login } from '../../api/auth';
import { setCookie } from '../../utils/cookies';

export const useLogin = (onSuccessCallback?: () => void) =>
    useMutation({
        mutationFn: login,
        onSuccess: (res) => {
            const access = res.data.access_token;
            const refresh = res.data.refresh_token;
            setCookie('accessToken', access, 1); // 1일 유효
            setCookie('refreshToken', refresh, 7); // 7일 유효
            if (onSuccessCallback) onSuccessCallback();
        },
        onError: (err: any) => {
            // ❌ alert 제거, 대신 에러는 그대로 상위로 throw됨
            throw err;
        },
    });
