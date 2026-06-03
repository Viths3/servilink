import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000',
});

// Adjunta el JWT desde localStorage en cada petición
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('servilink_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
