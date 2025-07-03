import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { clearAuthCookies } from '../utils/cookies';

interface User {
    id: number;
    username: string;
    role: '대표' | '일반 사용자';
}

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    login: (userData: User) => void;
    logout: () => void;
    setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>()(
    // persist 통해서 로그인 state localStorage에 저장
    persist(
        (set) => ({
            user: null,
            isAuthenticated: false,
            login: (userData) => set({ user: userData, isAuthenticated: true }),
            logout: () => {
                // 쿠키와 localStorage에서 토큰 관련 데이터 삭제
                clearAuthCookies();
                localStorage.removeItem('token');
                localStorage.removeItem('refresh');
                localStorage.removeItem('auth-storage');

                set({ user: null, isAuthenticated: false });
            },
            setUser: (user) => set({ user, isAuthenticated: !!user }),
        }),
        {
            name: 'auth-storage', // Zustand persist 스토리지 키
            partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),

        }
    )
);
