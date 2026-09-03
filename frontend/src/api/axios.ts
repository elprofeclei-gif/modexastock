import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000/api`;

const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Lo dejamos por si acaso
});

// ✅ INTERCEPTOR: Enviar el Token en el Header en cada petición
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && token !== 'cookie-active') {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
