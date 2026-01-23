import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, Link } from 'react-router-dom';
import './App.css';
import Login from './components/Login';
import Home from './components/Home';
import EmployeeProfile from './components/EmployeeProfile';
import BookingPage from './components/BookingPage';
import MyBookings from './components/MyBookings';
import { getAuthToken, setAuthToken, removeAuthToken, getCurrentUser } from './services/api';

function AppContent() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      loadUser();
    }
  }, []);

  const loadUser = async () => {
    try {
      const response = await getCurrentUser();
      if (response.user) {
        setUser(response.user);
        setIsAuthenticated(true);
      }
    } catch (error) {
      removeAuthToken();
      setIsAuthenticated(false);
    }
  };

  const handleLogin = (userData, token) => {
    setAuthToken(token);
    setIsAuthenticated(true);
    setUser(userData);
    navigate('/');
  };

  const handleLogout = () => {
    removeAuthToken();
    setIsAuthenticated(false);
    setUser(null);
    navigate('/login');
  };

  return (
    <>
      {!isAuthenticated ? (
        <Login onLogin={handleLogin} />
      ) : (
        <div className="app">
          <header className="app-header">
            <div className="header-content">
              <div className="logo">
                <h1>Booking Platform</h1>
                <p>Employee Booking System</p>
              </div>
              <nav className="main-nav">
                <Link to="/">Experts</Link>
                <Link to="/my-bookings">My Bookings</Link>
              </nav>
              <div className="header-actions">
                <span className="user-name">Welcome, {user?.name}</span>
                <button onClick={handleLogout} className="logout-btn">Logout</button>
              </div>
            </div>
          </header>

          <Routes>
            <Route path="/" element={<Home user={user} onLogout={handleLogout} />} />
            <Route path="/employee/:id" element={<EmployeeProfile user={user} />} />
            <Route path="/booking/:id" element={<BookingPage user={user} />} />
            <Route path="/my-bookings" element={<MyBookings user={user} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      )}
    </>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
