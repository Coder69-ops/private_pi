import axios from 'axios';

const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api/backend',
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add interceptor to include token in all requests
apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Add interceptor to handle 401 responses
apiClient.interceptors.response.use((response) => {
    return response;
}, (error) => {
    if (error.response?.status === 401) {
        // Token expired or invalid
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_id');
        window.location.href = '/';
    }
    return Promise.reject(error);
});

export default apiClient;
