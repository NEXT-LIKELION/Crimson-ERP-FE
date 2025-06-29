// src/utils/cookies.ts
// 쿠키 설정 함수
export const setCookie = (name: string, value: string, days?: number) => {
    let expires = '';
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
        expires = `; expires=${date.toUTCString()}`;
    }

    // HTTPS 환경에서만 Secure 플래그 추가 (개발 환경 고려)
    const isSecure = window.location.protocol === 'https:';
    const secureFlag = isSecure ? '; Secure' : '';

    document.cookie = `${name}=${value || ''}${expires}; path=/; SameSite=Strict${secureFlag}`;
};

// 쿠키 가져오기 함수
export const getCookie = (name: string): string | null => {
    const nameEQ = `${name}=`;
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
};

// 쿠키 삭제 함수
export const deleteCookie = (name: string) => {
    const isSecure = window.location.protocol === 'https:';
    const secureFlag = isSecure ? '; Secure' : '';
    document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Strict${secureFlag}`;
};

// 모든 인증 관련 쿠키 삭제
export const clearAuthCookies = () => {
    deleteCookie('accessToken');
    deleteCookie('refreshToken');
};
