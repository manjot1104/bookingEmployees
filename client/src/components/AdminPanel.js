import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAdminBookings, getAdminEmployees, getAdminUsers, getAdminDashboard, updateSlotStatus, deleteBooking } from '../services/api';
import { formatISTDateString } from '../utils/dateUtils';
import './AdminPanel.css';

function AdminPanel({ user, onLogout }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedBookings, setSelectedBookings] = useState([]);
  const [filterDate, setFilterDate] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [calendarExpanded, setCalendarExpanded] = useState(false);

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
    // Clear selection when switching tabs
    setSelectedBookings([]);
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

  // Calendar functions
  const getCalendarGrid = () => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const calendarDays = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      calendarDays.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const dateStr = formatISTDateString(date);
      calendarDays.push({
        day,
        date: dateStr,
        dateObj: date
      });
    }
    
    return calendarDays;
  };

  const getMonthName = () => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                    'July', 'August', 'September', 'October', 'November', 'December'];
    return months[currentMonth];
  };

  const changeMonth = (direction) => {
    if (direction === 'prev') {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    }
  };

  // Filter bookings by selected date
  const filteredBookings = filterDate 
    ? bookings.filter(booking => {
        const bookingDate = new Date(booking.bookingDate);
        const bookingDateStr = formatISTDateString(bookingDate);
        return bookingDateStr === filterDate;
      })
    : bookings;

  // Handle checkbox selection
  const handleSelectBooking = (bookingId) => {
    setSelectedBookings(prev => {
      if (prev.includes(bookingId)) {
        return prev.filter(id => id !== bookingId);
      } else {
        return [...prev, bookingId];
      }
    });
  };

  // Handle select all
  const handleSelectAll = () => {
    const pendingBookings = filteredBookings.filter(b => b.paymentStatus === 'Pending');
    if (selectedBookings.length === pendingBookings.length) {
      setSelectedBookings([]);
    } else {
      setSelectedBookings(pendingBookings.map(b => b._id));
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedBookings.length === 0) {
      alert('Please select at least one booking to delete');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${selectedBookings.length} booking(s)? This action cannot be undone.`)) {
      return;
    }

    try {
      setLoading(true);
      // Delete all selected bookings
      await Promise.all(selectedBookings.map(id => deleteBooking(id)));
      // Clear selection
      setSelectedBookings([]);
      // Reload bookings
      loadData();
    } catch (error) {
      console.error('Error deleting bookings:', error);
      alert('Failed to delete some bookings. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h1>Admin Panel</h1>
      </div>

      <div className="admin-tabs">
        <button
          className={activeTab === 'experts' ? 'active' : ''}
          onClick={() => navigate('/')}
        >
          Experts
        </button>
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
                <div className="bookings-layout">
                  {/* Compact Calendar Sidebar */}
                  <div className={`admin-calendar-sidebar ${calendarExpanded ? 'expanded' : ''}`}>
                    <button 
                      className="calendar-toggle-btn"
                      onClick={() => setCalendarExpanded(!calendarExpanded)}
                      title={calendarExpanded ? 'Collapse calendar' : 'Expand calendar'}
                    >
                      <span className="calendar-icon">📅</span>
                      <span className="calendar-toggle-text">
                        {calendarExpanded ? 'Hide' : 'Show'} Calendar
                      </span>
                    </button>

                    {calendarExpanded && (
                      <div className="calendar-expanded-content">
                        <div className="calendar-header">
                          <button 
                            className="month-nav-button" 
                            onClick={() => changeMonth('prev')}
                            aria-label="Previous month"
                          >
                            ←
                          </button>
                          <h3 className="calendar-month-year">
                            {getMonthName()} {currentYear}
                          </h3>
                          <button 
                            className="month-nav-button" 
                            onClick={() => changeMonth('next')}
                            aria-label="Next month"
                          >
                            →
                          </button>
                        </div>

                        <div className="calendar-weekdays">
                          <div className="calendar-weekday">S</div>
                          <div className="calendar-weekday">M</div>
                          <div className="calendar-weekday">T</div>
                          <div className="calendar-weekday">W</div>
                          <div className="calendar-weekday">T</div>
                          <div className="calendar-weekday">F</div>
                          <div className="calendar-weekday">S</div>
                        </div>

                        <div className="calendar-grid">
                          {getCalendarGrid().map((dayData, index) => {
                            if (!dayData) {
                              return <div key={`empty-${index}`} className="calendar-day empty"></div>;
                            }

                            const { day, date } = dayData;
                            const isSelected = filterDate === date;
                            const hasBookings = bookings.some(booking => {
                              const bookingDate = new Date(booking.bookingDate);
                              return formatISTDateString(bookingDate) === date;
                            });

                            return (
                              <button
                                key={date}
                                className={`calendar-day ${isSelected ? 'selected' : ''} ${hasBookings ? 'has-bookings' : ''}`}
                                onClick={() => {
                                  if (filterDate === date) {
                                    setFilterDate(null);
                                  } else {
                                    setFilterDate(date);
                                  }
                                  setSelectedBookings([]);
                                }}
                                title={hasBookings ? `${bookings.filter(b => {
                                  const bDate = new Date(b.bookingDate);
                                  return formatISTDateString(bDate) === date;
                                }).length} booking(s)` : 'No bookings'}
                              >
                                <div className="calendar-day-number">{day}</div>
                                {hasBookings && (
                                  <div className="calendar-day-status">
                                    <span className="status-dot bookings"></span>
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                        
                        {filterDate && (
                          <div className="filter-info">
                            <span>{formatDate(new Date(filterDate + 'T00:00:00'))}</span>
                            <button 
                              className="clear-filter-btn"
                              onClick={() => {
                                setFilterDate(null);
                                setSelectedBookings([]);
                              }}
                            >
                              Clear
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Bookings Table */}
                  <div className="bookings-content">

                <div className="bookings-header-actions">
                  <h2>
                    All Bookings ({filteredBookings.length}
                    {filterDate && ` of ${bookings.length}`})
                  </h2>
                  {selectedBookings.length > 0 && (
                    <button
                      className="bulk-delete-btn"
                      onClick={handleBulkDelete}
                      disabled={loading}
                    >
                      Delete Selected ({selectedBookings.length})
                    </button>
                  )}
                </div>
                <div className="table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>
                          <input
                            type="checkbox"
                            checked={filteredBookings.filter(b => b.paymentStatus === 'Pending').length > 0 && 
                                    selectedBookings.length === filteredBookings.filter(b => b.paymentStatus === 'Pending').length}
                            onChange={handleSelectAll}
                            title="Select all pending bookings"
                          />
                        </th>
                        <th>User</th>
                        <th>Therapist</th>
                        <th>Date</th>
                        <th>Time</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th>Payment</th>
                        <th>Price</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBookings.map((booking) => (
                        <tr key={booking._id} className={selectedBookings.includes(booking._id) ? 'selected-row' : ''}>
                          <td>
                            {booking.paymentStatus === 'Pending' && (
                              <input
                                type="checkbox"
                                checked={selectedBookings.includes(booking._id)}
                                onChange={() => handleSelectBooking(booking._id)}
                                title="Select booking"
                              />
                            )}
                          </td>
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
                          <td>
                            {booking.paymentStatus === 'Pending' && (
                              <button
                                className="delete-booking-btn"
                                onClick={async () => {
                                  if (window.confirm('Are you sure you want to delete this booking? This action cannot be undone.')) {
                                    try {
                                      await deleteBooking(booking._id);
                                      // Remove from selection if selected
                                      setSelectedBookings(prev => prev.filter(id => id !== booking._id));
                                      // Reload bookings after deletion
                                      loadData();
                                    } catch (error) {
                                      console.error('Error deleting booking:', error);
                                      alert('Failed to delete booking. Please try again.');
                                    }
                                  }
                                }}
                                title="Delete booking"
                              >
                                Delete
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                  </div>
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
                          {(() => {
                            // Group slots by date and then by 3-hour periods
                            const slotsByDate = {};
                            
                            if (employee.availableSlots && employee.availableSlots.length > 0) {
                              employee.availableSlots.forEach((slot, index) => {
                                const slotDate = new Date(slot.date);
                                const dateKey = formatDate(slot.date);
                                
                                if (!slotsByDate[dateKey]) {
                                  slotsByDate[dateKey] = {
                                    date: slotDate,
                                    dateStr: dateKey,
                                    periods: {
                                      morning: { times: [], indices: [] },
                                      afternoon: { times: [], indices: [] },
                                      evening: { times: [], indices: [] }
                                    }
                                  };
                                }
                                
                                // Categorize into periods
                                const time = slot.time;
                                if (time === '10:00 AM' || time === '11:00 AM' || time === '12:00 PM') {
                                  slotsByDate[dateKey].periods.morning.times.push(slot);
                                  slotsByDate[dateKey].periods.morning.indices.push(index);
                                } else if (time === '01:00 PM' || time === '02:00 PM' || time === '03:00 PM') {
                                  slotsByDate[dateKey].periods.afternoon.times.push(slot);
                                  slotsByDate[dateKey].periods.afternoon.indices.push(index);
                                } else if (time === '04:00 PM' || time === '05:00 PM' || time === '06:00 PM') {
                                  slotsByDate[dateKey].periods.evening.times.push(slot);
                                  slotsByDate[dateKey].periods.evening.indices.push(index);
                                }
                              });
                            }
                            
                            // Sort dates
                            const sortedDates = Object.values(slotsByDate).sort((a, b) => 
                              new Date(a.date) - new Date(b.date)
                            );
                            
                            return sortedDates.slice(0, 10).map((dateGroup, dateIndex) => (
                              <div key={dateIndex} className="date-group">
                                <h5 className="date-group-title">{dateGroup.dateStr}</h5>
                                {['morning', 'afternoon', 'evening'].map((period) => {
                                  const periodData = dateGroup.periods[period];
                                  const periodLabels = {
                                    morning: { name: 'MORNING', range: '10:00 AM - 1:00 PM' },
                                    afternoon: { name: 'AFTERNOON', range: '1:00 PM - 4:00 PM' },
                                    evening: { name: 'EVENING', range: '4:00 PM - 7:00 PM' }
                                  };
                                  
                                  // Check if all 3 hours exist and their status
                                  const allExist = periodData.times.length === 3;
                                  const allBooked = allExist && periodData.times.every(s => s.isBooked);
                                  const anyBooked = periodData.times.some(s => s.isBooked);
                                  
                                  if (!allExist && periodData.times.length === 0) {
                                    return null; // Don't show if no slots
                                  }
                                  
                                  return (
                                    <div key={period} className={`slot-item-period ${allBooked ? 'booked' : anyBooked ? 'partially-booked' : 'available'}`}>
                                      <div className="period-info">
                                        <span className="period-name">{periodLabels[period].name}</span>
                                        <span className="period-range">{periodLabels[period].range}</span>
                                        <span className={`slot-status ${allBooked ? 'booked' : anyBooked ? 'partially-booked' : 'available'}`}>
                                          {allBooked ? 'Booked' : anyBooked ? 'Partially Booked' : 'Available'}
                                        </span>
                                      </div>
                                      <button
                                        className={`slot-toggle-btn ${allBooked ? 'make-available' : 'make-booked'}`}
                                        onClick={async () => {
                                          try {
                                            // Toggle all 3 slots in the period
                                            const newStatus = !allBooked;
                                            for (const idx of periodData.indices) {
                                              await updateSlotStatus(employee._id, idx, newStatus);
                                            }
                                            // Reload employees data
                                            loadData();
                                          } catch (error) {
                                            console.error('Error updating slots:', error);
                                            alert('Failed to update slot status. Please try again.');
                                          }
                                        }}
                                        title={allBooked ? 'Mark as Available' : 'Mark as Booked'}
                                      >
                                        {allBooked ? 'Make Available' : 'Mark Booked'}
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            ));
                          })()}
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

