import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { createBooking } from '../services/api';
import { getCurrentISTDate, isDatePast, isToday, isTimePassedToday, formatISTDateString } from '../utils/dateUtils';
import './BookingModal.css';

function BookingModal({ employee, onClose, onBookingSuccess, isAuthenticated }) {
  const navigate = useNavigate();
  const [bookingType, setBookingType] = useState('Online');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [notes, setNotes] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadAvailableSlots = useCallback(() => {
    const slots = employee.availableSlots?.filter(
      slot => slot.type === bookingType && !slot.isBooked
    ) || [];

    const todayIST = getCurrentISTDate();

    const futureSlots = slots.filter(slot => {
      const slotDate = new Date(slot.date);
      
      // Exclude past dates
      if (isDatePast(slotDate)) return false;
      
      // Exclude Sundays
      if (slotDate.getDay() === 0) return false;
      
      // Filter by working hours
      const workingHours = ['10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'];
      if (!workingHours.includes(slot.time)) return false;
      
      // If it's today, exclude past times
      if (isToday(slotDate) && isTimePassedToday(slot.time)) return false;
      
      return true;
    });

    setAvailableSlots(futureSlots);
  }, [employee, bookingType]);

  useEffect(() => {
    loadAvailableSlots();
  }, [loadAvailableSlots]);

  const getAvailableDates = () => {
    const dates = [...new Set(availableSlots.map(slot => {
      const date = new Date(slot.date);
      return formatISTDateString(date);
    }))].sort();

    return dates;
  };

  const getAvailableTimes = (date) => {
    const workingHours = ['10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'];
    
    return availableSlots
      .filter(slot => {
        const slotDate = new Date(slot.date);
        const slotDateStr = formatISTDateString(slotDate);
        const targetDateStr = formatISTDateString(date);
        
        // If it's today, exclude past times
        const isSlotToday = isToday(slotDate);
        const isPastTime = isSlotToday && isTimePassedToday(slot.time);
        
        return slotDateStr === targetDateStr && !isPastTime;
      })
      .map(slot => slot.time)
      .sort((a, b) => {
        const timeOrder = workingHours.indexOf(a) - workingHours.indexOf(b);
        return timeOrder;
      });
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

    setLoading(true);

    try {
      await createBooking({
        employeeId: employee._id,
        bookingDate: selectedDate,
        bookingTime: selectedTime,
        type: bookingType,
        notes
      });

      onBookingSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create booking. Please try again.');
    } finally {
      setLoading(false);
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
          <p><strong>Price:</strong> {employee.price.currency}{employee.price.amount} for {employee.price.duration} mins</p>
        </div>

        <form onSubmit={handleSubmit} className="booking-form">
          <div className="form-group">
            <label>Booking Type</label>
            <div className="booking-type-tabs">
              <button
                type="button"
                className={bookingType === 'Online' ? 'active' : ''}
                onClick={() => {
                  setBookingType('Online');
                  setSelectedDate('');
                  setSelectedTime('');
                }}
              >
                Online
              </button>
              <button
                type="button"
                className={bookingType === 'In-person' ? 'active' : ''}
                onClick={() => {
                  setBookingType('In-person');
                  setSelectedDate('');
                  setSelectedTime('');
                }}
              >
                In-person
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>Select Date</label>
            <select
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setSelectedTime('');
              }}
              required
            >
              <option value="">Choose a date</option>
              {getAvailableDates().map(date => (
                <option key={date} value={date}>
                  {formatDateDisplay(date)}
                </option>
              ))}
            </select>
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
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Booking...' : 'Confirm Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default BookingModal;
