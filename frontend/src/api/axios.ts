import axios from 'axios';

// Detecta automáticamente el hostname (localhost o tu IP local)
// Si entras desde PC será "localhost", si entras desde el celular será "192.168.1.7"
const API_URL = `http://${window.location.hostname}:3000/api`;

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
