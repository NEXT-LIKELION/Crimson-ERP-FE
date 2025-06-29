// src/api/axios.ts
import axios from 'axios';
import { getCookie, clearAuthCookies } from '../utils/cookies';

// .env에서 API 기본 주소 설정 (없을 경우 기본 로컬 주소 사용)
const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || 'http://ec2-13-125-246-38.ap-northeast-2.compute.amazonaws.com';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true, // 쿠키 전송을 위해 필요
});

api.interceptors.request.use((config) => {
    // 로그인/회원가입 요청이면 Authorization 헤더 제거
    if (config.url?.includes('/authentication/login/') || config.url?.includes('/authentication/signup/')) {
        delete config.headers.Authorization;
    } else {
        // 쿠키에서 토큰 가져오기
        const token = getCookie('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

// 응답 인터셉터 추가 (토큰 만료 시 처리)
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            // 토큰이 만료되었거나 유효하지 않음
            clearAuthCookies();
            // localStorage도 정리 (기존 코드와의 호환성)
            localStorage.removeItem('token');
            localStorage.removeItem('refresh');
            localStorage.removeItem('auth-storage');

            // 로그인 페이지로 리다이렉트
            if (window.location.pathname !== '/auth') {
                window.location.href = '/auth';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
export { api };