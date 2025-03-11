// src/routes/PrivateRoute.tsx
import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

interface PrivateRouteProps {
    children: ReactNode;
}

const PrivateRoute = ({ children }: PrivateRouteProps) => {
    const user = useAuthStore((state) => state.user);
    if (!user){
        console.log("로그인 페이지로 이동합니다.");
    }
    // user가 없으면 로그인 페이지로 이동
    return user ? <>{children}</> : <Navigate to="/auth" replace />;
};

export default PrivateRoute;
