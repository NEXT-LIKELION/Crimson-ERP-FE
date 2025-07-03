import { api } from './axios';

// 로그인
export const login = (payload: { username: string; password: string }) => api.post('/authentication/login/', payload);

// 회원가입
export const signup = (payload: { username: string; password: string; email?: string }) =>
    api.post('/authentication/signup/', payload);

// 로그아웃
export const logout = () => {
    return api.post('/authentication/logout/');
};
