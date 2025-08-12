export const getLocalStorage = (key: string) => {
  return localStorage.getItem(key);
};
export const removeLocalStorage = (key: string) => {
  return localStorage.removeItem(key);
};
export const setLocalStorage = (key: string, value: any) => {
  return localStorage.setItem(key, value);
};
