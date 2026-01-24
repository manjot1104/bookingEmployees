// Utility functions for Indian Standard Time (IST) date and time handling
// Note: These functions use the browser's local timezone, which should be IST for Indian users

/**
 * Get current date and time (in user's local timezone, should be IST for Indian users)
 * @returns {Date} Current date/time
 */
export const getCurrentIST = () => {
  return new Date();
};

/**
 * Get current date at midnight (in user's local timezone)
 * @returns {Date} Current date at midnight
 */
export const getCurrentISTDate = () => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return today;
};

/**
 * Convert time string (e.g., "12:34 PM") to minutes since midnight
 * @param {string} timeStr - Time string in format "HH:MM AM/PM"
 * @returns {number} Minutes since midnight
 */
export const timeToMinutes = (timeStr) => {
  const [time, period] = timeStr.split(' ');
  const [hours, minutes] = time.split(':').map(Number);
  let totalMinutes = hours * 60 + minutes;
  
  if (period === 'PM' && hours !== 12) {
    totalMinutes += 12 * 60;
  } else if (period === 'AM' && hours === 12) {
    totalMinutes -= 12 * 60;
  }
  
  return totalMinutes;
};

/**
 * Check if a slot time has passed for today
 * @param {string} slotTime - Time string (e.g., "12:34 PM")
 * @returns {boolean} True if the time has passed today
 */
export const isTimePassedToday = (slotTime) => {
  const now = getCurrentIST();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const slotMinutes = timeToMinutes(slotTime);
  return slotMinutes <= currentMinutes;
};

/**
 * Check if a date is in the past (before today in IST)
 * @param {Date|string} date - Date to check
 * @returns {boolean} True if date is in the past
 */
export const isDatePast = (date) => {
  const slotDate = new Date(date);
  const today = getCurrentISTDate();
  
  // Normalize to date only (ignore time)
  slotDate.setHours(0, 0, 0, 0);
  
  return slotDate < today;
};

/**
 * Check if a date is today in IST
 * @param {Date|string} date - Date to check
 * @returns {boolean} True if date is today
 */
export const isToday = (date) => {
  const slotDate = new Date(date);
  const today = getCurrentISTDate();
  
  slotDate.setHours(0, 0, 0, 0);
  
  return slotDate.getTime() === today.getTime();
};

/**
 * Format date to date string (YYYY-MM-DD) in local timezone
 * @param {Date|string} date - Date to format
 * @returns {string} Date string in YYYY-MM-DD format
 */
export const formatISTDateString = (date) => {
  const dateObj = new Date(date);
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

