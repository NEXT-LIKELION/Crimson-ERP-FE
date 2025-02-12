import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";

interface PrivateRouteProps {
    children: ReactNode;
}

const PrivateRoute = ({ children }: PrivateRouteProps) => {
    const user = useAuthStore((state) => state.user); // Zustand에서 로그인 상태 가져오기

    return user ? children : <Navigate to="/login" replace />;
};

export default PrivateRoute;
