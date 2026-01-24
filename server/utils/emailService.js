const nodemailer = require('nodemailer');

// Create reusable transporter object using SMTP transport
const createTransporter = () => {
  // Check if email is configured
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('⚠️  Email service not configured. Please add SMTP settings to .env file');
    console.warn('   For SendGrid: SMTP_HOST=smtp.sendgrid.net, SMTP_USER=apikey, SMTP_PASS=your-api-key');
    return null;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
    tls: {
      rejectUnauthorized: false // For development/testing
    }
  });

  // Verify connection (for debugging)
  transporter.verify((error, success) => {
    if (error) {
      console.error('❌ Email service connection failed:', error.message);
      console.error('   Please check your SMTP configuration in .env file');
    } else {
      console.log('✅ Email service connected successfully');
      console.log(`   Using: ${process.env.SMTP_HOST}`);
    }
  });

  return transporter;
};

// Email templates
const getBookingConfirmationTemplate = (booking, user, employee) => {
  const bookingDate = new Date(booking.bookingDate).toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return {
    subject: `Booking Confirmation - Session with ${employee.name}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #ff6b35; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .booking-details { background-color: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #ff6b35; }
          .detail-row { margin: 10px 0; }
          .label { font-weight: bold; color: #666; }
          .value { color: #333; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          .button { display: inline-block; padding: 12px 24px; background-color: #ff6b35; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Booking Confirmation</h1>
          </div>
          <div class="content">
            <p>Dear ${user.name},</p>
            <p>Thank you for booking a session with us! Your booking has been confirmed.</p>
            
            <div class="booking-details">
              <h2 style="margin-top: 0; color: #ff6b35;">Booking Details</h2>
              <div class="detail-row">
                <span class="label">Therapist:</span>
                <span class="value">${employee.name} - ${employee.title}</span>
              </div>
              <div class="detail-row">
                <span class="label">Date:</span>
                <span class="value">${bookingDate}</span>
              </div>
              <div class="detail-row">
                <span class="label">Time:</span>
                <span class="value">${booking.bookingTime}</span>
              </div>
              <div class="detail-row">
                <span class="label">Session Type:</span>
                <span class="value">${booking.type}</span>
              </div>
              <div class="detail-row">
                <span class="label">Duration:</span>
                <span class="value">45 minutes</span>
              </div>
              <div class="detail-row">
                <span class="label">Amount:</span>
                <span class="value">${booking.price.currency}${booking.price.amount}</span>
              </div>
              ${booking.notes ? `
              <div class="detail-row">
                <span class="label">Notes:</span>
                <span class="value">${booking.notes}</span>
              </div>
              ` : ''}
            </div>

            <p><strong>Booking Status:</strong> ${booking.status}</p>
            <p><strong>Payment Status:</strong> ${booking.paymentStatus}</p>

            ${booking.paymentStatus === 'Pending' ? `
            <p style="color: #ff6b35; font-weight: bold;">Please complete the payment to confirm your booking.</p>
            ` : ''}

            <p>If you have any questions or need to reschedule, please contact us.</p>
            
            <div class="footer">
              <p>Best regards,<br>Booking Platform Team</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Booking Confirmation

      Dear ${user.name},

      Thank you for booking a session with us! Your booking has been confirmed.

      Booking Details:
      - Therapist: ${employee.name} - ${employee.title}
      - Date: ${bookingDate}
      - Time: ${booking.bookingTime}
      - Session Type: ${booking.type}
      - Duration: 45 minutes
      - Amount: ${booking.price.currency}${booking.price.amount}
      ${booking.notes ? `- Notes: ${booking.notes}` : ''}

      Booking Status: ${booking.status}
      Payment Status: ${booking.paymentStatus}

      Best regards,
      Booking Platform Team
    `
  };
};

const getAdminNotificationTemplate = (booking, user, employee) => {
  const bookingDate = new Date(booking.bookingDate).toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return {
    subject: `New Booking Received - ${user.name} with ${employee.name}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4caf50; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .booking-details { background-color: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #4caf50; }
          .detail-row { margin: 10px 0; }
          .label { font-weight: bold; color: #666; }
          .value { color: #333; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New Booking Received</h1>
          </div>
          <div class="content">
            <p>A new booking has been created in the system.</p>
            
            <div class="booking-details">
              <h2 style="margin-top: 0; color: #4caf50;">Booking Information</h2>
              <div class="detail-row">
                <span class="label">Booking ID:</span>
                <span class="value">${booking._id}</span>
              </div>
              <div class="detail-row">
                <span class="label">User:</span>
                <span class="value">${user.name} (${user.email})</span>
              </div>
              <div class="detail-row">
                <span class="label">Therapist:</span>
                <span class="value">${employee.name} - ${employee.title}</span>
              </div>
              <div class="detail-row">
                <span class="label">Date:</span>
                <span class="value">${bookingDate}</span>
              </div>
              <div class="detail-row">
                <span class="label">Time:</span>
                <span class="value">${booking.bookingTime}</span>
              </div>
              <div class="detail-row">
                <span class="label">Session Type:</span>
                <span class="value">${booking.type}</span>
              </div>
              <div class="detail-row">
                <span class="label">Duration:</span>
                <span class="value">45 minutes</span>
              </div>
              <div class="detail-row">
                <span class="label">Amount:</span>
                <span class="value">${booking.price.currency}${booking.price.amount}</span>
              </div>
              <div class="detail-row">
                <span class="label">Status:</span>
                <span class="value">${booking.status}</span>
              </div>
              <div class="detail-row">
                <span class="label">Payment Status:</span>
                <span class="value">${booking.paymentStatus}</span>
              </div>
              ${user.phone ? `
              <div class="detail-row">
                <span class="label">User Phone:</span>
                <span class="value">${user.phone}</span>
              </div>
              ` : ''}
              ${booking.notes ? `
              <div class="detail-row">
                <span class="label">User Notes:</span>
                <span class="value">${booking.notes}</span>
              </div>
              ` : ''}
            </div>

            <p>Please review and manage this booking in the admin panel.</p>
            
            <div class="footer">
              <p>This is an automated notification from Booking Platform</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      New Booking Received

      A new booking has been created in the system.

      Booking Information:
      - Booking ID: ${booking._id}
      - User: ${user.name} (${user.email})
      - Therapist: ${employee.name} - ${employee.title}
      - Date: ${bookingDate}
      - Time: ${booking.bookingTime}
      - Session Type: ${booking.type}
      - Duration: 45 minutes
      - Amount: ${booking.price.currency}${booking.price.amount}
      - Status: ${booking.status}
      - Payment Status: ${booking.paymentStatus}
      ${user.phone ? `- User Phone: ${user.phone}` : ''}
      ${booking.notes ? `- User Notes: ${booking.notes}` : ''}

      Please review and manage this booking in the admin panel.

      This is an automated notification from Booking Platform
    `
  };
};

// Send email function
const sendEmail = async (to, subject, html, text) => {
  try {
    const transporter = createTransporter();
    
    if (!transporter) {
      console.warn('⚠️  Email service not configured. Email not sent.');
      return { success: false, error: 'Email service not configured' };
    }

    const mailOptions = {
      from: `"Booking Platform" <${process.env.SMTP_USER}>`,
      to: to,
      subject: subject,
      html: html,
      text: text
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return { success: false, error: error.message };
  }
};

// Send booking confirmation to user
const sendBookingConfirmation = async (booking, user, employee) => {
  try {
    const template = getBookingConfirmationTemplate(booking, user, employee);
    const result = await sendEmail(
      user.email,
      template.subject,
      template.html,
      template.text
    );
    return result;
  } catch (error) {
    console.error('Error sending booking confirmation email:', error);
    return { success: false, error: error.message };
  }
};

// Send admin notification
const sendAdminNotification = async (booking, user, employee) => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
    
    if (!adminEmail) {
      console.warn('⚠️  ADMIN_EMAIL not configured. Admin notification not sent.');
      return { success: false, error: 'Admin email not configured' };
    }

    const template = getAdminNotificationTemplate(booking, user, employee);
    const result = await sendEmail(
      adminEmail,
      template.subject,
      template.html,
      template.text
    );
    return result;
  } catch (error) {
    console.error('Error sending admin notification email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendEmail,
  sendBookingConfirmation,
  sendAdminNotification,
  createTransporter
};

