import api from './axios';
export const fetchInventories = () => api.get('/inventory/items/');
