import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthPage = () => {
    const [id, setId] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [errorMessage, setErrorMessage] = useState<string>('');
    const navigate = useNavigate();

    const handleLogin = async () => {
        try {
            // 더미 데이터 가져오기
            const response = await fetch('/data/dummy.json');
            const data = await response.json();
            const users = data.auth_user;

            // 유효성 검사
            const user = users.find((user: any) =>
                (user.username === id || user.email === id) && user.password === password
            );

            if (!user) {
                const userExists = users.some((user: any) => user.username === id || user.email === id);
                if (!userExists) {
                    setErrorMessage("존재하지 않는 이메일/사번입니다.");
                } else {
                    setErrorMessage("비밀번호가 잘못되었습니다.");
                }
                return;
            }

            // 로그인 성공 시
            alert(`로그인 성공! 환영합니다, ${user.username}`);
            setErrorMessage('');
            navigate('/');
        } catch (error) {
            setErrorMessage("로그인 중 문제가 발생했습니다.");
            console.error("로그인 오류:", error);
        }
    };

    return (
        <div className="flex flex-col justify-center items-center">
            <div className="w-108.5 h-115 bg-white shadow-lg p-8 flex flex-col items-center justify-center mt-20">
                <img src="/images/crimsonlogo.png" alt="로고" className="flex" />
                <div className="flex flex-col items-center justify-center space-y-4">
                    <input
                        type="text"
                        placeholder="이메일/사번"
                        value={id}
                        onChange={(e) => setId(e.target.value)}
                        className="h-9 w-83.5 rounded-md text-sm font-normal pl-3 pr-10 pt-2.5 pb-2 border border-gray-300 focus:outline-none font-inter bg-white text-gray-700 focus:ring-2 focus:ring-indigo-600"
                    />
                    <input
                        type="password"
                        placeholder="비밀번호"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-9 w-83.5 rounded-md text-sm font-normal pl-3 pr-10 pt-2.5 pb-2 border border-gray-300 focus:outline-none font-inter bg-white text-gray-700 focus:ring-2 focus:ring-indigo-600"
                    />
                </div>
                <button
                    onClick={handleLogin}
                    className="w-83.5 h-12 mt-4 bg-rose-800 text-white"
                >
                    로그인
                </button>
            </div>
            {errorMessage && (
                    <div className="text-red-800 text-sm mt-2">
                        {errorMessage}
                    </div>
                )}
        </div>
    );
};

export default AuthPage;
