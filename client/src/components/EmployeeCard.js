import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentISTDate, isDatePast, isToday, isTimePassedToday } from '../utils/dateUtils';
import './EmployeeCard.css';

function EmployeeCard({ employee, onBookClick }) {
  const navigate = useNavigate();
  const [bookingType, setBookingType] = useState('Online');

  // Working hours: 10:00 AM to 6:00 PM
  const workingHours = ['10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'];
  
  const availableSlots = employee.availableSlots?.filter(
    slot => {
      // Filter by booking type and not booked
      if (slot.type !== bookingType || slot.isBooked) return false;
      
      // Filter by working hours
      if (!workingHours.includes(slot.time)) return false;
      
      // Exclude Sundays
      const slotDate = new Date(slot.date);
      if (slotDate.getDay() === 0) return false;
      
      // Exclude past dates
      if (isDatePast(slotDate)) return false;
      
      // If it's today, exclude past times
      if (isToday(slotDate) && isTimePassedToday(slot.time)) return false;
      
      return true;
    }
  ) || [];

  const getNextAvailableSlot = () => {
    if (availableSlots.length === 0) return null;
    
    const todayIST = getCurrentISTDate();
    
    const futureSlots = availableSlots.filter(slot => {
      const slotDate = new Date(slot.date);
      
      // Exclude Sundays
      if (slotDate.getDay() === 0) return false;
      
      // Exclude past dates
      if (isDatePast(slotDate)) return false;
      
      // If it's today, exclude past times
      if (isToday(slotDate) && isTimePassedToday(slot.time)) return false;
      
      return true;
    });
    
    if (futureSlots.length === 0) return availableSlots[0];
    
    futureSlots.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      if (dateA.getTime() !== dateB.getTime()) {
        return dateA - dateB;
      }
      // Sort by working hours order
      const timeOrder = workingHours.indexOf(a.time) - workingHours.indexOf(b.time);
      return timeOrder;
    });
    
    return futureSlots[0];
  };

  const nextSlot = getNextAvailableSlot();
  
  const formatDate = (dateString) => {
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
      return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="employee-card">
      {employee.title === 'Child and Youth Psychiatrist' && (
        <div className="badge">Children First Expert</div>
      )}
      
      <div className="card-content">
        <div className="employee-image">
          {employee.image ? (
            <img 
              src={employee.image} 
              alt={employee.name}
              className="employee-photo"
              onError={(e) => {
                // Fallback to placeholder if image fails to load
                e.target.style.display = 'none';
                const placeholder = e.target.parentElement.querySelector('.image-placeholder');
                if (placeholder) placeholder.style.display = 'flex';
              }}
            />
          ) : null}
          <div className="image-placeholder" style={{ display: employee.image ? 'none' : 'flex' }}>
            {employee.name.charAt(0)}
          </div>
        </div>

        <div className="employee-details">
          <h3 className="employee-name">{employee.name}</h3>
          <p className="employee-experience">{employee.experience}</p>
          <p className="employee-price">
            {employee.price.currency}{employee.price.amount} for {employee.price.duration} mins
          </p>

          <div className="expertise-tags">
            {employee.expertise?.slice(0, 4).map((exp, index) => (
              <span key={index} className="expertise-tag">{exp}</span>
            ))}
          </div>

          <p className="languages">
            Speaks: {employee.languages?.join(', ')}
          </p>

          <div className="booking-options">
            <div className="booking-type-tabs">
              <button
                className={bookingType === 'Online' ? 'active' : ''}
                onClick={() => setBookingType('Online')}
              >
                Online
              </button>
              <button
                className={bookingType === 'In-person' ? 'active' : ''}
                onClick={() => setBookingType('In-person')}
              >
                In-person
              </button>
            </div>

            <div className="video-option">
              <input type="checkbox" id={`video-${employee._id}`} defaultChecked />
              <label htmlFor={`video-${employee._id}`}>Video</label>
            </div>

            {nextSlot && (
              <p className="next-slot">
                Next {bookingType.toLowerCase()} slot: <span className="slot-time">
                  {formatDate(nextSlot.date)}, {nextSlot.time}
                </span>
              </p>
            )}

            <div className="card-actions">
              <button 
                className="view-profile-btn"
                onClick={() => navigate(`/employee/${employee._id}`)}
              >
                VIEW PROFILE
              </button>
              <button 
                className="book-btn"
                onClick={() => onBookClick(employee)}
              >
                BOOK
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmployeeCard;
