import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEmployee } from '../services/api';
import './EmployeeProfile.css';

function EmployeeProfile({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionType, setSessionType] = useState('Online');
  const [duration, setDuration] = useState(50);
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

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    today.setMinutes(0);
    today.setSeconds(0);
    today.setMilliseconds(0);

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
      
      // Normalize dates to compare only date part
      const slotDateOnly = new Date(slotDate.getFullYear(), slotDate.getMonth(), slotDate.getDate());
      const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      
      return slotDateOnly >= todayOnly;
    });

    console.log('Future slots:', futureSlots.length);

    const dates = [...new Set(futureSlots.map(slot => {
      const date = slot.date instanceof Date 
        ? new Date(slot.date) 
        : new Date(slot.date);
      return date.toISOString().split('T')[0];
    }))].sort().slice(0, 7);

    console.log('Available dates:', dates);
    return dates;
  };

  const getAvailableTimes = (date) => {
    if (!employee?.availableSlots) return [];
    
    // Map "Video" to "Online" for compatibility
    const slotType = sessionType === 'Video' ? 'Online' : sessionType;
    
    const times = employee.availableSlots
      .filter(slot => {
        let slotDate;
        if (slot.date instanceof Date) {
          slotDate = new Date(slot.date);
        } else if (typeof slot.date === 'string') {
          slotDate = new Date(slot.date);
        } else {
          slotDate = new Date(slot.date);
        }
        
        // Compare date strings
        const slotDateStr = slotDate.toISOString().split('T')[0];
        const targetDateStr = new Date(date).toISOString().split('T')[0];
        
        return slotDateStr === targetDateStr &&
               slot.type === slotType &&
               !slot.isBooked;
      })
      .map(slot => slot.time)
      .sort();
    
    console.log('Available times for', date, ':', times);
    return times;
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
    const basePrice = employee.price.amount;
    const durationMultiplier = duration === 50 ? (50 / employee.price.duration) : (30 / employee.price.duration);
    return Math.round(basePrice * durationMultiplier);
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
              <div className="image-placeholder-large">
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
              <div className="duration-buttons">
                <button
                  className={duration === 30 ? 'active' : ''}
                  onClick={() => setDuration(30)}
                >
                  30 mins
                </button>
                <button
                  className={duration === 50 ? 'active' : ''}
                  onClick={() => setDuration(50)}
                >
                  50 mins
                </button>
              </div>
              <div className="duration-info">
                <span>{duration} mins, 1 session</span>
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
                    {availableDates.slice(0, 3).map((date) => {
                      const dateInfo = formatDate(date);
                      const timesForDate = getAvailableTimes(date);
                      const isAvailable = timesForDate.length > 0;
                      const isSelected = selectedDate === date;
                      
                      return (
                        <button
                          key={date}
                          className={`date-button ${isSelected ? 'selected' : ''} ${!isAvailable ? 'unavailable' : ''}`}
                          onClick={() => {
                            if (isAvailable) {
                              setSelectedDate(date);
                              setSelectedTime('');
                            }
                          }}
                          disabled={!isAvailable}
                        >
                          <div className="date-day">{dateInfo.day}</div>
                          <div className="date-label">{dateInfo.label}</div>
                          {!isAvailable && <div className="date-status">not available</div>}
                          {isAvailable && <div className="date-status available">{timesForDate.length} available</div>}
                        </button>
                      );
                    })}
                  </div>

                  {selectedDate && times.length > 0 && (
                    <div className="time-slots">
                      {(() => {
                        const morning = times.filter(t => t.includes('AM'));
                        const afternoon = times.filter(t => {
                          if (!t.includes('PM')) return false;
                          const hour = parseInt(t.split(':')[0]);
                          return hour >= 12 && hour < 6;
                        });
                        const evening = times.filter(t => {
                          if (!t.includes('PM')) return false;
                          const hour = parseInt(t.split(':')[0]);
                          return hour >= 6;
                        });
                        
                        return (
                          <>
                            {morning.length > 0 && (
                              <div className="time-group">
                                <h4>MORNING</h4>
                                <div className="time-buttons">
                                  {morning.map((time, index) => (
                                    <button
                                      key={index}
                                      className={`time-button ${selectedTime === time ? 'selected' : ''}`}
                                      onClick={() => setSelectedTime(time)}
                                    >
                                      {time}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                            {afternoon.length > 0 && (
                              <div className="time-group">
                                <h4>NOON</h4>
                                <div className="time-buttons">
                                  {afternoon.map((time, index) => (
                                    <button
                                      key={index}
                                      className={`time-button ${selectedTime === time ? 'selected' : ''}`}
                                      onClick={() => setSelectedTime(time)}
                                    >
                                      {time}
                                    </button>
                                  ))}
                                </div>
                                {afternoon.length > 1 && (
                                  <p className="time-range">12:00 PM - 05:00 PM</p>
                                )}
                              </div>
                            )}
                            {evening.length > 0 && (
                              <div className="time-group">
                                <h4>EVENING</h4>
                                <div className="time-buttons">
                                  {evening.map((time, index) => (
                                    <button
                                      key={index}
                                      className={`time-button ${selectedTime === time ? 'selected' : ''}`}
                                      onClick={() => setSelectedTime(time)}
                                    >
                                      {time}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </>
                        );
                      })()}
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
