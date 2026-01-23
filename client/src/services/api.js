import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

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
