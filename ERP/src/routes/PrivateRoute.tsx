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

    // /authentication/me/ API 호출
    const { data: currentUserData, isLoading, isError } = useCurrentUser();

    useEffect(() => {
        if (currentUserData?.data) {
            setUser(currentUserData.data);
        }
    }, [currentUserData, setUser]);

    if (!hasToken) {
        console.log('토큰이 없어 로그인 페이지로 이동합니다.');
        return <Navigate to="/auth" replace />;
    }

    if (user) {
        return <>{children}</>;
    }

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

    if (hasToken && !user && !isLoading && isError) {
        console.log('사용자 정보를 가져올 수 없어 로그인 페이지로 이동합니다.');
        return <Navigate to="/auth" replace />;
    }

    return <>{children}</>;
};

export default PrivateRoute;
