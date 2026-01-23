import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyBookings, cancelBooking } from '../services/api';
import './MyBookings.css';

function MyBookings({ user }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const data = await getMyBookings();
      console.log('📋 Bookings loaded from API:', data);
      
      // Debug: Check employee data for each booking
      data.forEach((booking, index) => {
        console.log(`\n📅 Booking ${index + 1}:`, {
          bookingId: booking._id,
          status: booking.status,
          employee: booking.employee,
          employeeName: booking.employee?.name,
          employeeId: booking.employee?._id,
          employeeType: typeof booking.employee,
          hasEmployee: !!booking.employee,
          employeeKeys: booking.employee ? Object.keys(booking.employee) : []
        });
        
        if (!booking.employee || !booking.employee.name) {
          console.error(`❌ Booking ${index + 1} is missing employee data!`);
        } else {
          console.log(`✅ Booking ${index + 1} has employee: ${booking.employee.name}`);
        }
      });
      
      setBookings(data);
      setError('');
    } catch (err) {
      console.error('❌ Error loading bookings:', err);
      setError('Failed to load bookings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    try {
      await cancelBooking(bookingId);
      alert('Booking cancelled successfully!');
      loadBookings(); // Reload bookings
    } catch (err) {
      console.error('Error cancelling booking:', err);
      alert(err.response?.data?.message || 'Failed to cancel booking. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Confirmed':
        return 'status-confirmed';
      case 'Pending':
        return 'status-pending';
      case 'Completed':
        return 'status-completed';
      case 'Cancelled':
        return 'status-cancelled';
      default:
        return 'status-pending';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Confirmed':
        return '✓ Confirmed';
      case 'Pending':
        return '⏳ Pending';
      case 'Completed':
        return '✓ Completed';
      case 'Cancelled':
        return '✗ Cancelled';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="my-bookings-container">
        <div className="bookings-loading">Loading your bookings...</div>
      </div>
    );
  }

  return (
    <div className="my-bookings-container">
      <div className="bookings-header">
        <h1>My Bookings</h1>
        <p>View and manage your appointments</p>
      </div>

      {error && (
        <div className="bookings-error">
          {error}
        </div>
      )}

      {bookings.length === 0 ? (
        <div className="no-bookings">
          <div className="no-bookings-icon">📅</div>
          <h2>No bookings yet</h2>
          <p>You haven't made any bookings yet. Start booking a session with our experts!</p>
          <button className="browse-experts-btn" onClick={() => navigate('/')}>
            Browse Experts
          </button>
        </div>
      ) : (
        <div className="bookings-list">
          {bookings.map((booking) => {
            // Debug: Log booking data
            if (!booking.employee?.name) {
              console.warn('Booking missing employee name:', {
                bookingId: booking._id,
                employee: booking.employee,
                employeeId: booking.employee?._id
              });
            }
            
            const employeeName = booking.employee?.name || 'Unknown Therapist';
            const employeeId = booking.employee?._id || booking.employee;
            const employeeTitle = booking.employee?.title || '';
            
            return (
            <div key={booking._id} className="booking-card">
              <div className="booking-card-header">
                <div className="booking-employee-info">
                  <div className="employee-avatar">
                    {employeeName !== 'Unknown Therapist' ? employeeName.charAt(0).toUpperCase() : 'E'}
                  </div>
                  <div className="employee-details">
                    <h3>{employeeName}</h3>
                    <p className="employee-title">{employeeTitle}</p>
                  </div>
                </div>
                <div className={`booking-status ${getStatusColor(booking.status)}`}>
                  {getStatusBadge(booking.status)}
                </div>
              </div>

              <div className="booking-details">
                <div className="detail-item">
                  <span className="detail-label">📅 Date:</span>
                  <span className="detail-value">{formatDate(booking.bookingDate)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">🕐 Time:</span>
                  <span className="detail-value">{booking.bookingTime} IST</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">💻 Type:</span>
                  <span className="detail-value">
                    {booking.type === 'Online' ? 'Video Call' : 'In-Person'}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">💰 Amount:</span>
                  <span className="detail-value">
                    {booking.price?.currency || '₹'}{booking.price?.amount || 0}
                  </span>
                </div>
                {booking.paymentId && (
                  <div className="detail-item">
                    <span className="detail-label">💳 Payment ID:</span>
                    <span className="detail-value">{booking.paymentId}</span>
                  </div>
                )}
              </div>

              {booking.notes && (
                <div className="booking-notes">
                  <strong>Notes:</strong> {booking.notes}
                </div>
              )}

              <div className="booking-actions">
                {booking.status === 'Pending' && (
                  <>
                    <button
                      className="pay-now-btn"
                      onClick={() => {
                        if (!booking.employee || !booking.employee._id) {
                          alert('Employee information is missing. Please contact support.');
                          return;
                        }
                        
                        // Format date for BookingPage
                        const bookingDate = new Date(booking.bookingDate);
                        const formattedDate = bookingDate.toISOString().split('T')[0];
                        
                        console.log('Navigating to payment page with booking:', {
                          bookingId: booking._id,
                          employeeId: booking.employee._id,
                          date: formattedDate,
                          time: booking.bookingTime
                        });
                        
                        // Navigate to payment page with booking details
                        navigate(`/booking/${booking.employee._id}`, {
                          state: {
                            employee: booking.employee,
                            sessionType: booking.type === 'Online' ? 'Video' : booking.type,
                            duration: booking.employee?.price?.duration || 50,
                            selectedDate: formattedDate,
                            selectedTime: booking.bookingTime,
                            existingBookingId: booking._id,
                            isExistingBooking: true
                          }
                        });
                      }}
                    >
                      Pay Now
                    </button>
                    <button
                      className="cancel-btn"
                      onClick={() => handleCancelBooking(booking._id)}
                    >
                      Cancel Booking
                    </button>
                  </>
                )}
                {(booking.status === 'Confirmed' || booking.status === 'Pending') && employeeId && (
                  <button
                    className="view-details-btn"
                    onClick={() => {
                      const id = typeof employeeId === 'string' ? employeeId : employeeId.toString();
                      console.log('Navigating to employee profile:', id);
                      navigate(`/employee/${id}`);
                    }}
                  >
                    View Profile
                  </button>
                )}
              </div>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default MyBookings;
