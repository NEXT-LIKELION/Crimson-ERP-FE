// API 에러 타입 정의
export interface ApiErrorResponse {
  message?: string;
  error?: string;
  detail?: string;
}

export interface ApiError {
  response?: {
    data?: ApiErrorResponse;
    status?: number;
  };
  message?: string;
}

// 타입 가드 함수
export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'response' in error
  );
}

// 에러 메시지 추출 함수
export function getErrorMessage(error: unknown, defaultMessage: string = '알 수 없는 오류가 발생했습니다.'): string {
  if (isApiError(error)) {
    return error.response?.data?.message || 
           error.response?.data?.error || 
           error.response?.data?.detail || 
           error.message || 
           defaultMessage;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return defaultMessage;
}
