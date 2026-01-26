import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { login, register } from '../services/api';
import './Login.css';

function Login({ onLogin }) {
  const location = useLocation();
  const redirectPath = new URLSearchParams(location.search).get('redirect') || location.state?.from || '/';
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    dateOfBirth: '',
    address: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let response;
      if (isLogin) {
        response = await login(formData.email, formData.password);
      } else {
        response = await register(formData);
      }

      if (response.token && response.user) {
        onLogin(response.user, response.token, redirectPath);
      }
    } catch (err) {
      console.error('Login/Register Error:', {
        message: err.message,
        response: err.response,
        status: err.response?.status,
        data: err.response?.data,
        config: err.config
      });
      
      // More specific error messages
      if (err.response) {
        // Server responded with error
        if (err.response.status === 404) {
          setError('API endpoint not found. Please check backend configuration.');
        } else if (err.response.status === 500) {
          setError('Server error. Please try again later.');
        } else if (err.response.status === 401) {
          setError('Invalid email or password.');
        } else {
          setError(err.response?.data?.message || `Error: ${err.response.status} - ${err.response.statusText}`);
        }
      } else if (err.request) {
        // Request made but no response
        console.error('No response from server. Check if backend is running.');
        setError('Cannot connect to server. Please check if backend is running and API URL is configured correctly.');
      } else {
        // Something else happened
        setError(err.message || 'An error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <h1>Booking Platform</h1>
          <p>Employee Booking System</p>
          {location.state?.message && (
            <p style={{ color: '#ff6b35', marginTop: '0.5rem', fontSize: '0.9rem', fontWeight: '500' }}>
              {location.state.message}
            </p>
          )}
        </div>

        <div className="login-tabs">
          <button
            className={isLogin ? 'active' : ''}
            onClick={() => setIsLogin(true)}
          >
            Login
          </button>
          <button
            className={!isLogin ? 'active' : ''}
            onClick={() => setIsLogin(false)}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {!isLogin && (
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Enter your name"
              />
            </div>
          )}

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter your email"
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Enter your password"
              minLength={6}
            />
          </div>

          {!isLogin && (
            <>
              <div className="form-group">
                <label>Phone (Optional)</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter your phone number"
                />
              </div>

              <div className="form-group">
                <label>Date of Birth (Optional)</label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Address (Optional)</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Enter your address"
                  rows="3"
                />
              </div>
            </>
          )}

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Please wait...' : (isLogin ? 'Login' : 'Register')}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
