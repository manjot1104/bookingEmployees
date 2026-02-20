import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEmployee } from '../services/api';
import { getCurrentISTDate, isDatePast, isToday, isTimePassedToday, formatISTDateString } from '../utils/dateUtils';
import './EmployeeProfile.css';

// Working hours constant (10:00 AM to 6:00 PM)
const WORKING_HOURS = ['10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM'];

function EmployeeProfile({ user, isAuthenticated }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const lastLoadedId = useRef(null);
  
  console.log('EmployeeProfile - ID from URL:', id);
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const sessionType = 'Online'; // Always Online
  const [duration] = useState(45); // Fixed at 45 minutes for all sessions
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [showFullBio, setShowFullBio] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const loadEmployee = useCallback(async () => {
    if (!id) {
      console.error('No employee ID provided');
      setLoading(false);
      return;
    }

    // Don't reload if we already have this employee loaded
    if (lastLoadedId.current === id) {
      console.log('Employee already loaded, skipping reload');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      console.log('Loading employee with ID:', id);
      const data = await getEmployee(id);
      
      if (!data) {
        console.error('Employee data is null or undefined');
        setLoading(false);
        return;
      }
      
      console.log('Employee data loaded:', data);
      console.log('Available slots:', data.availableSlots);
      setEmployee(data);
      lastLoadedId.current = id;
      setLoading(false);
    } catch (error) {
      console.error('Error loading employee:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      // If 404, employee doesn't exist
      if (error.response?.status === 404) {
        console.error('Employee not found in database');
        setEmployee(null);
        lastLoadedId.current = null;
      }
      
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadEmployee();
  }, [loadEmployee]);

  // Session type is always 'Online', no need to reset on change

  const getAvailableDates = () => {
    if (!employee?.availableSlots || employee.availableSlots.length === 0) {
      console.log('No available slots in employee data');
      return [];
    }
    
    // Always use "Online" for slots
    const slotType = 'Online';
    
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
      
      // Allow all days including Sundays
      // Filter only working hours (10:00 AM to 6:00 PM)
      if (!WORKING_HOURS.includes(slot.time)) {
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
    
    // Only return dates that actually have slots in the database
    // Don't generate fake dates that don't have slots
    // Return up to 60 days (approximately 2 months)
    const sortedDates = dates.sort();
    console.log('Available dates:', sortedDates.length);
    return sortedDates.slice(0, 60);
  };

  const getAvailableTimes = (date) => {
    if (!employee?.availableSlots) return [];
    
    // Always use "Online" for slots
    const slotType = 'Online';
    
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
    
    // If no slots exist for this date, return empty array
    if (slotsForDate.length === 0) return [];
    
    // Define 3-hour slot periods
    const slotPeriods = [
      {
        name: 'MORNING',
        label: '10:00 AM - 1:00 PM',
        times: ['10:00 AM', '11:00 AM', '12:00 PM'],
        startTime: '10:00 AM'
      },
      {
        name: 'AFTERNOON',
        label: '1:00 PM - 4:00 PM',
        times: ['01:00 PM', '02:00 PM', '03:00 PM'],
        startTime: '01:00 PM'
      },
      {
        name: 'EVENING',
        label: '4:00 PM - 7:00 PM',
        times: ['04:00 PM', '05:00 PM', '06:00 PM'],
        startTime: '04:00 PM'
      }
    ];
    
    // Check each period - slot is available only if ALL 3 hours in that period are available
    const timeSlots = slotPeriods.map(period => {
      const isSlotToday = isToday(new Date(date));
      
      // Check all times in this period
      const periodSlots = period.times.map(time => {
        const slot = slotsForDate.find(s => s.time === time);
        const isPastTime = isSlotToday && isTimePassedToday(time);
        
        return {
          time,
          isBooked: slot ? slot.isBooked : false,
          isPast: isPastTime,
          isAvailable: slot && !slot.isBooked && !isPastTime,
          exists: !!slot
        };
      });
      
      // Period is available only if ALL 3 hours are available (not booked, not past, and exist)
      const allAvailable = periodSlots.every(s => s.isAvailable && s.exists);
      const anyBooked = periodSlots.some(s => s.isBooked);
      const anyPast = periodSlots.some(s => s.isPast);
      const allExist = periodSlots.every(s => s.exists);
      
      return {
        time: period.startTime,
        label: period.label,
        period: period.name,
        isBooked: anyBooked,
        isPast: anyPast,
        isAvailable: allAvailable && allExist,
        periodSlots: periodSlots
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

  // Calendar grid functions
  const getCalendarGrid = () => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
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
    // Clear selected date when changing months
    setSelectedDate(null);
    setSelectedTime('');
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

  if (loading && !employee) {
    return <div className="profile-loading">Loading...</div>;
  }

  if (!employee && !loading) {
    return (
      <div className="profile-error">
        <p>Employee not found</p>
        <button 
          onClick={() => navigate('/')} 
          style={{ 
            marginTop: '1rem', 
            padding: '0.5rem 1rem', 
            backgroundColor: '#ff6b35', 
            color: 'white', 
            border: 'none', 
            borderRadius: '6px', 
            cursor: 'pointer' 
          }}
        >
          Go Back to Home
        </button>
      </div>
    );
  }

  if (!employee) {
    return <div className="profile-loading">Loading...</div>;
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
                  className="active"
                  disabled
                >
                  Video
                </button>
              </div>
            </div>

            <div className="booking-section">
              <h3>Session Duration</h3>
              <div className="duration-info">
                <span>45 mins, 1 session</span>
                <span className="price">
                  <span className="price-with-cut">
                    <span className="original-price-cut">₹{price}</span>
                    <span className="discount-badge-small">20% OFF</span>
                  </span>
                  {' '}
                  <span className="discounted-price-text">₹{Math.round(price * 0.8)} /session</span>
                </span>
              </div>
            </div>

            <div className="booking-section">
              <div className="section-header-small">
                <span className="calendar-icon">📅</span>
                <h3>Check available slots</h3>
              </div>
              
              {/* Calendar Grid */}
              <div className="calendar-container">
                {/* Month Navigation */}
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

                {/* Day Headers */}
                <div className="calendar-weekdays">
                  <div className="calendar-weekday">Sun</div>
                  <div className="calendar-weekday">Mon</div>
                  <div className="calendar-weekday">Tue</div>
                  <div className="calendar-weekday">Wed</div>
                  <div className="calendar-weekday">Thu</div>
                  <div className="calendar-weekday">Fri</div>
                  <div className="calendar-weekday">Sat</div>
                </div>

                {/* Calendar Grid */}
                <div className="calendar-grid">
                  {getCalendarGrid().map((dayData, index) => {
                    if (!dayData) {
                      return <div key={`empty-${index}`} className="calendar-day empty"></div>;
                    }

                    const { day, date, dateObj } = dayData;
                    const timesForDate = getAvailableTimes(date);
                    const availableCount = timesForDate.filter(t => t.isAvailable).length;
                    const isAvailable = availableCount > 0;
                    const isSelected = selectedDate === date;
                    const isTodayDate = isToday(dateObj);
                    const isPast = isDatePast(dateObj);
                    const isSunday = dateObj.getDay() === 0;
                    
                    // Check if date has slots in database (check directly from employee slots, not filtered availableDates)
                    const hasSlotsInDB = employee?.availableSlots?.some(slot => {
                      let slotDate;
                      if (slot.date instanceof Date) {
                        slotDate = new Date(slot.date);
                      } else if (typeof slot.date === 'string') {
                        slotDate = new Date(slot.date);
                      } else {
                        slotDate = new Date(slot.date);
                      }
                      const slotDateStr = formatISTDateString(slotDate);
                      return slotDateStr === date && slot.type === 'Online';
                    }) || false;
                    
                    const hasSlots = hasSlotsInDB || availableDates.includes(date);
                    const hasAnySlots = timesForDate.length > 0 && timesForDate.some(t => 
                      t.periodSlots && t.periodSlots.some(ps => ps.exists)
                    );

                    return (
                      <button
                        key={date}
                        className={`calendar-day ${isSelected ? 'selected' : ''} ${!isAvailable && hasSlots ? 'booked' : ''} ${isPast ? 'past' : ''} ${isTodayDate ? 'today' : ''} ${isSunday ? 'sunday' : ''} ${!hasSlots ? 'no-slots' : ''}`}
                        onClick={() => {
                          if (!isPast && hasSlots) {
                            setSelectedDate(date);
                            setSelectedTime('');
                          }
                        }}
                        disabled={isPast || !hasSlots}
                        title={isPast ? 'Past date' : !hasSlots ? 'No slots available' : isAvailable ? `${availableCount} slots available` : 'All booked'}
                      >
                        <div className="calendar-day-number">{day}</div>
                        {hasSlots && (
                          <div className="calendar-day-status">
                            {isAvailable ? (
                              <span className="status-dot available"></span>
                            ) : hasAnySlots ? (
                              <span className="status-dot booked"></span>
                            ) : null}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {selectedDate && (
                <div className="time-slots">
                  {times.length > 0 ? (
                    <>
                      {times.map((timeSlot, index) => (
                        <div key={index} className="time-group">
                          <h4>{timeSlot.period}</h4>
                          <div className="time-buttons">
                            <button
                              className={`time-button ${selectedTime === timeSlot.time ? 'selected' : ''} ${timeSlot.isBooked ? 'booked' : ''} ${timeSlot.isPast ? 'past' : ''} ${!timeSlot.isAvailable ? 'unavailable' : ''}`}
                              onClick={() => {
                                if (timeSlot.isAvailable) {
                                  setSelectedTime(timeSlot.time);
                                }
                              }}
                              disabled={!timeSlot.isAvailable}
                              title={timeSlot.isBooked ? 'This slot is already booked' : timeSlot.isPast ? 'This time has passed' : !timeSlot.isAvailable ? 'Not all hours available in this period' : timeSlot.label}
                            >
                              {timeSlot.label}
                              {timeSlot.isBooked && <span className="booked-badge">Booked</span>}
                            </button>
                          </div>
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className="no-slots">
                      <p>No time slots available for this date</p>
                    </div>
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
