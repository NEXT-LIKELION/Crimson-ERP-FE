import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLogin } from "../../hooks/queries/useLogin";

const AuthPage = () => {
    // 로그인 폼 상태
    const [loginId, setLoginId] = useState("");
    const [loginPassword, setLoginPassword] = useState("");

    const [errorMessage, setErrorMessage] = useState("");
    const navigate = useNavigate();

    const loginMutation = useLogin(() => {
        alert("로그인 성공!");

        // useLogin 훅에서 이미 사용자 정보를 저장했으므로 바로 이동
        navigate("/");
    });

    const handleLogin = () => {
        setErrorMessage(""); // 초기화

        loginMutation.mutate(
            { username: loginId, password: loginPassword },
            {
                onError: (err: any) => {
                    const msg = err?.response?.data?.message ?? "로그인 실패";
                    setErrorMessage(msg);
                },
            }
        );
    };

    // 키보드 접근성 처리
    const handleLoginKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && loginId && loginPassword && !loginMutation.isPending) {
            handleLogin();
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                {/* 헤더 섹션 */}
                <div className="bg-gradient-to-r from-rose-800 to-rose-900 px-8 py-6 text-center">
                    <img
                        src="/images/crimsonlogo.png"
                        alt="크림슨스토어 로고"
                        className="w-24 h-24 mx-auto mb-4 object-cover rounded-full bg-white p-0.5"
                    />
                    <h1 className="text-white text-xl font-bold">크림슨스토어 ERP</h1>
                </div>

                <div className="p-8">
                    {/* 로그인 폼 */}
                    <div className="space-y-4 animate-in fade-in duration-300">
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="loginId" className="block text-sm font-medium text-gray-700 mb-2">
                                    아이디
                                </label>
                                <input
                                    id="loginId"
                                    type="text"
                                    placeholder="아이디를 입력하세요"
                                    value={loginId}
                                    onChange={(e) => setLoginId(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-colors bg-gray-50 focus:bg-white text-gray-900 placeholder-gray-500"
                                />
                            </div>
                            <div>
                                <label htmlFor="loginPassword" className="block text-sm font-medium text-gray-700 mb-2">
                                    비밀번호
                                </label>
                                <input
                                    id="loginPassword"
                                    type="password"
                                    placeholder="비밀번호를 입력하세요"
                                    value={loginPassword}
                                    onChange={(e) => setLoginPassword(e.target.value)}
                                    onKeyPress={handleLoginKeyPress}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-colors bg-gray-50 focus:bg-white text-gray-900 placeholder-gray-500"
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleLogin}
                            disabled={loginMutation.isPending || !loginId || !loginPassword}
                            className="w-full py-3 mt-6 bg-gradient-to-r from-rose-800 to-rose-900 text-white font-medium rounded-lg hover:from-rose-900 hover:to-rose-950 focus:ring-4 focus:ring-rose-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                        >
                            {loginMutation.isPending ? (
                                <div className="flex items-center justify-center">
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                    로그인 중...
                                </div>
                            ) : (
                                "로그인"
                            )}
                        </button>
                    </div>

                    {/* 에러 메시지 */}
                    {errorMessage && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg animate-in fade-in duration-200">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path
                                            fillRule="evenodd"
                                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-red-800">{errorMessage}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* 푸터 */}
            <div className="mt-8 text-center">
                <p className="text-sm text-gray-500">© 2025 크림슨스토어. All Rights Reserved.</p>
            </div>
        </div>
    );
};

export default AuthPage;
