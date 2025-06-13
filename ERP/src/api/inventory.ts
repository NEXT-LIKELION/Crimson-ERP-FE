import api from './axios';

export const fetchInventories = () => api.get('/inventory/items/');
export const updateInventoryItem = (productId: number, data: any) => {
    return api.put(`/inventory/items/${productId}/`, data);
};

export const createInventoryItem = async (itemPayload: any) => {
    const res = await api.post(`/inventory/items/`, itemPayload);
    return res.data;
}; // 상품만 생성
export const createProductVariant = async (productId: number, variantPayload: any) => {
    const res = await api.post(`/inventory/items/${productId}/variants/`, variantPayload);
    return res.data;
};
export const checkProductIdExists = async (product_id: string) => {
    const res = await api.get('/inventory/items/', {
        params: { product_id }
    });
    return res.data.length > 0;  // (product_id) 중복 검사 -> 존재하면 true
};
/**
 * Delete an InventoryItem (and its variants via cascade).
 * @param productId  the InventoryItem.id to delete
 */
export const deleteInventoryItem = async (productId: number) => {
    const res = await api.delete(`/inventory/items/${productId}/`);
    return res.data; 
  };