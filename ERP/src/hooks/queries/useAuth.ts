import { useQuery } from '@tanstack/react-query';
import { verifyToken, getCurrentUser } from '../../api/auth';
import { getCookie } from '../../utils/cookies';

// 토큰 유효성 검증 훅
export const useVerifyToken = () => {
  return useQuery({
    queryKey: ['verifyToken'],
    queryFn: verifyToken,
    enabled: !!getCookie('accessToken'), // 토큰이 있을 때만 실행
    retry: false,
    staleTime: 1000 * 60 * 5, // 5분
  });
};

// 현재 사용자 정보 가져오기 훅
export const useCurrentUser = () => {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: getCurrentUser,
    enabled: !!getCookie('accessToken'), // 토큰이 있을 때만 실행
    retry: false,
    staleTime: 1000 * 60 * 10, // 10분
  });
};
