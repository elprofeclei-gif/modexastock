import axios from 'axios';

// ✅ Si hay una variable de entorno (Producción), úsala.
// Si no hay (Desarrollo local), usa la magia del hostname dinámico.
const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000/api`;

const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Eliminamos el interceptor de request, ya no necesitamos inyectar el token manualmente
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Si la sesión expira, redirigir al login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
