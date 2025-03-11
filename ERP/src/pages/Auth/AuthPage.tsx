// src/pages/Auth/AuthPage.tsx
import React from "react";
import { useAuthStore } from "../../store/authStore";

const AuthPage = () => {
    const login = useAuthStore((state) => state.login);

    const handleLogin = () => {
        // 원하는 유저 정보를 임의로 넘겨줄 수 있음
        login({
            id: 1,
            username: "testUser",
            role: "대표",
        });
    };

    return (
        <div>
            <h1>Auth Page</h1>
            <button
                onClick={handleLogin}
                className="px-4 py-2 mt-4 bg-blue-500 text-white"
            >
                로그인
            </button>
        </div>
    );
};

export default AuthPage;
