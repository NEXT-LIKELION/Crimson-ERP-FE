import { create } from "zustand";

interface Alert {
    id: number;
    productName: string;
}

interface AlertsState {
    alerts: Alert[];
    setAlerts: (alerts: Alert[]) => void;
}

export const useAlertsStore = create<AlertsState>((set) => ({
    alerts: [],
    setAlerts: (alerts) => set({ alerts }),
}));
