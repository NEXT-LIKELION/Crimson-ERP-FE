import { api } from './axios';

export const uploadInventoryExcel = (file: File) => {
  if (!file) {
    console.error('파일이 없습니다!');
    return Promise.reject(new Error('파일이 없습니다'));
  }

  const formData = new FormData();
  formData.append('file', file);

  return api.post('/inventory/upload/', formData);
};
