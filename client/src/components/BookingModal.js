import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { createBooking, createRazorpayOrder, verifyRazorpayPayment } from '../services/api';
import { isDatePast, isToday, isTimePassedToday, formatISTDateString, getCurrentISTDate, timeToMinutes } from '../utils/dateUtils';
import './BookingModal.css';

// Load Razorpay script
const loadRazorpay = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(window.Razorpay);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => {
      resolve(window.Razorpay);
    };
    script.onerror = () => {
      resolve(null);
    };
    document.body.appendChild(script);
  });
};

function BookingModal({ employee, onClose, onBookingSuccess, isAuthenticated, user }) {
  const navigate = useNavigate();
  const bookingType = 'Online'; // Always Online
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [notes, setNotes] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  const loadAvailableSlots = useCallback(() => {
    const slots = employee.availableSlots?.filter(
      slot => slot.type === bookingType && !slot.isBooked
    ) || [];

    const futureSlots = slots.filter(slot => {
      const slotDate = new Date(slot.date);
      
      // Exclude past dates
      if (isDatePast(slotDate)) return false;
      
      // Exclude Sundays
      if (slotDate.getDay() === 0) return false;
      
      // Filter by working hours
      const workingHours = ['10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM'];
      if (!workingHours.includes(slot.time)) return false;
      
      // If it's today, exclude past times
      if (isToday(slotDate) && isTimePassedToday(slot.time)) return false;
      
      return true;
    });

    setAvailableSlots(futureSlots);
  }, [employee, bookingType]);

  useEffect(() => {
    loadAvailableSlots();
    // Load Razorpay script
    loadRazorpay().then(() => {
      setRazorpayLoaded(true);
    });
  }, [loadAvailableSlots]);

  const getAvailableDates = () => {
    // Get unique dates from available slots
    const slotDates = [...new Set(availableSlots.map(slot => {
      const date = new Date(slot.date);
      return formatISTDateString(date);
    }))].sort();

    // If we have dates from slots, return them
    if (slotDates.length > 0) {
      return slotDates;
    }

    // If no slots available, generate next 30 days (excluding Sundays and past dates)
    // This ensures users can still see dates even if slots haven't been created yet
    const today = getCurrentISTDate();
    const futureDates = [];
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      
      // Skip Sundays
      if (date.getDay() === 0) continue;
      
      // Skip past dates
      if (isDatePast(date)) continue;
      
      const dateStr = formatISTDateString(date);
      futureDates.push(dateStr);
    }

    return futureDates;
  };

  const getAvailableTimes = (date) => {
    // Define time ranges
    const timeRanges = [
      { label: '10:00 AM - 01:00 PM', start: '10:00 AM', end: '01:00 PM' },
      { label: '01:00 PM - 04:00 PM', start: '01:00 PM', end: '04:00 PM' },
      { label: '04:00 PM - 07:00 PM', start: '04:00 PM', end: '07:00 PM' }
    ];
    
    // Convert date string to Date object for comparison
    const targetDate = new Date(date);
    const targetDateStr = formatISTDateString(targetDate);
    const isTargetToday = isToday(targetDate);
    
    // Get available slots for this date
    const dateSlots = availableSlots.filter(slot => {
      const slotDate = new Date(slot.date);
      const slotDateStr = formatISTDateString(slotDate);
      
      // If it's today, exclude past times
      const isSlotToday = isToday(slotDate);
      const isPastTime = isSlotToday && isTimePassedToday(slot.time);
      
      return slotDateStr === targetDateStr && !isPastTime;
    });
    
    // Check which time ranges are available
    const availableRanges = timeRanges.filter(range => {
      // If it's today, check if the range start time has passed
      if (isTargetToday) {
        if (isTimePassedToday(range.start)) {
          return false;
        }
      }
      
      // If we have slots, check if any slot falls in this range
      if (dateSlots.length > 0) {
        const rangeStartMinutes = timeToMinutes(range.start);
        const rangeEndMinutes = timeToMinutes(range.end);
        
        return dateSlots.some(slot => {
          const slotMinutes = timeToMinutes(slot.time);
          return slotMinutes >= rangeStartMinutes && slotMinutes < rangeEndMinutes;
        });
      }
      
      // If no slots, show all ranges (they can be booked)
      return true;
    });
    
    return availableRanges.map(range => range.label);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!isAuthenticated) {
      // Redirect to login with return path
      onClose(); // Close modal first
      navigate(`/login?redirect=/employee/${employee._id}`, {
        state: {
          from: `/employee/${employee._id}`,
          message: 'Please login to book a session'
        }
      });
      return;
    }
    
    if (!selectedDate || !selectedTime) {
      setError('Please select a date and time');
      return;
    }

    if (!razorpayLoaded) {
      setError('Payment gateway is loading. Please wait...');
      return;
    }

    setLoading(true);

    try {
      // Extract start time from range (e.g., "10:00 AM - 01:00 PM" -> "10:00 AM")
      const bookingTime = selectedTime.includes(' - ') 
        ? selectedTime.split(' - ')[0] 
        : selectedTime;
      
      // Step 1: Create booking
      const bookingResponse = await createBooking({
        employeeId: employee._id,
        bookingDate: selectedDate,
        bookingTime: bookingTime,
        type: bookingType,
        notes
      });

      const bookingId = bookingResponse.booking._id;
      
      // Use the discounted price from booking response (server already applies 20% discount)
      // The server calculates: finalAmount = originalAmount - (originalAmount * 0.2)
      const booking = bookingResponse.booking;
      
      // Extract price - handle both object and direct number formats
      let discountedPrice;
      if (booking.price && typeof booking.price === 'object' && booking.price.amount) {
        discountedPrice = booking.price.amount;
      } else if (typeof booking.price === 'number') {
        discountedPrice = booking.price;
      }
      
      const originalPrice = booking.originalAmount || employee.price.amount;
      
      console.log('💰 Booking Price Details:', {
        bookingId: bookingId,
        originalPrice: originalPrice,
        discountedPrice: discountedPrice,
        discountAmount: booking.discountAmount,
        discountCode: booking.discountCode,
        bookingPrice: booking.price,
        bookingPriceType: typeof booking.price,
        fullBooking: booking
      });

      // Use discounted price if available, otherwise calculate it
      const price = discountedPrice || Math.round(originalPrice * 0.8);
      
      if (!price || price <= 0) {
        throw new Error('Invalid booking price. Please try again.');
      }

      // Step 2: Create Razorpay order
      // Note: Server will use booking's price from database, but we pass it for reference
      const orderResponse = await createRazorpayOrder(bookingId, price);

      // Step 3: Open Razorpay checkout
      const options = {
        key: orderResponse.key,
        amount: orderResponse.amount,
        currency: orderResponse.currency,
        name: 'Booking Platform',
        description: `Booking with ${employee.name}`,
        order_id: orderResponse.orderId,
        handler: async function (response) {
          // Payment successful
          try {
            await verifyRazorpayPayment(
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature,
              bookingId
            );

            // Redirect to thank you page with booking ID
            onBookingSuccess();
            onClose();
            navigate('/thank-you', { state: { bookingId } });
          } catch (error) {
            console.error('Payment verification error:', error);
            alert('Payment verification failed. Please contact support.');
            setLoading(false);
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.phone || ''
        },
        theme: {
          color: '#4A90E2'
        },
        modal: {
          ondismiss: function() {
            setLoading(false);
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', function (response) {
        alert('Payment failed. Please try again.');
        setLoading(false);
      });
      
      razorpay.open();
      setLoading(false);
    } catch (err) {
      console.error('Booking/Payment error:', err);
      // Show more detailed error message
      const errorMessage = err.message || err.response?.data?.message || err.response?.data?.error || 'Failed to create payment order';
      setError(errorMessage);
      setLoading(false);
      
      // Log full error for debugging
      console.error('Full error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
    }
  };

  const formatDateDisplay = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    date.setHours(0, 0, 0, 0);
    
    if (date.getTime() === today.getTime()) {
      return 'Today';
    } else if (date.getTime() === tomorrow.getTime()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        
        <h2>Book Appointment with {employee.name}</h2>
        
        <div className="employee-summary">
          <p><strong>Experience:</strong> {employee.experience}</p>
          <p><strong>Price:</strong> 
            <span className="price-with-cut">
              <span className="original-price-cut">{employee.price.currency}{employee.price.amount}</span>
              <span className="discount-badge-small">20% OFF</span>
            </span>
            {' '}
            <span className="discounted-price-text">{employee.price.currency}{Math.round(employee.price.amount * 0.8)} for {employee.price.duration} mins</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="booking-form">
          <div className="form-group">
            <label>Select Date</label>
            <button
              type="button"
              className="date-picker-button"
              onClick={() => setShowCalendar(!showCalendar)}
            >
              {selectedDate ? formatDateDisplay(selectedDate) : 'Choose a date'}
            </button>
            {showCalendar && (
              <div className="calendar-grid" onClick={(e) => e.stopPropagation()}>
                {getAvailableDates().map(date => {
                  const dateObj = new Date(date);
                  const isSelected = selectedDate === date;
                  const hasSlots = availableSlots.some(slot => {
                    const slotDate = new Date(slot.date);
                    return formatISTDateString(slotDate) === date;
                  });
                  
                  return (
                    <button
                      key={date}
                      type="button"
                      className={`calendar-date-cell ${isSelected ? 'selected' : ''} ${!hasSlots ? 'no-slots' : ''}`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSelectedDate(date);
                        setSelectedTime('');
                        setShowCalendar(false);
                      }}
                    >
                      <div className="date-day">{dateObj.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                      <div className="date-number">{dateObj.getDate()}</div>
                      <div className="date-month">{dateObj.toLocaleDateString('en-US', { month: 'short' })}</div>
                    </button>
                  );
                })}
              </div>
            )}
            {!selectedDate && <input type="hidden" value="" required />}
          </div>

          {selectedDate && (
            <div className="form-group">
              <label>Select Time</label>
              <select
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                required
              >
                <option value="">Choose a time</option>
                {getAvailableTimes(selectedDate).map(time => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group">
            <label>Notes (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special requirements or notes..."
              rows="3"
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="submit-btn" disabled={loading || !razorpayLoaded}>
              {loading ? 'Processing...' : !razorpayLoaded ? 'Loading Payment...' : 'Confirm Booking & Pay'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default BookingModal;
