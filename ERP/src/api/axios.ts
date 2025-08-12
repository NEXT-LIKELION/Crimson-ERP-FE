// src/api/axios.ts
import axios from 'axios';
import { getAccessToken, clearAuthTokens } from '../utils/localStorage';

// .env에서 API 기본 주소 설정 (없을 경우 기본 로컬 주소 사용)
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  'http://ec2-13-125-246-38.ap-northeast-2.compute.amazonaws.com';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // 쿠키 전송을 위해 필요
});

api.interceptors.request.use((config) => {
  // 로그인/회원가입 요청이면 Authorization 헤더 제거
  if (
    config.url?.includes('/authentication/login/') ||
    config.url?.includes('/authentication/signup/')
  ) {
    delete config.headers.Authorization;
  } else {
    // localStorage에서 토큰 가져오기
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.warn('No access token found in localStorage');
    }
  }

  // FormData인 경우 Content-Type을 제거 (axios가 자동으로 boundary 설정)
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  // 휴가 관련 요청 로깅
  if (config.url?.includes('/hr/vacation')) {
    console.log('휴가 API 요청:', {
      method: config.method,
      url: config.url,
      fullUrl: `${config.baseURL}${config.url}`,
      data: config.data,
      headers: {
        Authorization: config.headers.Authorization ? 'Bearer ***' : 'None',
        'Content-Type': config.headers['Content-Type'],
      },
    });
  }

  return config;
});

// 응답 인터셉터 추가 (토큰 만료 시 처리)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // 토큰이 만료되었거나 유효하지 않음
      clearAuthTokens();
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
