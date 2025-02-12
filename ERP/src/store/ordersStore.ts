import { create } from "zustand";

interface Order {
    id: number;
    productName: string;
    quantity: number;
    status: "pending" | "approved";
}

interface OrdersState {
    orders: Order[];
    setOrders: (orders: Order[]) => void;
    updateOrderStatus: (orderId: number, status: "approved") => void;
}

export const useOrdersStore = create<OrdersState>((set) => ({
    orders: [],
    setOrders: (orders) => set({ orders }),
    updateOrderStatus: (orderId, status) =>
        set((state) => ({
            orders: state.orders.map((order) =>
                order.id === orderId ? { ...order, status } : order
            ),
        })),
}));
