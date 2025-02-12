import axios from "axios";

// .env에서 API 기본 주소 설정 (없을 경우 기본 로컬 주소 사용)
const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:5147";

// DRF측에서 사용하는 인증방식에 따라, JWT, WithCredentials, Token 등을 설정