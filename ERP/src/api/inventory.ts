import api from './axios';
export const fetchInventories = () => api.get('/inventory/items/');
export const updateInventoryItem = (productId: number, data: any) => {
    return api.put(`/inventory/items/${productId}/`, data);
};
