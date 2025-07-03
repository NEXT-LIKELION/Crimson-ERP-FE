import { useMutation } from '@tanstack/react-query';
import { signup } from '../../api/auth';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { setCookie } from '../../utils/cookies';

// 영어 에러 메시지 → 한국어 매핑
const errorTranslations: Record<string, string> = {
    'A user with that username already exists.': '이미 존재하는 아이디입니다.',
    'A user is already registered with this e-mail address.': '이미 등록된 이메일입니다.',
    'This field may not be blank.': '이 항목은 필수입니다.',
    'Enter a valid email address.': '유효한 이메일 주소를 입력하세요.',
    'This password is too short. It must contain at least 8 characters.': '비밀번호는 8자 이상이어야 합니다.',
    'This password is too common.': '너무 쉬운 비밀번호입니다.',
    'This password is entirely numeric.': '비밀번호에 숫자만 사용할 수 없습니다.',
    'Passwords do not match.': '비밀번호가 일치하지 않습니다.',
    'Invalid password.': '잘못된 비밀번호입니다.',
    'Invalid credentials': '아이디 또는 비밀번호가 올바르지 않습니다.',
    'Ensure this field has at least 8 characters.': '8자 이상 입력해야 합니다.',
    'Ensure this field has at most 150 characters.': '150자 이하로 입력해야 합니다.',
    'This field must be unique.': '이미 사용 중인 값입니다.',
    // 필요시 추가
};

function translateErrorMessage(msg: string) {
    return msg
        .split(' / ')
        .map((part) => {
            const [field, ...rest] = part.split(':');
            const content = rest.join(':').trim();
            const translated = errorTranslations[content] || content;
            // 필드명 없이 번역된 메시지만 반환
            return translated;
        })
        .join(' / ');
}

export const useSignup = (onSuccess?: () => void, onError?: (msg: string) => void) => {
    const navigate = useNavigate();
    const loginStore = useAuthStore((state) => state.login);

    return useMutation({
        mutationFn: signup,
        onSuccess: (response) => {
            // 토큰 저장 (쿠키 사용)
            const { access_token, refresh_token } = response.data;
            setCookie('accessToken', access_token, 7);
            setCookie('refreshToken', refresh_token, 30);


            // 사용자 정보 저장 (기본값으로 설정)
            const userData = {
                id: 1,
                username: '새 사용자',
                role: '일반 사용자' as const,
            };
            loginStore(userData);

            // 성공 콜백 실행
            if (onSuccess) {
                onSuccess();
            }

            // 대시보드로 리다이렉트
            navigate('/');
        },
        onError: (error: any) => {
            let msg = '회원가입 실패';
            if (error.response?.data) {
                const data = error.response.data;
                if (typeof data === 'string') {
                    msg = data;
                } else if (data.message) {
                    msg = data.message;
                } else if (data.detail) {
                    msg = data.detail;
                } else {
                    const fieldErrors = [];
                    for (const key in data) {
                        if (Array.isArray(data[key])) {
                            fieldErrors.push(`${key}: ${data[key].join(' ')}`);
                        } else if (typeof data[key] === 'string') {
                            fieldErrors.push(`${key}: ${data[key]}`);
                        }
                    }
                    if (fieldErrors.length > 0) {
                        msg = fieldErrors.join(' / ');
                    } else {
                        msg = JSON.stringify(data);
                    }
                }
            }
            const translatedMsg = translateErrorMessage(msg);
            console.log('실제 msg:', msg);
            if (onError) onError(translatedMsg);
            // 필요시 콜백 등 추가
        },
    });
};
