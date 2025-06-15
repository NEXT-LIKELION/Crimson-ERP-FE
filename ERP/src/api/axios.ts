// src/api/axios.ts
import axios from 'axios';

// .env에서 API 기본 주소 설정 (없을 경우 기본 로컬 주소 사용)
const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || 'http://ec2-13-125-246-38.ap-northeast-2.compute.amazonaws.com';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true, // 필요한 경우
});

api.interceptors.request.use((config) => {
    // 로그인/회원가입 요청이면 Authorization 헤더 제거
    if (
        config.url?.includes('/api/v1/authentication/login/') ||
        config.url?.includes('/api/v1/authentication/signup/')
    ) {
        delete config.headers.Authorization;
    } else {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

export default api;
export { api };
