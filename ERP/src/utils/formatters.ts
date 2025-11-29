// 전화번호 포맷팅 유틸리티
export const formatPhoneNumber = (value: string | undefined) => {
  if (value === undefined) return '';
  if (value.includes('-')) return value;
  const numbers = value.replace(/[^0-9]/g, '');
  if (numbers.length <= 3) return numbers;
  if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
  return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
};

export const formatOption = (option: string | undefined, itemName: string) => {
  if (option && option.trim() !== '기본') return `${itemName}(${option})`;
  return itemName;
};
