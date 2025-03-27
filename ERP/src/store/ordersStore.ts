// src/store/ordersStore.ts
import { create } from 'zustand';

export type OrderStatus = 'pending' | 'approved' | 'completed';

export interface OrderItem {
    id: number;
    name: string;
    spec: string;
    unit: string;
    quantity: number;
    price: number;
    amount?: number;
    note?: string;
}

export interface Order {
    id: number;
    productName: string;
    orderDate: string;
    totalAmount: number;
    status: OrderStatus;
    manager: string;
    supplier: string;
    items: OrderItem[];
}

interface OrdersState {
    orders: Order[];
    setOrders: (orders: Order[]) => void;
    updateOrderStatus: (orderId: number, status: OrderStatus) => void;
    addOrder: (order: Order) => void;
    getOrderById: (orderId: number) => Order | undefined;
}

export const useOrdersStore = create<OrdersState>((set, get) => ({
    orders: [],
    setOrders: (orders) => set({ orders }),
    updateOrderStatus: (orderId, status) =>
        set((state) => ({
            orders: state.orders.map((order) => (order.id === orderId ? { ...order, status } : order)),
        })),
    addOrder: (order) =>
        set((state) => ({
            orders: [...state.orders, order],
        })),
    getOrderById: (id) => get().orders.find((o) => o.id === id),
}));
