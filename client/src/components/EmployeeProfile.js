import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEmployee } from '../services/api';
import { getCurrentISTDate, isDatePast, isToday, isTimePassedToday, formatISTDateString } from '../utils/dateUtils';
import './EmployeeProfile.css';

function EmployeeProfile({ user, isAuthenticated }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionType, setSessionType] = useState('Online');
  const [duration] = useState(45); // Fixed at 45 minutes for all sessions
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [showFullBio, setShowFullBio] = useState(false);

  const loadEmployee = useCallback(async () => {
    try {
      const data = await getEmployee(id);
      console.log('Employee data loaded:', data);
      console.log('Available slots:', data.availableSlots);
      setEmployee(data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading employee:', error);
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadEmployee();
  }, [loadEmployee]);

  useEffect(() => {
    // Reset selection when session type changes
    setSelectedDate(null);
    setSelectedTime('');
  }, [sessionType]);

  const getAvailableDates = () => {
    if (!employee?.availableSlots || employee.availableSlots.length === 0) {
      console.log('No available slots in employee data');
      return [];
    }
    
    // Map "Video" to "Online" for compatibility
    const slotType = sessionType === 'Video' ? 'Online' : sessionType;
    
    const slots = employee.availableSlots.filter(
      slot => slot.type === slotType && !slot.isBooked
    );

    console.log('Filtered slots for', sessionType, ':', slots.length);

    const todayIST = getCurrentISTDate();

    const futureSlots = slots.filter(slot => {
      // Handle both string and Date objects
      let slotDate;
      if (slot.date instanceof Date) {
        slotDate = new Date(slot.date);
      } else if (typeof slot.date === 'string') {
        slotDate = new Date(slot.date);
      } else {
        // Handle MongoDB date format
        slotDate = new Date(slot.date);
      }
      
      // Exclude past dates (before today in IST)
      if (isDatePast(slotDate)) {
        return false;
      }
      
      // Exclude Sundays (day 0)
      const dayOfWeek = slotDate.getDay();
      if (dayOfWeek === 0) {
        return false;
      }
      
      // Filter only working hours (10:00 AM to 6:00 PM)
      const workingHours = ['10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'];
      if (!workingHours.includes(slot.time)) {
        return false;
      }
      
      // If it's today, exclude past times
      if (isToday(slotDate) && isTimePassedToday(slot.time)) {
        return false;
      }
      
      return true;
    });

    console.log('Future slots:', futureSlots.length);

    const dates = [...new Set(futureSlots.map(slot => {
      let date;
      if (slot.date instanceof Date) {
        date = new Date(slot.date);
      } else if (typeof slot.date === 'string') {
        date = new Date(slot.date);
      } else {
        date = new Date(slot.date);
      }
      return formatISTDateString(date);
    }))].sort();
    
    // Ensure we show at least 7 days, generate dates if needed
    const allDates = [...dates];
    
    // If we have less than 7 unique dates, generate additional dates
    if (allDates.length < 7) {
      for (let i = 0; allDates.length < 7; i++) {
        const checkDate = new Date(todayIST);
        checkDate.setDate(checkDate.getDate() + i);
        
        // Skip Sundays (day 0)
        if (checkDate.getDay() === 0) continue;
        
        // Skip past dates
        if (isDatePast(checkDate)) continue;
        
        const dateStr = formatISTDateString(checkDate);
        if (!allDates.includes(dateStr)) {
          allDates.push(dateStr);
        }
      }
    }
    
    // Sort and return first 7
    const sortedDates = allDates.sort();
    console.log('Available dates:', sortedDates.slice(0, 7));
    return sortedDates.slice(0, 7);
  };

  const getAvailableTimes = (date) => {
    if (!employee?.availableSlots) return [];
    
    // Map "Video" to "Online" for compatibility
    const slotType = sessionType === 'Video' ? 'Online' : sessionType;
    
    // Working hours: 10:00 AM to 6:00 PM
    const workingHours = ['10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'];
    
    // Get all slots for this date and type
    const slotsForDate = employee.availableSlots.filter(slot => {
      let slotDate;
      if (slot.date instanceof Date) {
        slotDate = new Date(slot.date);
      } else if (typeof slot.date === 'string') {
        slotDate = new Date(slot.date);
      } else {
        slotDate = new Date(slot.date);
      }
      
      const slotDateStr = formatISTDateString(slotDate);
      const targetDateStr = formatISTDateString(date);
      
      return slotDateStr === targetDateStr && slot.type === slotType;
    });
    
    // Create a map of all working hours with their booking status
    const timeSlots = workingHours.map(time => {
      const slot = slotsForDate.find(s => s.time === time);
      const isSlotToday = isToday(new Date(date));
      const isPastTime = isSlotToday && isTimePassedToday(time);
      
      return {
        time,
        isBooked: slot ? slot.isBooked : false,
        isPast: isPastTime,
        isAvailable: slot && !slot.isBooked && !isPastTime
      };
    });
    
    console.log('Time slots for', date, ':', timeSlots);
    return timeSlots;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    date.setHours(0, 0, 0, 0);
    
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    if (date.getTime() === today.getTime()) {
      return { day: days[date.getDay()], label: 'Today', date: date.getDate(), month: months[date.getMonth()] };
    } else if (date.getTime() === tomorrow.getTime()) {
      return { day: days[date.getDay()], label: 'Tomorrow', date: date.getDate(), month: months[date.getMonth()] };
    } else {
      return { 
        day: days[date.getDay()], 
        label: `${days[date.getDay()]} ${date.getDate()}${getOrdinal(date.getDate())} ${months[date.getMonth()]}`, 
        date: date.getDate(), 
        month: months[date.getMonth()] 
      };
    }
  };

  const getOrdinal = (n) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
  };

  const handleProceed = () => {
    if (!isAuthenticated) {
      // Redirect to login with return path
      navigate(`/login?redirect=/employee/${employee._id}`, {
        state: {
          from: `/employee/${employee._id}`,
          bookingData: {
            employee,
            sessionType,
            duration,
            selectedDate,
            selectedTime
          }
        }
      });
      return;
    }

    if (!selectedDate || !selectedTime) {
      alert('Please select a date and time');
      return;
    }
    // Navigate to booking page
    navigate(`/booking/${employee._id}`, {
      state: {
        employee,
        sessionType,
        duration,
        selectedDate,
        selectedTime
      }
    });
  };

  const calculatePrice = () => {
    if (!employee) return 0;
    // All sessions are 45 minutes, so price is the base price
    return employee.price.amount;
  };

  if (loading) {
    return <div className="profile-loading">Loading...</div>;
  }

  if (!employee) {
    return <div className="profile-error">Employee not found</div>;
  }

  const availableDates = getAvailableDates();
  const times = selectedDate ? getAvailableTimes(selectedDate) : [];
  const price = calculatePrice();

  // Debug logging
  if (employee) {
    console.log('Employee Profile Render:', {
      employeeName: employee.name,
      totalSlots: employee.availableSlots?.length || 0,
      sessionType,
      availableDates: availableDates.length,
      selectedDate,
      timesAvailable: times.length
    });
  }

  return (
    <div className="employee-profile">
      <div className="profile-container">
        {/* Left Section - Profile Details */}
        <div className="profile-left">
          <button className="back-button" onClick={() => navigate('/')}>
            ← Back
          </button>

          <div className="profile-header">
            <div className="profile-image-large">
              {employee.image ? (
                <img 
                  src={employee.image} 
                  alt={employee.name}
                  className="employee-photo-large"
                  onError={(e) => {
                    // Fallback to placeholder if image fails to load
                    e.target.style.display = 'none';
                    const placeholder = e.target.parentElement.querySelector('.image-placeholder-large');
                    if (placeholder) placeholder.style.display = 'flex';
                  }}
                />
              ) : null}
              <div className="image-placeholder-large" style={{ display: employee.image ? 'none' : 'flex' }}>
                {employee.name.charAt(0)}
              </div>
            </div>
            <div className="profile-info">
              <h1>{employee.name}</h1>
              <p className="profile-title">{employee.title}</p>
              {employee.registrationNumber && (
                <p className="registration">Reg. No.: {employee.registrationNumber}</p>
              )}
              <div className="profile-details">
                {employee.qualifications && (
                  <div className="detail-item">
                    <span className="detail-icon">🎓</span>
                    <span>{employee.qualifications}</span>
                  </div>
                )}
                <div className="detail-item">
                  <span className="detail-icon">💼</span>
                  <span>{employee.experience}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Video Section */}
          {employee.video && (
            <div className="profile-video-section">
              <div className="section-header">
                <span className="section-icon">🎥</span>
                <h3>Introduction Video</h3>
              </div>
              <div className="video-container">
                <video
                  className="therapist-video"
                  src={employee.video}
                  controls
                  playsInline
                  preload="metadata"
                  poster={employee.image}
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
          )}

          <div className="profile-bio">
            <p>
              {employee.description || `${employee.name} is a ${employee.title.toLowerCase()} based in ${employee.center || 'our center'}.`}
              {!showFullBio && employee.bio && employee.bio.length > 200 && (
                <span> {employee.bio.substring(0, 200)}...</span>
              )}
              {showFullBio && employee.bio && (
                <span> {employee.bio}</span>
              )}
            </p>
            {employee.bio && employee.bio.length > 200 && (
              <button className="read-more" onClick={() => setShowFullBio(!showFullBio)}>
                {showFullBio ? 'Read less' : 'Read more'}
              </button>
            )}
          </div>

          <div className="profile-section">
            <div className="section-header">
              <span className="section-icon">🧠</span>
              <h3>Concerns I can help with</h3>
            </div>
            <ul className="concerns-list">
              {employee.expertise?.slice(0, 5).map((concern, index) => (
                <li key={index}>
                  <span className="quote-icon">"</span>
                  {concern}
                </li>
              ))}
            </ul>
          </div>

          <div className="profile-section">
            <div className="section-header">
              <span className="section-icon">👥</span>
              <h3>I offer psychiatry for</h3>
            </div>
            <div className="conditions-scroll">
              <div className="conditions-list">
                {employee.expertise?.map((condition, index) => (
                  <div key={index} className="condition-item">
                    <div className="condition-icon">
                      {index % 4 === 0 ? '🧵' : index % 4 === 1 ? '☁️' : index % 4 === 2 ? '📎' : '👁️'}
                    </div>
                    <span>{condition}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="profile-section">
            <div className="section-header">
              <span className="section-icon">🎯</span>
              <h3>My Affiliations</h3>
            </div>
            <p className="affiliation-text">
              {employee.affiliations || `Senior Consultant ${employee.title} at Booking Platform from ${new Date().getFullYear() - parseInt(employee.experience)} to present.`}
            </p>
          </div>

          <div className="profile-section">
            <div className="section-header">
              <span className="section-icon">❓</span>
              <h3>FAQs</h3>
            </div>
            <div className="faq-item">
              <h4>Why did you choose to become a {employee.title.toLowerCase()}?</h4>
              <p>
                {employee.faqAnswer || `I was always curious about human behavior and the mind. My interest in understanding how people think and feel led me to pursue a career in ${employee.title.toLowerCase()}.`}
              </p>
            </div>
          </div>

          <div className="profile-section">
            <div className="section-header">
              <span className="section-icon">💬</span>
              <h3>Testimonials</h3>
            </div>
            <div className="testimonial">
              <p>
                {employee.testimonial || `Sessions with ${employee.name.split(' ')[0]} are going great. They have been really helpful, and I have noticed significant progress after meeting them. However, it's a long journey and I look forward to seeing them frequently.`}
              </p>
              <span className="testimonial-author">- Anonymous</span>
            </div>
          </div>
        </div>

        {/* Right Section - Booking Interface */}
        <div className="profile-right">
          <div className="booking-sidebar">
            <div className="discount-banner">
              <strong>20% Off</strong>
              <p>20% Off on Pre-booking First Session</p>
            </div>

            <div className="booking-section">
              <h3>What type of session would you like?</h3>
              <div className="session-type-buttons">
                <button
                  className={sessionType === 'In-person' ? 'active' : ''}
                  onClick={() => {
                    setSessionType('In-person');
                    setSelectedDate(null);
                    setSelectedTime('');
                  }}
                >
                  In-Person
                </button>
                <button
                  className={sessionType === 'Online' ? 'active' : ''}
                  onClick={() => {
                    setSessionType('Online');
                    setSelectedDate(null);
                    setSelectedTime('');
                  }}
                >
                  Video
                </button>
              </div>
            </div>

            <div className="booking-section">
              <h3>Session Duration</h3>
              <div className="duration-info">
                <span>45 mins, 1 session</span>
                <span className="price">₹{price} /session</span>
              </div>
            </div>

            <div className="booking-section">
              <div className="section-header-small">
                <span className="calendar-icon">📅</span>
                <h3>Check available slots</h3>
              </div>
              
              {availableDates.length > 0 ? (
                <>
                  <div className="date-selector">
                    {availableDates.slice(0, 7).map((date) => {
                      const dateInfo = formatDate(date);
                      const timesForDate = getAvailableTimes(date);
                      // Check if there are any available (not booked, not past) slots
                      const availableCount = timesForDate.filter(t => t.isAvailable).length;
                      const isAvailable = availableCount > 0;
                      const isSelected = selectedDate === date;
                      
                      return (
                        <button
                          key={date}
                          className={`date-button ${isSelected ? 'selected' : ''} ${!isAvailable ? 'unavailable' : ''}`}
                          onClick={() => {
                            // Allow clicking even if no available slots, so user can see all times
                            setSelectedDate(date);
                            setSelectedTime('');
                          }}
                        >
                          <div className="date-day">{dateInfo.day}</div>
                          <div className="date-label">{dateInfo.label}</div>
                          {isAvailable && <div className="date-status available">{availableCount} available</div>}
                          {!isAvailable && timesForDate.length > 0 && <div className="date-status">All booked</div>}
                          {!isAvailable && timesForDate.length === 0 && <div className="date-status">No slots</div>}
                        </button>
                      );
                    })}
                  </div>

                  {selectedDate && (
                    <div className="time-slots">
                      {(() => {
                        const morning = times.filter(t => t.time && t.time.includes('AM'));
                        const afternoon = times.filter(t => {
                          if (!t.time || !t.time.includes('PM')) return false;
                          const hour = parseInt(t.time.split(':')[0]);
                          // 12:00 PM, 01:00 PM, 02:00 PM, 03:00 PM
                          return hour === 12 || (hour >= 1 && hour <= 3);
                        });
                        const evening = times.filter(t => {
                          if (!t.time || !t.time.includes('PM')) return false;
                          const hour = parseInt(t.time.split(':')[0]);
                          // 04:00 PM, 05:00 PM
                          return hour >= 4 && hour <= 5;
                        });
                        
                        return (
                          <>
                            {morning.length > 0 && (
                              <div className="time-group">
                                <h4>MORNING</h4>
                                <div className="time-buttons">
                                  {morning.map((timeSlot, index) => (
                                    <button
                                      key={index}
                                      className={`time-button ${selectedTime === timeSlot.time ? 'selected' : ''} ${timeSlot.isBooked ? 'booked' : ''} ${timeSlot.isPast ? 'past' : ''}`}
                                      onClick={() => {
                                        if (!timeSlot.isBooked && !timeSlot.isPast) {
                                          setSelectedTime(timeSlot.time);
                                        }
                                      }}
                                      disabled={timeSlot.isBooked || timeSlot.isPast}
                                      title={timeSlot.isBooked ? 'This slot is already booked' : timeSlot.isPast ? 'This time has passed' : ''}
                                    >
                                      {timeSlot.time}
                                      {timeSlot.isBooked && <span className="booked-badge">Booked</span>}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                            {afternoon.length > 0 && (
                              <div className="time-group">
                                <h4>AFTERNOON</h4>
                                <div className="time-buttons">
                                  {afternoon.map((timeSlot, index) => (
                                    <button
                                      key={index}
                                      className={`time-button ${selectedTime === timeSlot.time ? 'selected' : ''} ${timeSlot.isBooked ? 'booked' : ''} ${timeSlot.isPast ? 'past' : ''}`}
                                      onClick={() => {
                                        if (!timeSlot.isBooked && !timeSlot.isPast) {
                                          setSelectedTime(timeSlot.time);
                                        }
                                      }}
                                      disabled={timeSlot.isBooked || timeSlot.isPast}
                                      title={timeSlot.isBooked ? 'This slot is already booked' : timeSlot.isPast ? 'This time has passed' : ''}
                                    >
                                      {timeSlot.time}
                                      {timeSlot.isBooked && <span className="booked-badge">Booked</span>}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                            {evening.length > 0 && (
                              <div className="time-group">
                                <h4>EVENING</h4>
                                <div className="time-buttons">
                                  {evening.map((timeSlot, index) => (
                                    <button
                                      key={index}
                                      className={`time-button ${selectedTime === timeSlot.time ? 'selected' : ''} ${timeSlot.isBooked ? 'booked' : ''} ${timeSlot.isPast ? 'past' : ''}`}
                                      onClick={() => {
                                        if (!timeSlot.isBooked && !timeSlot.isPast) {
                                          setSelectedTime(timeSlot.time);
                                        }
                                      }}
                                      disabled={timeSlot.isBooked || timeSlot.isPast}
                                      title={timeSlot.isBooked ? 'This slot is already booked' : timeSlot.isPast ? 'This time has passed' : ''}
                                    >
                                      {timeSlot.time}
                                      {timeSlot.isBooked && <span className="booked-badge">Booked</span>}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </>
                        );
                      })()}
                      {times.length === 0 && (
                        <div className="no-slots">
                          <p>No time slots available for this date</p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="no-slots">
                  <p>No available slots</p>
                  {employee?.availableSlots && employee.availableSlots.length > 0 && (
                    <p style={{ fontSize: '0.8rem', color: '#999', marginTop: '0.5rem' }}>
                      Total slots in database: {employee.availableSlots.length}
                      <br />
                      Filtered for {sessionType}: {employee.availableSlots.filter(s => s.type === (sessionType === 'Video' ? 'Online' : sessionType)).length}
                    </p>
                  )}
                </div>
              )}

              <button 
                className="proceed-button"
                onClick={handleProceed}
                disabled={!selectedDate || !selectedTime}
              >
                PROCEED
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmployeeProfile;
