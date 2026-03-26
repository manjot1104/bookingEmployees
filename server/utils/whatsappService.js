const axios = require('axios');

// WhatsApp Business Cloud API Configuration
const WHATSAPP_API_URL = 'https://graph.facebook.com/v21.0';

/**
 * Get WhatsApp config from environment variables
 */
const getWhatsAppConfig = () => {
  const config = {
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
    templateName: process.env.WHATSAPP_TEMPLATE_NAME || 'booking_confirmation',
    templateLanguage: process.env.WHATSAPP_TEMPLATE_LANGUAGE || 'en',
  };

  if (!config.phoneNumberId || !config.accessToken) {
    return null;
  }

  return config;
};

/**
 * Format phone number to WhatsApp format (with country code, no + sign)
 * Accepts: +91XXXXXXXXXX, 91XXXXXXXXXX, 0XXXXXXXXXX, XXXXXXXXXX
 * Returns: 91XXXXXXXXXX
 */
const formatPhoneNumber = (phone) => {
  if (!phone) return null;

  // Remove all spaces, dashes, parentheses
  let cleaned = phone.replace(/[\s\-\(\)\+]/g, '');

  // If starts with 0, remove it and add 91 (India)
  if (cleaned.startsWith('0')) {
    cleaned = '91' + cleaned.substring(1);
  }

  // If it's 10 digits (Indian number without country code), add 91
  if (cleaned.length === 10) {
    cleaned = '91' + cleaned;
  }

  return cleaned;
};

/**
 * Send a WhatsApp text message (for within 24-hour window or testing)
 */
const sendWhatsAppMessage = async (to, messageBody) => {
  try {
    const config = getWhatsAppConfig();
    if (!config) {
      console.warn('⚠️  WhatsApp service not configured. Please add WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN to .env');
      return { success: false, error: 'WhatsApp service not configured' };
    }

    const formattedPhone = formatPhoneNumber(to);
    if (!formattedPhone) {
      console.error('❌ Invalid phone number for WhatsApp:', to);
      return { success: false, error: 'Invalid phone number' };
    }

    console.log('📱 Sending WhatsApp message to:', formattedPhone);

    const response = await axios({
      method: 'POST',
      url: `${WHATSAPP_API_URL}/${config.phoneNumberId}/messages`,
      headers: {
        'Authorization': `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: formattedPhone,
        type: 'text',
        text: {
          preview_url: false,
          body: messageBody,
        },
      },
    });

    console.log('✅ WhatsApp message sent successfully! Message ID:', response.data?.messages?.[0]?.id);
    return { success: true, messageId: response.data?.messages?.[0]?.id };
  } catch (error) {
    const errorData = error.response?.data?.error || error.message;
    console.error('❌ WhatsApp message failed:', JSON.stringify(errorData));
    return { success: false, error: errorData };
  }
};

/**
 * Send a WhatsApp template message (for business-initiated messages — recommended for production)
 * Template must be pre-approved in Meta Business Manager.
 * 
 * Default template "booking_confirmation" should have these parameters:
 *   {{1}} = User Name
 *   {{2}} = Therapist Name
 *   {{3}} = Booking Date
 *   {{4}} = Booking Time
 *   {{5}} = Session Type
 *   {{6}} = Amount
 */
const sendWhatsAppTemplateMessage = async (to, templateParams) => {
  try {
    const config = getWhatsAppConfig();
    if (!config) {
      console.warn('⚠️  WhatsApp service not configured. Please add WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN to .env');
      return { success: false, error: 'WhatsApp service not configured' };
    }

    const formattedPhone = formatPhoneNumber(to);
    if (!formattedPhone) {
      console.error('❌ Invalid phone number for WhatsApp:', to);
      return { success: false, error: 'Invalid phone number' };
    }

    console.log('📱 Sending WhatsApp template message to:', formattedPhone);

    const components = [];
    if (templateParams && templateParams.length > 0) {
      components.push({
        type: 'body',
        parameters: templateParams.map(param => ({
          type: 'text',
          text: String(param),
        })),
      });
    }

    const response = await axios({
      method: 'POST',
      url: `${WHATSAPP_API_URL}/${config.phoneNumberId}/messages`,
      headers: {
        'Authorization': `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: formattedPhone,
        type: 'template',
        template: {
          name: config.templateName,
          language: { code: config.templateLanguage },
          components: components,
        },
      },
    });

    console.log('✅ WhatsApp template message sent! Message ID:', response.data?.messages?.[0]?.id);
    return { success: true, messageId: response.data?.messages?.[0]?.id };
  } catch (error) {
    const errorData = error.response?.data?.error || error.message;
    console.error('❌ WhatsApp template message failed:', JSON.stringify(errorData));
    return { success: false, error: errorData };
  }
};

/**
 * Send booking confirmation via WhatsApp after successful payment
 * Tries template message first, falls back to text message
 */
const sendBookingConfirmationWhatsApp = async (booking, user, employee) => {
  try {
    if (!user.phone) {
      console.warn('⚠️  User phone number not available. Cannot send WhatsApp message.');
      return { success: false, error: 'User phone number not available' };
    }

    const bookingDate = new Date(booking.bookingDate).toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const amount = `${booking.price?.currency || '₹'}${booking.price?.amount || 'N/A'}`;
    const therapistName = employee?.name || booking.employeeName || 'Your Therapist';
    const sessionType = booking.type || 'Online';

    // Try sending template message first (recommended for production)
    const useTemplate = process.env.WHATSAPP_USE_TEMPLATE !== 'false'; // Default: true

    if (useTemplate) {
      console.log('📱 Attempting WhatsApp template message...');
      const templateResult = await sendWhatsAppTemplateMessage(user.phone, [
        user.name,
        therapistName,
        bookingDate,
        booking.bookingTime,
        sessionType,
        amount,
      ]);

      if (templateResult.success) {
        return templateResult;
      }

      console.warn('⚠️  Template message failed, falling back to text message...');
    }

    // Fallback: Send a plain text message
    const message = `🙏 *Global Wellness - Booking Confirmation*\n\n` +
      `Dear *${user.name}*,\n\n` +
      `Thank you for choosing Global Wellness! Your booking has been confirmed and payment received successfully. ✅\n\n` +
      `📋 *Booking Details:*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🧑‍⚕️ *Therapist:* ${therapistName}\n` +
      `📅 *Date:* ${bookingDate}\n` +
      `⏰ *Time:* ${booking.bookingTime}\n` +
      `💻 *Session Type:* ${sessionType}\n` +
      `⏳ *Duration:* 45 minutes\n` +
      `💰 *Amount Paid:* ${amount}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n\n` +
      `${booking.type === 'Online' ? '🔗 You will receive the session link before your appointment.\n\n' : '📍 Please arrive 10 minutes before your appointment.\n\n'}` +
      `For any queries or rescheduling, please contact us.\n\n` +
      `Wishing you wellness and good health! 🌿\n` +
      `*— Team Global Wellness*`;

    const textResult = await sendWhatsAppMessage(user.phone, message);
    return textResult;
  } catch (error) {
    console.error('❌ Error sending WhatsApp booking confirmation:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send booking notification to admin via WhatsApp
 */
const sendAdminWhatsAppNotification = async (booking, user, employee) => {
  try {
    const adminPhone = process.env.WHATSAPP_ADMIN_PHONE;
    if (!adminPhone) {
      console.warn('⚠️  WHATSAPP_ADMIN_PHONE not configured. Admin WhatsApp notification not sent.');
      return { success: false, error: 'Admin phone not configured' };
    }

    const bookingDate = new Date(booking.bookingDate).toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const amount = `${booking.price?.currency || '₹'}${booking.price?.amount || 'N/A'}`;
    const therapistName = employee?.name || booking.employeeName || 'Unknown';

    const message = `🔔 *New Booking Alert - Global Wellness*\n\n` +
      `A new booking has been confirmed with payment!\n\n` +
      `👤 *Customer:* ${user.name}\n` +
      `📧 *Email:* ${user.email}\n` +
      `📞 *Phone:* ${user.phone || 'N/A'}\n\n` +
      `📋 *Booking Details:*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🧑‍⚕️ *Therapist:* ${therapistName}\n` +
      `📅 *Date:* ${bookingDate}\n` +
      `⏰ *Time:* ${booking.bookingTime}\n` +
      `💻 *Type:* ${booking.type}\n` +
      `💰 *Amount:* ${amount}\n` +
      `🆔 *Booking ID:* ${booking._id}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n\n` +
      `✅ Payment Status: Paid`;

    const result = await sendWhatsAppMessage(adminPhone, message);
    return result;
  } catch (error) {
    console.error('❌ Error sending admin WhatsApp notification:', error.message);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendWhatsAppMessage,
  sendWhatsAppTemplateMessage,
  sendBookingConfirmationWhatsApp,
  sendAdminWhatsAppNotification,
  formatPhoneNumber,
  getWhatsAppConfig,
};
