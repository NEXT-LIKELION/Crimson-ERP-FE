import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { clearAuthTokens } from '../utils/localStorage';

interface User {
  id?: number;
  username: string;
  role: 'MANAGER' | 'STAFF' | 'INTERN'; // 정확한 enum 타입
  first_name?: string;
  email?: string;
  contact?: string;
  status?: string;
  allowed_tabs?: string[];
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (userData: User) => void;
  logout: () => void;
  setUser: (user: User | null) => void;
  updateUser: (userData: Partial<User>) => void; // 사용자 정보 부분 업데이트
}

export const useAuthStore = create<AuthState>()(
  // persist 통해서 로그인 state localStorage에 저장
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: () => {}, // 로그인은 토큰만 저장, user는 setUser로만 세팅
      logout: () => {
        // localStorage에서 토큰 관련 데이터 삭제
        clearAuthTokens();
        localStorage.removeItem('auth-storage');

        set({ user: null, isAuthenticated: false });
      },
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      updateUser: (userData) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        })),
    }),
    {
      name: 'auth-storage', // Zustand persist 스토리지 키
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
