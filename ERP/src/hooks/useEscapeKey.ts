import { useEffect } from 'react';

/**
 * ESC 키를 눌렀을 때 콜백 함수를 실행하는 커스텀 훅
 * @param callback ESC 키를 눌렀을 때 실행할 함수
 * @param isActive 훅이 활성화되어 있는지 여부 (기본값: true)
 */
export const useEscapeKey = (callback: () => void, isActive = true) => {
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        callback();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [callback, isActive]);
};
