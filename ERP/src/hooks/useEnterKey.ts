import { useCallback } from 'react';

/**
 * Enter 키를 눌렀을 때 콜백 함수를 실행하는 이벤트 핸들러를 반환하는 커스텀 훅
 * @param callback Enter 키를 눌렀을 때 실행할 함수
 * @param isActive 훅이 활성화되어 있는지 여부 (기본값: true)
 * @returns KeyboardEvent 핸들러 함수
 */
export const useEnterKey = (callback: () => void, isActive = true) => {
  return useCallback(
    (event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (!isActive) return;
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        callback();
      }
    },
    [callback, isActive]
  );
};
