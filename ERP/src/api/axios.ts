// src/api/axios.ts
import axios from 'axios';

// .env에서 API 기본 주소 설정 (없을 경우 기본 로컬 주소 사용)
const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || 'http://ec2-13-125-246-38.ap-northeast-2.compute.amazonaws.com';

// Axios 인스턴스 생성 및 설정
const instance = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true, // 쿠키를 통한 인증을 사용할 경우 활성화 (DRF 세션 인증 등)
});

// 기본 내보내기 추가 (필수!)
export default instance;
