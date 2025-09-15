import React, { useState } from 'react';
import { FiX, FiEye, FiEyeOff, FiLock } from 'react-icons/fi';

interface ChangePasswordModalProps {
  employeeId: number;
  employeeName: string;
  onClose: () => void;
  onChangePassword: (employeeId: number, password: string) => Promise<void>;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  employeeId,
  employeeName,
  onClose,
  onChangePassword,
}) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 비밀번호 유효성 검사
  const validatePassword = (pwd: string): string[] => {
    const errors: string[] = [];

    if (pwd.length < 8) {
      errors.push('비밀번호는 최소 8자 이상이어야 합니다.');
    }
    if (!/[A-Z]/.test(pwd)) {
      errors.push('대문자를 포함해야 합니다.');
    }
    if (!/[a-z]/.test(pwd)) {
      errors.push('소문자를 포함해야 합니다.');
    }
    if (!/[0-9]/.test(pwd)) {
      errors.push('숫자를 포함해야 합니다.');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) {
      errors.push('특수문자를 포함해야 합니다.');
    }

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 기본 검증
    if (!password.trim()) {
      alert('새 비밀번호를 입력해주세요.');
      return;
    }

    if (!confirmPassword.trim()) {
      alert('비밀번호 확인을 입력해주세요.');
      return;
    }

    // 비밀번호 일치 검증
    if (password !== confirmPassword) {
      alert('비밀번호가 일치하지 않습니다.');
      return;
    }

    // 비밀번호 강도 검증
    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      alert(`비밀번호 조건을 확인해주세요:\n${passwordErrors.join('\n')}`);
      return;
    }

    try {
      setIsLoading(true);
      await onChangePassword(employeeId, password);
      alert('비밀번호가 성공적으로 변경되었습니다.');
      onClose();
    } catch (error) {
      console.error('비밀번호 변경 실패:', error);
      alert('비밀번호 변경에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  // 배경 클릭 시 모달 닫기
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const passwordErrors = password ? validatePassword(password) : [];
  const isPasswordValid = passwordErrors.length === 0 && password.length > 0;
  const isFormValid = isPasswordValid && password === confirmPassword;

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center p-4'
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={handleBackdropClick}>
      <div
        className='w-full max-w-md rounded-lg border border-gray-200 bg-white shadow-lg'
        onClick={(e) => e.stopPropagation()}>
        {/* 헤더 */}
        <div className='flex items-center justify-between border-b border-gray-200 px-6 py-4'>
          <h2 className='text-lg font-semibold text-gray-900'>비밀번호 변경</h2>
          <button onClick={onClose} className='text-gray-400 transition-colors hover:text-gray-600'>
            <FiX className='h-5 w-5' />
          </button>
        </div>

        {/* 내용 */}
        <form onSubmit={handleSubmit} className='p-6'>
          <div className='mb-4'>
            <p className='text-sm text-gray-600'>
              <span className='font-medium'>{employeeName}</span>님의 비밀번호를 변경합니다.
            </p>
          </div>

          {/* 새 비밀번호 */}
          <div className='mb-4'>
            <label className='mb-2 block text-sm font-medium text-gray-700'>새 비밀번호</label>
            <div className='relative'>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className='w-full rounded-md border border-gray-300 px-3 py-2 pr-10 focus:border-rose-500 focus:ring-2 focus:ring-rose-500 focus:outline-none'
                placeholder='새 비밀번호를 입력하세요'
                disabled={isLoading}
              />
              <button
                type='button'
                onClick={() => setShowPassword(!showPassword)}
                className='absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600'>
                {showPassword ? <FiEyeOff className='h-4 w-4' /> : <FiEye className='h-4 w-4' />}
              </button>
            </div>
            {password && passwordErrors.length > 0 && (
              <div className='mt-2 text-xs text-red-600'>
                <ul className='list-disc list-inside space-y-1'>
                  {passwordErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* 비밀번호 확인 */}
          <div className='mb-6'>
            <label className='mb-2 block text-sm font-medium text-gray-700'>비밀번호 확인</label>
            <div className='relative'>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className='w-full rounded-md border border-gray-300 px-3 py-2 pr-10 focus:border-rose-500 focus:ring-2 focus:ring-rose-500 focus:outline-none'
                placeholder='비밀번호를 다시 입력하세요'
                disabled={isLoading}
              />
              <button
                type='button'
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className='absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600'>
                {showConfirmPassword ? <FiEyeOff className='h-4 w-4' /> : <FiEye className='h-4 w-4' />}
              </button>
            </div>
            {confirmPassword && password !== confirmPassword && (
              <p className='mt-2 text-xs text-red-600'>비밀번호가 일치하지 않습니다.</p>
            )}
            {confirmPassword && password === confirmPassword && confirmPassword.length > 0 && (
              <p className='mt-2 text-xs text-green-600'>비밀번호가 일치합니다.</p>
            )}
          </div>


          {/* 버튼 */}
          <div className='flex space-x-3'>
            <button
              type='button'
              onClick={onClose}
              disabled={isLoading}
              className='flex-1 rounded-md bg-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-50'>
              취소
            </button>
            <button
              type='submit'
              disabled={!isFormValid || isLoading}
              className='flex flex-1 items-center justify-center rounded-md bg-rose-500 px-4 py-2 text-sm text-white hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-50'>
              <FiLock className='mr-2 h-4 w-4' />
              {isLoading ? '변경 중...' : '비밀번호 변경'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordModal;