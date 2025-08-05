import { create } from "zustand";
import { persist } from "zustand/middleware";
import { clearAuthCookies } from "../utils/cookies";

interface User {
    id?: number;
    username: string;
    role: string; // 영문 role(MANAGER/STAFF/INTERN)
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
}

export const useAuthStore = create<AuthState>()(
    // persist 통해서 로그인 state localStorage에 저장
    persist(
        (set) => ({
            user: null,
            isAuthenticated: false,
            login: () => {}, // 로그인은 토큰만 저장, user는 setUser로만 세팅
            logout: () => {
                // 쿠키와 localStorage에서 토큰 관련 데이터 삭제
                clearAuthCookies();
                localStorage.removeItem("auth-storage");

                set({ user: null, isAuthenticated: false });
            },
            setUser: (user) => set({ user, isAuthenticated: !!user }),
        }),
        {
            name: "auth-storage", // Zustand persist 스토리지 키
            partialize: (state) => ({
                user: state.user,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
);
