import { Order } from '../store/ordersStore';

interface OrderApiParams {
  ordering?: 'order_date' | 'expected_delivery_date';
  product_name?: string;
  supplier?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
}

interface OrderResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Order[];
}

export type { OrderApiParams, OrderResponse };
