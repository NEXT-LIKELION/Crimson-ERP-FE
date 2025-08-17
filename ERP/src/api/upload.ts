import { api } from './axios';

export const uploadInventoryExcel = (file: File) => {
  console.log('uploadInventoryExcel - file:', file);
  console.log('file name:', file?.name);
  console.log('file size:', file?.size);
  console.log('file type:', file?.type);

  if (!file) {
    console.error('파일이 없습니다!');
    return Promise.reject(new Error('파일이 없습니다'));
  }

  const formData = new FormData();
  formData.append('file', file);

  // FormData 내용 확인
  console.log('Uploading file:', file.name, file.size, file.type);

  return api.post('/inventory/upload/', formData);
};
