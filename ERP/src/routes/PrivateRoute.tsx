// src/routes/PrivateRoute.tsx
import { ReactNode, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useCurrentUser } from '../hooks/queries/useAuth';
import { getCookie } from '../utils/cookies';

interface PrivateRouteProps {
    children: ReactNode;
}

const PrivateRoute = ({ children }: PrivateRouteProps) => {
    const { user, setUser } = useAuthStore();
    const hasToken = !!getCookie('accessToken');

    // 항상 API 호출하지만 토큰 없으면 자동으로 실패함
    const { data: currentUserData, isLoading, isError } = useCurrentUser();

    useEffect(() => {
        if (currentUserData?.data) {
            // 서버에서 받은 사용자 정보로 상태 업데이트
            const userData = {
                id: currentUserData.data.id,
                username: currentUserData.data.username,
                role: (currentUserData.data.role === 'MANAGER' ? '대표' : '일반 사용자') as '대표' | '일반 사용자',
            };
            setUser(userData);
        }
    }, [currentUserData, setUser]);

    // 토큰이 없으면 로그인 페이지로 리다이렉트
    if (!hasToken) {
        console.log('토큰이 없어 로그인 페이지로 이동합니다.');
        return <Navigate to="/auth" replace />;
    }

    // 기존 사용자 정보가 있으면 바로 렌더링
    if (user) {
        return <>{children}</>;
    }

    // 토큰은 있지만 사용자 정보 로딩 중 (기존 사용자 정보가 없는 경우만)
    if (hasToken && !user && isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="flex flex-col items-center">
                    <div className="w-8 h-8 border-4 border-rose-200 border-t-rose-600 rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-600 font-medium">인증 확인 중...</p>
                </div>
            </div>
        );
    }

    // 토큰은 있지만 사용자 정보를 가져올 수 없는 경우 (API 에러는 axios 인터셉터에서 처리됨)
    if (hasToken && !user && !isLoading && isError) {
        console.log('사용자 정보를 가져올 수 없어 로그인 페이지로 이동합니다.');
        return <Navigate to="/auth" replace />;
    }

    return <>{children}</>;
};

export default PrivateRoute;
