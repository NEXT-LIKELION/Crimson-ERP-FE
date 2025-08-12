import { ReactNode, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';

interface AuthProviderProps {
  children: ReactNode;
}

const AuthProvider = ({ children }: AuthProviderProps) => {
  const { logout } = useAuthStore();

  useEffect(() => {
    // 앱 초기화 시 토큰 상태 확인 및 정리
    const initializeAuth = () => {
      // localStorage에 남아있는 구형 토큰들만 정리
      const legacyToken = localStorage.getItem('token');
      const legacyRefresh = localStorage.getItem('refresh');

      if (legacyToken || legacyRefresh) {
        // 구형 토큰이 있다면 정리
        localStorage.removeItem('token');
        localStorage.removeItem('refresh');
        console.log('구형 localStorage 토큰을 정리했습니다.');
      }
    };

    initializeAuth();
  }, [logout]);

  return <>{children}</>;
};

export default AuthProvider;
