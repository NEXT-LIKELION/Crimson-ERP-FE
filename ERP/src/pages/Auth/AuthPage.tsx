import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLogin } from '../../hooks/queries/useLogin';

const AuthPage = () => {
  // 로그인 폼 상태
  const [loginId, setLoginId] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  const loginMutation = useLogin(() => {
    alert('로그인 성공!');

    // useLogin 훅에서 이미 사용자 정보를 저장했으므로 바로 이동
    navigate('/');
  });

  const handleLogin = () => {
    setErrorMessage(''); // 초기화

    loginMutation.mutate(
      { username: loginId, password: loginPassword },
      {
        onError: (err: any) => {
          const msg = err?.response?.data?.message ?? '로그인 실패';
          setErrorMessage(msg);
        },
      }
    );
  };

  // 키보드 접근성 처리
  const handleLoginKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && loginId && loginPassword && !loginMutation.isPending) {
      handleLogin();
    }
  };

  return (
    <div className='flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4'>
      <div className='w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl'>
        {/* 헤더 섹션 */}
        <div className='bg-gradient-to-r from-rose-800 to-rose-900 px-8 py-6 text-center'>
          <img
            src='/images/crimsonlogo.png'
            alt='크림슨스토어 로고'
            className='mx-auto mb-4 h-24 w-24 rounded-full bg-white object-cover p-0.5'
          />
          <h1 className='text-xl font-bold text-white'>크림슨스토어 ERP</h1>
        </div>

        <div className='p-8'>
          {/* 로그인 폼 */}
          <div className='animate-in fade-in space-y-4 duration-300'>
            <div className='space-y-4'>
              <div>
                <label htmlFor='loginId' className='mb-2 block text-sm font-medium text-gray-700'>
                  아이디
                </label>
                <input
                  id='loginId'
                  type='text'
                  placeholder='아이디를 입력하세요'
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  className='w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-gray-900 placeholder-gray-500 transition-colors focus:border-rose-500 focus:bg-white focus:ring-2 focus:ring-rose-500'
                />
              </div>
              <div>
                <label
                  htmlFor='loginPassword'
                  className='mb-2 block text-sm font-medium text-gray-700'>
                  비밀번호
                </label>
                <input
                  id='loginPassword'
                  type='password'
                  placeholder='비밀번호를 입력하세요'
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  onKeyPress={handleLoginKeyPress}
                  className='w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-gray-900 placeholder-gray-500 transition-colors focus:border-rose-500 focus:bg-white focus:ring-2 focus:ring-rose-500'
                />
              </div>
            </div>

            <button
              onClick={handleLogin}
              disabled={loginMutation.isPending || !loginId || !loginPassword}
              className='mt-6 w-full rounded-lg bg-gradient-to-r from-rose-800 to-rose-900 py-3 font-medium text-white shadow-lg transition-all duration-200 hover:from-rose-900 hover:to-rose-950 hover:shadow-xl focus:ring-4 focus:ring-rose-300 disabled:cursor-not-allowed disabled:opacity-50'>
              {loginMutation.isPending ? (
                <div className='flex items-center justify-center'>
                  <div className='mr-2 h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent'></div>
                  로그인 중...
                </div>
              ) : (
                '로그인'
              )}
            </button>
          </div>

          {/* 에러 메시지 */}
          {errorMessage && (
            <div className='animate-in fade-in mt-4 rounded-lg border border-red-200 bg-red-50 p-3 duration-200'>
              <div className='flex items-center'>
                <div className='flex-shrink-0'>
                  <svg className='h-5 w-5 text-red-400' viewBox='0 0 20 20' fill='currentColor'>
                    <path
                      fillRule='evenodd'
                      d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z'
                      clipRule='evenodd'
                    />
                  </svg>
                </div>
                <div className='ml-3'>
                  <p className='text-sm text-red-800'>{errorMessage}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 푸터 */}
      <div className='mt-8 text-center'>
        <p className='text-sm text-gray-500'>© 2025 크림슨스토어. All Rights Reserved.</p>
      </div>
    </div>
  );
};

export default AuthPage;
