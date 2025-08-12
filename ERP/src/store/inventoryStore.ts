import { create } from 'zustand';

interface InventoryItem {
  id: number;
  name: string;
  stock: number;
}

interface InventoryState {
  inventory: InventoryItem[];
  setInventory: (inventory: InventoryItem[]) => void;
}

export const useInventoryStore = create<InventoryState>((set) => ({
  inventory: [],
  setInventory: (inventory) => set({ inventory }),
}));
