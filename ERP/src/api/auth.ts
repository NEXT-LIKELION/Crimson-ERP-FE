import { api } from './axios';

// 로그인
export const login = (payload: { username: string; password: string }) => api.post('/authentication/login/', payload);

// 회원가입 (full_name, contact 등 추가 필드 허용)
export const signup = (payload: {
    username: string;
    password: string;
    email?: string;
    full_name?: string;
    contact?: string;
}) => api.post('/authentication/signup/', payload);

// 토큰 유효성 검증
export const verifyToken = () => api.get('/authentication/verify/');

// 현재 사용자 정보 가져오기
export const getCurrentUser = () => api.get('/authentication/me/');

// 로그아웃
export const logout = () => {
    // 쿠키에서 refresh 토큰 가져오기
    const { getCookie } = require('../utils/cookies');
    const refreshToken = getCookie('refreshToken') || localStorage.getItem('refresh');

    if (!refreshToken) {
        // refresh 토큰이 없는 경우 Promise.reject로 에러 반환
        return Promise.reject(new Error('No refresh token found'));
    }

    return api.post('/authentication/logout/', {
        refresh_token: refreshToken,
    });
};
