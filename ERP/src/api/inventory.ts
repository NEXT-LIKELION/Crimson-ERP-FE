import api from './axios';
export const fetchInventories = () => api.get('/inventory/items/');
export const updateInventoryItem = (product_code: string, payload: any) =>
    api.patch(`/inventory/items/${product_code}/`, payload);
