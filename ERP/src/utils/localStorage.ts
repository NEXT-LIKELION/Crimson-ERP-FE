// 기존 범용 localStorage 함수들
export const getLocalStorage = (key: string) => {
  return localStorage.getItem(key);
};
export const removeLocalStorage = (key: string) => {
  return localStorage.removeItem(key);
};
export const setLocalStorage = (key: string, value: string) => {
  return localStorage.setItem(key, value);
};

// 토큰 관리 전용 함수들
const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

// 액세스 토큰 저장
export const setAccessToken = (token: string) => {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
};

// 리프레시 토큰 저장
export const setRefreshToken = (token: string) => {
  localStorage.setItem(REFRESH_TOKEN_KEY, token);
};

// 액세스 토큰 가져오기
export const getAccessToken = (): string | null => {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
};

// 리프레시 토큰 가져오기
export const getRefreshToken = (): string | null => {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

// 액세스 토큰 삭제
export const removeAccessToken = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
};

// 리프레시 토큰 삭제
export const removeRefreshToken = () => {
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

// 모든 인증 토큰 삭제
export const clearAuthTokens = () => {
  removeAccessToken();
  removeRefreshToken();
};

// 토큰 존재 여부 확인
export const hasAccessToken = (): boolean => {
  return getAccessToken() !== null;
};

// 편의 함수: 두 토큰을 한번에 저장
export const setTokens = (accessToken: string, refreshToken: string) => {
  setAccessToken(accessToken);
  setRefreshToken(refreshToken);
};
