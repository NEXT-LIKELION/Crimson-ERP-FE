import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import PrivateRoute from "./PrivateRoute";
import InventoryPage from "@/pages/Inventory/InventoryPage";
import OrdersPage from "@/pages/Orders/OrdersPage";
import AlertsPage from "@/pages/Alerts/AlertsPage";
import HRPage from "@/pages/HR/HRPage";
import AuthPage from "@/pages/Auth/AuthPage";
import Dashboard from "@/pages/Dashboard/Dashboard";
import NotFound from "@/pages/NotFound";

// Lazy loading을 활용하여 코드 스플리팅 적용 (SWC 최적화)
const LazyInventory = lazy(() => import("@/pages/Inventory/InventoryPage"));
const LazyOrders = lazy(() => import("@/pages/Orders/OrdersPage"));
const LazyAlerts = lazy(() => import("@/pages/Alerts/AlertsPage"));
const LazyHR = lazy(() => import("@/pages/HR/HRPage"));

const AppRoutes = () => {
    return (
        <Router>
            <Suspense
                fallback={<div className="text-center mt-10">Loading...</div>}
            >
                <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/auth" element={<AuthPage />} />
                    <Route
                        path="/inventory"
                        element={
                            <PrivateRoute>
                                <LazyInventory />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/orders"
                        element={
                            <PrivateRoute>
                                <LazyOrders />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/alerts"
                        element={
                            <PrivateRoute>
                                <LazyAlerts />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/hr"
                        element={
                            <PrivateRoute>
                                <LazyHR />
                            </PrivateRoute>
                        }
                    />
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </Suspense>
        </Router>
    );
};

export default AppRoutes;
