// src/api/axios.ts
import axios from "axios";

// .env 설정
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // 필요한 경우
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token"); // 로그인 시 저장한 access token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

export default api;
export { api };
