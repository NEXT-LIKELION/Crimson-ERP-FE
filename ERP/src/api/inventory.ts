import api from './axios';

export const fetchInventories = () => api.get('/inventory/items/');
export const updateInventoryItem = (productId: number, data: any) => {
    return api.put(`/inventory/items/${productId}/`, data);
};

export const updateInventoryVariant = (variantId: string, data: any) => {
    console.log('updateInventoryVariant - variantId:', variantId);
    console.log('updateInventoryVariant - data:', data);
    return api
        .put(`/inventory/items/variants/${variantId}/`, data)
        .then((response) => {
            console.log('updateInventoryVariant - response:', response.data);
            return response;
        })
        .catch((error) => {
            console.error('updateInventoryVariant - error:', error);
            throw error;
        });
};

export const createInventoryVariant = async (variantId: string, itemPayload: any) => {
    console.log('createInventoryVariant - variantId:', variantId);
    console.log('createInventoryVariant - itemPayload:', itemPayload);
    const res = await api.post(`/inventory/items/variants/${variantId}/`, itemPayload);
    console.log('createInventoryVariant - response:', res.data);
    return res.data;
}; // variant 생성

export const createInventoryItem = async (itemPayload: any) => {
    console.log('createInventoryItem - itemPayload:', itemPayload);
    const res = await api.post(`/inventory/items/`, itemPayload);
    console.log('createInventoryItem - response:', res.data);
    return res.data;
}; // 상품만 생성

// 상품과 variant를 함께 생성하는 함수 (백엔드 구조에 따라 사용)
export const createProductWithVariant = async (itemPayload: any) => {
    const res = await api.post(`/inventory/products/`, itemPayload);
    return res.data;
};

export const checkProductIdExists = async (product_id: string) => {
    const res = await api.get('/inventory/items/', {
        params: { product_id },
    });
    return res.data.length > 0; // (product_id) 중복 검사 -> 존재하면 true
};

/**
 * Delete an InventoryItem (and its variants via cascade).
 * @param productId  the InventoryItem.id to delete
 */
export const deleteInventoryItem = async (productId: number) => {
    const res = await api.delete(`/inventory/items/${productId}/`);
    return res.data;
};
