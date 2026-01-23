import axios from 'axios';

// Get API URL from environment variable
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Log API URL in development to help debug
if (process.env.NODE_ENV === 'development') {
  console.log('🔗 API Base URL:', API_BASE_URL);
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 30000 // 30 seconds timeout
});

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log full error details in development
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ API Error:', {
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        fullURL: error.config?.baseURL + error.config?.url,
        status: error.response?.status,
        message: error.message,
        response: error.response?.data
      });
    }
    
    // If 404, provide more helpful error message
    if (error.response?.status === 404) {
      console.error('❌ 404 Error - API endpoint not found');
      console.error('Full URL:', error.config?.baseURL + error.config?.url);
      console.error('Check if REACT_APP_API_URL is set correctly in Vercel');
    }
    
    return Promise.reject(error);
  }
);

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Log request in development
  if (process.env.NODE_ENV === 'development') {
    console.log('📤 API Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      fullURL: config.baseURL + config.url
    });
  }
  
  return config;
});

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log full error details
    console.error('❌ API Error:', {
      url: error.config?.url,
      baseURL: error.config?.baseURL,
      fullURL: error.config?.baseURL + error.config?.url,
      status: error.response?.status,
      message: error.message,
      response: error.response?.data
    });
    
    // If 404, provide more helpful error message
    if (error.response?.status === 404) {
      console.error('❌ 404 Error - API endpoint not found');
      console.error('Full URL:', error.config?.baseURL + error.config?.url);
      console.error('Current API Base URL:', API_BASE_URL);
      if (API_BASE_URL.includes('localhost')) {
        console.error('⚠️ WARNING: Using localhost URL!');
        console.error('⚠️ Please set REACT_APP_API_URL in Vercel environment variables');
        console.error('⚠️ Should be: https://bookingemployees.onrender.com/api');
      }
    }
    
    return Promise.reject(error);
  }
);

// Auth functions
export const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

export const register = async (userData) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

// Employee functions
export const getEmployees = async (queryParams = '') => {
  const url = queryParams ? `/employees?${queryParams}` : '/employees';
  const response = await api.get(url);
  return response.data;
};

export const getEmployee = async (id) => {
  const response = await api.get(`/employees/${id}`);
  return response.data;
};

export const getEmployeeSlots = async (id) => {
  const response = await api.get(`/employees/${id}/slots`);
  return response.data;
};

// Booking functions
export const createBooking = async (bookingData) => {
  const response = await api.post('/bookings', bookingData);
  return response.data;
};

export const getMyBookings = async () => {
  const response = await api.get('/bookings/my-bookings');
  return response.data;
};

export const getBooking = async (id) => {
  const response = await api.get(`/bookings/${id}`);
  return response.data;
};

export const cancelBooking = async (id) => {
  const response = await api.patch(`/bookings/${id}/cancel`);
  return response.data;
};

// Payment functions (Razorpay)
export const createRazorpayOrder = async (bookingId, amount) => {
  const response = await api.post('/payments/create-order', { bookingId, amount });
  return response.data;
};

export const verifyRazorpayPayment = async (razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId) => {
  const response = await api.post('/payments/verify-payment', { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId });
  return response.data;
};

// Token management
export const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

export const setAuthToken = (token) => {
  localStorage.setItem('authToken', token);
};

export const removeAuthToken = () => {
  localStorage.removeItem('authToken');
};

export default api;
