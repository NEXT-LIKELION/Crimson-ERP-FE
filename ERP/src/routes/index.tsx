// src/routes/index.tsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PrivateRoute from './PrivateRoute';

import InventoryPage from '../pages/Inventory/InventoryPage';
import OrdersPage from '../pages/Orders/OrdersPage';
import AlertsPage from '../pages/Alerts/AlertsPage';
import HRPage from '../pages/HR/HRPage';
import AuthPage from '../pages/Auth/AuthPage';
import DashboardPage from '../pages/Dashboard/DashboardPage';
import NotFound from '../pages/Notfound';
import Layout from '../layout';
import SupplierPage from '../pages/Supplier/SupplierPage';

const AppRoutes = () => {
    return (
        <Layout>
            <Routes>
                {/* 로그인 페이지 (AuthPage) */}
                <Route path="/auth" element={<AuthPage />} />

                {/* 메인 대시보드 (로그인해야만 접근 가능) */}
                <Route
                    path="/"
                    element={
                        <PrivateRoute>
                            <DashboardPage />
                        </PrivateRoute>
                    }
                />

                {/* 재고 페이지 (로그인해야만 접근 가능) */}
                <Route
                    path="/inventory"
                    element={
                        <PrivateRoute>
                            <InventoryPage />
                        </PrivateRoute>
                    }
                />

                {/* 발주 페이지 (로그인해야만 접근 가능) */}
                <Route
                    path="/orders"
                    element={
                        <PrivateRoute>
                            <OrdersPage />
                        </PrivateRoute>
                    }
                />

                {/* 알림 페이지 (로그인해야만 접근 가능) */}
                <Route
                    path="/alerts"
                    element={
                        <PrivateRoute>
                            <AlertsPage />
                        </PrivateRoute>
                    }
                />

                {/* HR 페이지 (로그인해야만 접근 가능) */}
                <Route
                    path="/hr"
                    element={
                        <PrivateRoute>
                            <HRPage />
                        </PrivateRoute>
                    }
                />

                {/* 공급업체 페이지 (로그인해야만 접근 가능) */}
                <Route
                    path="/supplier"
                    element={
                        <PrivateRoute>
                            <SupplierPage />
                        </PrivateRoute>
                    }
                />

                {/* 404 처리 */}
                <Route path="*" element={<NotFound />} />
            </Routes>
        </Layout>
    );
};

export default AppRoutes;
