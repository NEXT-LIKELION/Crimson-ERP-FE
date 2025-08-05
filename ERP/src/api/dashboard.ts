import api from './axios';

export interface DashboardData {
    total_sales: number;
    top_low_stock: {
        variant_code: string;
        product_name: string;
        option: string;
        stock: number;
        min_stock: number;
    }[];
    top_sales: {
        variant_code: string;
        option: string;
        product_name: string;
        sales: number;
    }[];
    arriving_soon_orders: {
        order_id: number;
        supplier: string;
        expected_delivery_date: string;
    }[];
    recent_orders: {
        order_id: number;
        supplier: string;
        order_date: string;
        expected_delivery_date: string;
        manager: string;
        status: string;
        product_names: string[];
    }[];
    recent_vacations: {
        employee: string;
        leave_type: string;
        start_date: string;
        end_date: string;
        created_at: string;
    }[];
}

export const fetchDashboardData = (): Promise<{ data: DashboardData }> => {
    return api.get('/dashboard/');
};