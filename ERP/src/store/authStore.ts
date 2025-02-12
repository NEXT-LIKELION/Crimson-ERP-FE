import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
    id: number;
    username: string;
    role: "대표" | "일반 사용자";
}

interface AuthState {
    user: User | null;
    login: (userData: User) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()( // persist 통해서 로그인 state localStorage에 저장
    persist(
        (set) => ({
            user: null,
            login: (userData) => set({ user: userData }),
            logout: () => set({ user: null }),
        }),
        { name: "auth-storage" } // Zustand persist 스토리지 키
    )
);
