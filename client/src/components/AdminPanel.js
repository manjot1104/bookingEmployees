import React, { useState, useEffect } from 'react';
import { getAdminBookings, getAdminEmployees, getAdminUsers, getAdminDashboard, updateSlotStatus } from '../services/api';
import './AdminPanel.css';

function AdminPanel({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      switch (activeTab) {
        case 'dashboard':
          const dashboard = await getAdminDashboard();
          setDashboardData(dashboard);
          break;
        case 'bookings':
          const bookingsData = await getAdminBookings();
          setBookings(bookingsData.bookings || []);
          break;
        case 'employees':
          const employeesData = await getAdminEmployees();
          setEmployees(employeesData.employees || []);
          break;
        case 'users':
          const usersData = await getAdminUsers();
          setUsers(usersData.users || []);
          break;
        default:
          break;
      }
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    return timeString || 'N/A';
  };

  const formatCurrency = (amount) => {
    return `₹${amount || 0}`;
  };

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h1>Admin Panel</h1>
        <div className="admin-user-info">
          <span>Welcome, {user?.name}</span>
          <button onClick={onLogout} className="admin-logout-btn">Logout</button>
        </div>
      </div>

      <div className="admin-tabs">
        <button
          className={activeTab === 'dashboard' ? 'active' : ''}
          onClick={() => setActiveTab('dashboard')}
        >
          Dashboard
        </button>
        <button
          className={activeTab === 'bookings' ? 'active' : ''}
          onClick={() => setActiveTab('bookings')}
        >
          All Bookings
        </button>
        <button
          className={activeTab === 'employees' ? 'active' : ''}
          onClick={() => setActiveTab('employees')}
        >
          Therapists
        </button>
        <button
          className={activeTab === 'users' ? 'active' : ''}
          onClick={() => setActiveTab('users')}
        >
          Users
        </button>
      </div>

      <div className="admin-content">
        {loading && <div className="admin-loading">Loading...</div>}
        {error && <div className="admin-error">{error}</div>}

        {!loading && !error && (
          <>
            {activeTab === 'dashboard' && dashboardData && (
              <div className="dashboard">
                <div className="stats-grid">
                  <div className="stat-card">
                    <h3>Total Bookings</h3>
                    <p className="stat-value">{dashboardData.stats?.totalBookings || 0}</p>
                  </div>
                  <div className="stat-card">
                    <h3>Total Users</h3>
                    <p className="stat-value">{dashboardData.stats?.totalUsers || 0}</p>
                  </div>
                  <div className="stat-card">
                    <h3>Total Therapists</h3>
                    <p className="stat-value">{dashboardData.stats?.totalEmployees || 0}</p>
                  </div>
                  <div className="stat-card">
                    <h3>Total Revenue</h3>
                    <p className="stat-value">{formatCurrency(dashboardData.stats?.totalRevenue || 0)}</p>
                  </div>
                </div>

                <div className="dashboard-sections">
                  <div className="dashboard-section">
                    <h3>Bookings by Status</h3>
                    <div className="status-stats">
                      {dashboardData.stats?.bookingsByStatus && Object.entries(dashboardData.stats.bookingsByStatus).map(([status, count]) => (
                        <div key={status} className="status-item">
                          <span className="status-label">{status}:</span>
                          <span className="status-count">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="dashboard-section">
                    <h3>Bookings by Type</h3>
                    <div className="type-stats">
                      {dashboardData.stats?.bookingsByType && Object.entries(dashboardData.stats.bookingsByType).map(([type, count]) => (
                        <div key={type} className="type-item">
                          <span className="type-label">{type}:</span>
                          <span className="type-count">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="recent-bookings">
                  <h3>Recent Bookings</h3>
                  <div className="recent-bookings-list">
                    {dashboardData.recentBookings?.slice(0, 5).map((booking) => (
                      <div key={booking._id} className="recent-booking-item">
                        <div>
                          <strong>{booking.user?.name || 'N/A'}</strong> booked with{' '}
                          <strong>{booking.employee?.name || 'N/A'}</strong>
                        </div>
                        <div className="recent-booking-meta">
                          {formatDate(booking.bookingDate)} at {formatTime(booking.bookingTime)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'bookings' && (
              <div className="bookings-table-container">
                <h2>All Bookings ({bookings.length})</h2>
                <div className="table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Therapist</th>
                        <th>Date</th>
                        <th>Time</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th>Payment</th>
                        <th>Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.map((booking) => (
                        <tr key={booking._id}>
                          <td>
                            <div className="user-info">
                              <strong>{booking.user?.name || 'N/A'}</strong>
                              <small>{booking.user?.email || 'N/A'}</small>
                              {booking.user?.phone && <small>{booking.user.phone}</small>}
                            </div>
                          </td>
                          <td>
                            <div className="employee-info">
                              <strong>{booking.employee?.name || 'N/A'}</strong>
                              <small>{booking.employee?.title || 'N/A'}</small>
                            </div>
                          </td>
                          <td>{formatDate(booking.bookingDate)}</td>
                          <td>{formatTime(booking.bookingTime)}</td>
                          <td>
                            <span className={`type-badge ${booking.type?.toLowerCase()}`}>
                              {booking.type || 'N/A'}
                            </span>
                          </td>
                          <td>
                            <span className={`status-badge ${booking.status?.toLowerCase()}`}>
                              {booking.status || 'N/A'}
                            </span>
                          </td>
                          <td>
                            <span className={`payment-badge ${booking.paymentStatus?.toLowerCase()}`}>
                              {booking.paymentStatus || 'N/A'}
                            </span>
                          </td>
                          <td>{formatCurrency(booking.price?.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'employees' && (
              <div className="employees-grid">
                <h2>Therapists ({employees.length})</h2>
                <div className="employees-list">
                  {employees.map((employee) => (
                    <div key={employee._id} className="employee-admin-card">
                      <div className="employee-admin-header">
                        <h3>{employee.name}</h3>
                        <span className="employee-title">{employee.title}</span>
                      </div>
                      <div className="employee-admin-details">
                        <p><strong>Email:</strong> {employee.email || 'N/A'}</p>
                        <p><strong>Center:</strong> {employee.center || 'N/A'}</p>
                        <p><strong>Experience:</strong> {employee.experience || 'N/A'}</p>
                        <p><strong>Price:</strong> {formatCurrency(employee.price?.amount)}</p>
                      </div>
                      <div className="employee-stats">
                        <div className="stat-item">
                          <span className="stat-label">Total Bookings:</span>
                          <span className="stat-value">{employee.stats?.totalBookings || 0}</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-label">Total Slots:</span>
                          <span className="stat-value">{employee.stats?.totalSlots || 0}</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-label">Booked Slots:</span>
                          <span className="stat-value">{employee.stats?.bookedSlots || 0}</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-label">Available Slots:</span>
                          <span className="stat-value">{employee.stats?.availableSlots || 0}</span>
                        </div>
                      </div>
                      <div className="booking-status-breakdown">
                        <div className="breakdown-item">
                          <span>Pending: {employee.stats?.pendingBookings || 0}</span>
                        </div>
                        <div className="breakdown-item">
                          <span>Confirmed: {employee.stats?.confirmedBookings || 0}</span>
                        </div>
                        <div className="breakdown-item">
                          <span>Completed: {employee.stats?.completedBookings || 0}</span>
                        </div>
                        <div className="breakdown-item">
                          <span>Cancelled: {employee.stats?.cancelledBookings || 0}</span>
                        </div>
                      </div>
                      <div className="slots-info">
                        <h4>Slots Information</h4>
                        <div className="slots-list">
                          {employee.availableSlots?.slice(0, 20).map((slot, index) => (
                            <div key={index} className={`slot-item ${slot.isBooked ? 'booked' : 'available'}`}>
                              <span>{formatDate(slot.date)}</span>
                              <span>{slot.time}</span>
                              <span className={`slot-status ${slot.isBooked ? 'booked' : 'available'}`}>
                                {slot.isBooked ? 'Booked' : 'Available'}
                              </span>
                              <button
                                className={`slot-toggle-btn ${slot.isBooked ? 'make-available' : 'make-booked'}`}
                                onClick={async () => {
                                  try {
                                    await updateSlotStatus(employee._id, index, !slot.isBooked);
                                    // Reload employees data
                                    loadData();
                                  } catch (error) {
                                    console.error('Error updating slot:', error);
                                    alert('Failed to update slot status. Please try again.');
                                  }
                                }}
                                title={slot.isBooked ? 'Mark as Available' : 'Mark as Booked'}
                              >
                                {slot.isBooked ? 'Make Available' : 'Mark Booked'}
                              </button>
                            </div>
                          ))}
                          {employee.availableSlots?.length > 20 && (
                            <div className="more-slots">
                              +{employee.availableSlots.length - 20} more slots
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="users-table-container">
                <h2>All Users ({users.length})</h2>
                <div className="table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Address</th>
                        <th>Date of Birth</th>
                        <th>Total Bookings</th>
                        <th>Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((userItem) => (
                        <tr key={userItem._id}>
                          <td><strong>{userItem.name || 'N/A'}</strong></td>
                          <td>{userItem.email || 'N/A'}</td>
                          <td>{userItem.phone || 'N/A'}</td>
                          <td>{userItem.address || 'N/A'}</td>
                          <td>{userItem.dateOfBirth ? formatDate(userItem.dateOfBirth) : 'N/A'}</td>
                          <td>{userItem.bookings?.length || 0}</td>
                          <td>{formatDate(userItem.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default AdminPanel;

