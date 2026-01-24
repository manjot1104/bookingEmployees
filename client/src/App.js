import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, Link, NavLink, useLocation } from 'react-router-dom';
import './App.css';
import Login from './components/Login';
import Home from './components/Home';
import EmployeeProfile from './components/EmployeeProfile';
import BookingPage from './components/BookingPage';
import MyBookings from './components/MyBookings';
import AdminPanel from './components/AdminPanel';
import { getAuthToken, setAuthToken, removeAuthToken, getCurrentUser } from './services/api';

function AppContent() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

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

  const handleLogin = (userData, token, redirectPath) => {
    setAuthToken(token);
    setIsAuthenticated(true);
    setUser(userData);
    // Navigate to redirect path or home
    navigate(redirectPath || '/', { replace: true });
  };

  const handleLogout = () => {
    removeAuthToken();
    setIsAuthenticated(false);
    setUser(null);
    navigate('/');
  };

  return (
    <>
      <Routes>
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="*" element={
          <div className="app">
            <header className="app-header">
              <div className="header-content">
                <nav className="main-nav centered">
                  <NavLink 
                    to="/" 
                    className={({ isActive }) => {
                      // Always active when not authenticated, or when on home page
                      if (!isAuthenticated) return 'active';
                      return isActive ? 'active' : '';
                    }}
                    end
                  >
                    Experts
                  </NavLink>
                  {isAuthenticated && (
                    <>
                      <NavLink 
                        to="/my-bookings"
                        className={({ isActive }) => isActive ? 'active' : ''}
                      >
                        My Bookings
                      </NavLink>
                      {user?.role === 'admin' && (
                        <NavLink 
                          to="/admin"
                          className={({ isActive }) => isActive ? 'active' : ''}
                        >
                          Admin Panel
                        </NavLink>
                      )}
                    </>
                  )}
                </nav>
                <div className="header-actions">
                  {isAuthenticated ? (
                    <>
                      <span className="user-name">Welcome, {user?.name}</span>
                      <button onClick={handleLogout} className="logout-btn">Logout</button>
                    </>
                  ) : (
                    <Link to="/login">
                      <button className="login-btn-header">Login</button>
                    </Link>
                  )}
                </div>
              </div>
            </header>

            <Routes>
              <Route path="/" element={<Home user={user} isAuthenticated={isAuthenticated} onLogout={handleLogout} />} />
              <Route path="/employee/:id" element={<EmployeeProfile user={user} isAuthenticated={isAuthenticated} />} />
              <Route 
                path="/booking/:id" 
                element={
                  isAuthenticated ? (
                    <BookingPage user={user} />
                  ) : (
                    <Navigate to="/login" replace state={{ from: window.location.pathname }} />
                  )
                } 
              />
              <Route 
                path="/my-bookings" 
                element={
                  isAuthenticated ? (
                    <MyBookings user={user} />
                  ) : (
                    <Navigate to="/login" replace state={{ from: '/my-bookings' }} />
                  )
                } 
              />
              <Route 
                path="/admin" 
                element={
                  isAuthenticated && user?.role === 'admin' ? (
                    <AdminPanel user={user} onLogout={handleLogout} />
                  ) : (
                    <Navigate to="/" replace />
                  )
                } 
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        } />
      </Routes>
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
