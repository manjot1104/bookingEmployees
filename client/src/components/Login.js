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
  const [acceptedTerms, setAcceptedTerms] = useState(false);

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
    
    // Validate terms and conditions for registration
    if (!isLogin && !acceptedTerms) {
      setError('Please accept the terms and conditions to continue.');
      return;
    }
    
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
                <label>Phone <span style={{ color: 'red' }}>*</span></label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  placeholder="Enter your phone number"
                />
              </div>

              <div className="form-group">
                <label>Date of Birth <span style={{ color: 'red' }}>*</span></label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Address <span style={{ color: 'red' }}>*</span></label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Enter your address"
                  rows="3"
                  required
                />
              </div>

              <div className="form-group terms-group">
                <div className="terms-content">
                  <h4>Terms and Conditions</h4>
                  <div className="terms-text">
                    <p><strong>1. Confidentiality</strong><br />
                    All therapy sessions and personal information shared during sessions will remain strictly confidential.</p>
                    
                    <p><strong>2. Session Recording</strong><br />
                    Therapy sessions may be recorded for training and quality purposes only. These recordings will be securely stored and handled confidentially.</p>
                    
                    <p><strong>Refund Policy</strong><br />
                    Refund requests will be accepted within 24 hours of booking confirmation only. After this period, the session fee will be non-refundable.</p>
                    
                    <p><strong>3. Appointment & Attendance</strong><br />
                    Sessions will be conducted as per the scheduled time. Late arrival may result in reduced session duration.</p>
                    
                    <p><strong>4. Cancellation & Rescheduling</strong><br />
                    Cancellation or rescheduling must be requested in advance through the software as per policy.</p>
                    
                    <p><strong>5. Emergency Support</strong><br />
                    Therapy sessions are not emergency services. In case of crisis, please contact:<br />
                    National Emergency Number: 112<br />
                    KIRAN Mental Health Helpline (24×7): 1800-599-0019<br />
                    Tele-MANAS National Mental Health Helpline (24×7): 14416<br />
                    Child Helpline: 1098</p>
                    
                    <p><strong>6. Contact Email</strong><br />
                    For appointment or support queries: gcwcentre@gmail.com</p>
                    
                    <p><strong>Consent</strong><br />
                    <strong>7. By booking the session through the software, the client agrees to these terms and conditions.</strong></p>
                  </div>
                </div>
                <label className="terms-checkbox">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    required
                  />
                  <span>I accept the terms and conditions <span style={{ color: 'red' }}>*</span></span>
                </label>
              </div>
            </>
          )}

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="submit-btn" disabled={loading || (!isLogin && !acceptedTerms)}>
            {loading ? 'Please wait...' : (isLogin ? 'Login' : 'Register')}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
