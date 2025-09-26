// src/routes/PrivateRoute.tsx
import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { getAccessToken } from '../utils/localStorage';

interface PrivateRouteProps {
  children: ReactNode;
}

const PrivateRoute = ({ children }: PrivateRouteProps) => {
  const hasToken = !!getAccessToken();

  if (!hasToken) {
    return <Navigate to='/auth' replace />;
  }

  return <>{children}</>;
};

export default PrivateRoute;
