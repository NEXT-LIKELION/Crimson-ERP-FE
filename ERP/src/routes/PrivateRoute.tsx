// src/routes/PrivateRoute.tsx
import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { getCookie } from '../utils/cookies';

interface PrivateRouteProps {
  children: ReactNode;
}

const PrivateRoute = ({ children }: PrivateRouteProps) => {
  const hasToken = !!getCookie('accessToken');

  if (!hasToken) {
    console.log('토큰이 없어 로그인 페이지로 이동합니다.');
    return <Navigate to='/auth' replace />;
  }

  return <>{children}</>;
};

export default PrivateRoute;
