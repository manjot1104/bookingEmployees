import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { createBooking, getEmployee, createRazorpayOrder, verifyRazorpayPayment, getBooking } from '../services/api';
import './BookingPage.css';

// Load Razorpay script
const loadRazorpay = () => {
  return new Promise((resolve) => {
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

function BookingPage({ user }) {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(location.state?.employee || null);
  const [sessionType] = useState(location.state?.sessionType || 'Video');
  const [duration] = useState(location.state?.duration || 50);
  const [selectedDate] = useState(location.state?.selectedDate || '');
  const [selectedTime] = useState(location.state?.selectedTime || '');
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [bookingId, setBookingId] = useState(location.state?.existingBookingId || null);
  const [isExistingBooking, setIsExistingBooking] = useState(location.state?.isExistingBooking || false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [bookingData, setBookingData] = useState(null); // Store booking data with discount info
  const [isNewUser, setIsNewUser] = useState(null); // null = checking, true/false = result

  const loadEmployee = useCallback(async () => {
    try {
      const data = await getEmployee(id);
      setEmployee(data);
    } catch (error) {
      console.error('Error loading employee:', error);
    }
  }, [id]);

  useEffect(() => {
    // If employee data is passed from state, use it; otherwise load from API
    if (!employee && id) {
      loadEmployee();
    }
    // Load Razorpay script
    loadRazorpay().then(() => {
      setRazorpayLoaded(true);
    });
    
    // Set booking ID and existing booking flag from location state
    if (location.state?.existingBookingId) {
      setBookingId(location.state.existingBookingId);
      setIsExistingBooking(true);
    }

    // Check if user is new (eligible for discount)
    const checkIfNewUser = async () => {
      try {
        const { getMyBookings } = await import('../services/api');
        const bookings = await getMyBookings();
        // User is new if they have no bookings or only cancelled bookings
        const activeBookings = bookings.filter(b => b.status !== 'Cancelled');
        setIsNewUser(activeBookings.length === 0);
      } catch (error) {
        console.error('Error checking user bookings:', error);
        setIsNewUser(false); // Default to false on error
      }
    };

    if (user) {
      checkIfNewUser();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, location.state, user]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);


  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePayment = async () => {
    if (!selectedDate || !selectedTime) {
      alert('Please select date and time');
      return;
    }

    if (!razorpayLoaded) {
      alert('Payment gateway is loading. Please wait...');
      return;
    }

    setLoading(true);
    try {
      // Step 1: Create booking only if it doesn't exist
      let newBookingId = bookingId;
      
      if (!isExistingBooking || !bookingId) {
        const bookingType = sessionType === 'Video' ? 'Online' : sessionType;
        
        const bookingResponse = await createBooking({
          employeeId: employee._id,
          bookingDate: selectedDate,
          bookingTime: selectedTime,
          type: bookingType,
          notes: ''
        });

        newBookingId = bookingResponse.booking._id;
        setBookingId(newBookingId);
        setBookingData(bookingResponse.booking); // Store booking data with discount info
        console.log('✅ New booking created:', newBookingId);
      } else {
        // Use existing booking ID
        newBookingId = bookingId;
        console.log('✅ Using existing booking ID:', newBookingId);
      }

      // Step 2: Get booking to get the final price (with discount if applicable)
      let finalPrice = employee.price.amount; // Default to original price
      if (bookingData) {
        finalPrice = bookingData.price.amount;
      } else {
        // Fetch booking if not already loaded
        try {
          const booking = await getBooking(newBookingId);
          if (booking) {
            finalPrice = booking.price.amount;
            setBookingData(booking);
          }
        } catch (err) {
          console.error('Error fetching booking:', err);
        }
      }

      // Step 3: Create Razorpay order with final price (already includes discount if applicable)
      const orderResponse = await createRazorpayOrder(newBookingId, finalPrice);

      // Step 4: Open Razorpay checkout
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
              newBookingId
            );

            alert('Payment successful! Booking confirmed.');
            navigate('/my-bookings');
          } catch (error) {
            console.error('Payment verification error:', error);
            alert('Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.phone || ''
        },
        theme: {
          color: '#ff6b35'
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
    } catch (error) {
      console.error('Payment error:', error);
      alert(error.response?.data?.message || 'Failed to process payment');
      setLoading(false);
    }
  };

  const getPriceDetails = () => {
    if (!employee) return { original: 0, discount: 0, final: 0, hasDiscount: false };
    
    const originalPrice = employee.price.amount;
    let finalPrice = originalPrice;
    let discountAmount = 0;
    let hasDiscount = false;

    // If booking data exists and has discount, use it (most accurate)
    if (bookingData && bookingData.discountCode === 'WELCOME20') {
      hasDiscount = true;
      discountAmount = bookingData.discountAmount || Math.round(originalPrice * 0.2);
      finalPrice = bookingData.price.amount || (originalPrice - discountAmount);
    } 
    // Otherwise, check if user is new (for preview before booking creation)
    else if (isNewUser === true) {
      hasDiscount = true;
      discountAmount = Math.round(originalPrice * 0.2);
      finalPrice = originalPrice - discountAmount;
    }

    return {
      original: originalPrice,
      discount: discountAmount,
      final: finalPrice,
      hasDiscount: hasDiscount
    };
  };

  if (!employee) {
    return <div className="booking-loading">Loading...</div>;
  }

  const priceDetails = getPriceDetails();
  const formattedDate = selectedDate ? (() => {
    const date = new Date(selectedDate);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  })() : '';

  return (
    <div className="booking-page">
      <div className="booking-container">
        <div className="booking-left">
          <button className="back-button" onClick={() => navigate(`/employee/${employee._id}`)}>
            ← Back
          </button>

            {priceDetails.hasDiscount && (
            <div className="discount-box" style={{ backgroundColor: '#4caf50', color: 'white' }}>
              <strong>🎉 WELCOME20 Applied!</strong>
              <p>20% Off on Your First Session</p>
            </div>
          )}
          {!priceDetails.hasDiscount && (
            <div className="discount-box">
              <strong>20% Off</strong>
              <p>20% Off on Pre-booking First Session (New Users Only)</p>
            </div>
          )}

          <div className="progress-tracker">
            <div className="progress-step completed">
              <div className="step-icon">📅</div>
              <div className="step-content">
                <div className="step-title">Select session details</div>
                <div className="step-status">✓</div>
              </div>
            </div>
            <div className="progress-step completed">
              <div className="step-icon">👤</div>
              <div className="step-content">
                <div className="step-title">Enter your details</div>
                <div className="step-status">✓</div>
              </div>
            </div>
            <div className="progress-step active">
              <div className="step-icon">📋</div>
              <div className="step-content">
                <div className="step-title">Complete your booking</div>
                <div className="step-status">●</div>
              </div>
            </div>
          </div>

          <div className="time-banner">
            Please complete this booking in {formatTime(timeLeft)}
          </div>

          <div className="session-details-card">
            <h2>Your Session Details:</h2>
            <div className="session-info">
              <div className="employee-image-small">
                {employee.image ? (
                  <img 
                    src={employee.image} 
                    alt={employee.name}
                    className="employee-photo-small"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      const placeholder = e.target.parentElement.querySelector('.image-placeholder-small');
                      if (placeholder) placeholder.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div className="image-placeholder-small" style={{ display: employee.image ? 'none' : 'flex' }}>
                  {employee.name.charAt(0)}
                </div>
              </div>
              <div className="session-text">
                <p className="session-label">{employee.title} session with</p>
                <h3>{employee.name}</h3>
                <div className="session-meta">
                  <span>📹</span>
                  <span>{duration} min</span>
                  <span>via {(sessionType === 'Video' || sessionType === 'Online') ? 'Video Call' : 'In-Person'}</span>
                </div>
                <p className="session-date">
                  {formattedDate}, {selectedTime} IST
                </p>
                <button className="edit-button" onClick={() => navigate(`/employee/${employee._id}`)}>
                  ✏️ EDIT
                </button>
              </div>
            </div>
            <p className="confirmation-text">
              Confirmation email will be sent to {user?.email} and SMS will be sent to {user?.phone || 'your registered number'}
            </p>
          </div>
        </div>

        <div className="booking-right">
          <h2>Complete Your Booking</h2>
          
          <div className="offers-packages">
            <h3>Offers & Packages →</h3>
          </div>
          
          <div className="account-details">
            <h3>Your Account Details</h3>
            <div className="detail-row">
              <span>Name:</span>
              <span>{user?.name}</span>
            </div>
            <div className="detail-row">
              <span>Phone number:</span>
              <span>{user?.phone || 'Not provided'} ✓</span>
            </div>
            <div className="detail-row">
              <span>Email ID:</span>
              <span>{user?.email} ✓</span>
            </div>
          </div>

          <div className="pricing-details">
            <h3>Pricing Details</h3>
            <div className="price-row">
              <span>Standard session price:</span>
              <span>₹{priceDetails.original}.00</span>
            </div>
            {priceDetails.hasDiscount && (
              <>
                <div className="price-row discount">
                  <span>Discount (WELCOME20):</span>
                  <span style={{ color: '#4caf50' }}>-₹{priceDetails.discount}.00</span>
                </div>
                <div className="price-row" style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5rem' }}>
                  <span>🎉 Welcome discount applied!</span>
                </div>
              </>
            )}
            <div className="price-row final">
              <span>Final amount to Pay:</span>
              <span>₹{priceDetails.final}.00</span>
            </div>
          </div>

          <button 
            className="payment-button"
            onClick={handlePayment}
            disabled={loading || !selectedDate || !selectedTime || !razorpayLoaded}
          >
            {loading ? 'Processing...' : !razorpayLoaded ? 'Loading Payment...' : 'MAKE PAYMENT'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default BookingPage;
