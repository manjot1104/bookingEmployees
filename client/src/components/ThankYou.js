import React, { useEffect, useState, useCallback } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { getBooking } from '../services/api';
import './ThankYou.css';

function ThankYou() {
  const location = useLocation();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  const bookingId = location.state?.bookingId;

  const loadBooking = useCallback(async () => {
    if (!bookingId) {
      setLoading(false);
      return;
    }
    
    try {
      const bookingData = await getBooking(bookingId);
      setBooking(bookingData);
    } catch (error) {
      console.error('Error loading booking:', error);
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    loadBooking();
  }, [loadBooking]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    return timeString;
  };

  if (loading) {
    return (
      <div className="thank-you-container">
        <div className="thank-you-content">
          <div className="loading-spinner">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="thank-you-container">
      <div className="thank-you-content">
        <div className="success-icon">
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="40" cy="40" r="40" fill="#4CAF50" opacity="0.1"/>
            <path d="M40 20C28.95 20 20 28.95 20 40C20 51.05 28.95 60 40 60C51.05 60 60 51.05 60 40C60 28.95 51.05 20 40 20ZM33 48L25 40L27.82 37.18L33 42.36L52.18 23.18L55 26L33 48Z" fill="#4CAF50"/>
          </svg>
        </div>

        <h1 className="thank-you-title">Thank You!</h1>
        <p className="thank-you-subtitle">Your booking has been confirmed</p>

        {booking && (
          <div className="booking-details-card">
            <h2 className="details-title">Booking Details</h2>
            
            <div className="detail-row">
              <span className="detail-label">👤 Expert:</span>
              <span className="detail-value">{booking.employeeName || booking.employee?.name || 'N/A'}</span>
            </div>

            {booking.employeeTitle && (
              <div className="detail-row">
                <span className="detail-label">💼 Title:</span>
                <span className="detail-value">{booking.employeeTitle || booking.employee?.title || 'N/A'}</span>
              </div>
            )}

            <div className="detail-row">
              <span className="detail-label">📅 Date:</span>
              <span className="detail-value">{formatDate(booking.bookingDate)}</span>
            </div>

            <div className="detail-row">
              <span className="detail-label">⏰ Time:</span>
              <span className="detail-value">{formatTime(booking.bookingTime)}</span>
            </div>

            <div className="detail-row">
              <span className="detail-label">💻 Type:</span>
              <span className="detail-value">{booking.type || 'Online'}</span>
            </div>

            <div className="detail-row">
              <span className="detail-label">💰 Amount Paid:</span>
              <span className="detail-value amount-paid">
                ₹{booking.price?.amount || booking.originalAmount || 'N/A'}
                {booking.originalAmount && booking.price?.amount && booking.originalAmount !== booking.price.amount && (
                  <span className="original-amount"> (₹{booking.originalAmount})</span>
                )}
              </span>
            </div>

            {booking.discountCode && (
              <div className="detail-row discount-info">
                <span className="detail-label">🎉 Discount Applied:</span>
                <span className="detail-value">{booking.discountCode} - ₹{booking.discountAmount || 0} off</span>
              </div>
            )}

            {booking.paymentId && (
              <div className="detail-row">
                <span className="detail-label">💳 Payment ID:</span>
                <span className="detail-value payment-id">{booking.paymentId}</span>
              </div>
            )}

            {booking.paymentOrderId && (
              <div className="detail-row">
                <span className="detail-label">📋 Order ID:</span>
                <span className="detail-value order-id">{booking.paymentOrderId}</span>
              </div>
            )}

            <div className="detail-row">
              <span className="detail-label">✅ Status:</span>
              <span className={`detail-value status ${booking.status?.toLowerCase()}`}>
                {booking.status || 'Confirmed'}
              </span>
            </div>
          </div>
        )}

        <div className="next-steps">
          <h3 className="next-steps-title">What's Next?</h3>
          <ul className="steps-list">
            <li>You will receive a confirmation email shortly with all the details</li>
            <li>For online sessions, you'll receive a meeting link before your appointment</li>
            <li>You can view and manage your bookings from the "My Bookings" page</li>
          </ul>
        </div>

        <div className="action-buttons">
          <Link to="/my-bookings" className="btn btn-primary">
            View My Bookings
          </Link>
          <Link to="/" className="btn btn-secondary">
            Browse More Experts
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ThankYou;
