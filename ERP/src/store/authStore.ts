import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
    id: number;
    username: string;
    role: string;
}

interface AuthState {
    user: User | null;
    login: (userData: User) => void;
    logout: () => void;
}

const customSessionStorage = {
    getItem: (name: string) => {
        const value = sessionStorage.getItem(name);
        return value ? JSON.parse(value) : null;
    },
    setItem: (name: string, value: any) => {
        sessionStorage.setItem(name, JSON.stringify(value));
    },
    removeItem: (name: string) => {
        sessionStorage.removeItem(name);
    },
};

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            login: (userData) => set({ user: userData }),
            logout: () => set({ user: null }),
        }),
        {
            name: 'auth-user',
            storage: customSessionStorage,
            partialize: (state) => ({ user: state.user, login: state.login, logout: state.logout }),
        }
    )
);
