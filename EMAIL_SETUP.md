# Email Setup Guide

This guide explains how to configure automated email notifications for booking confirmations.

## What You Need

To send automated emails, you need an **SMTP email service**. Here are the recommended options:

### Option 1: Gmail (Easiest for Testing)
- **Free**: Yes (with limitations)
- **Setup Time**: 5 minutes
- **Best For**: Development and small-scale production

### Option 2: SendGrid (Recommended for Production)
- **Free Tier**: 100 emails/day free
- **Setup Time**: 10 minutes
- **Best For**: Production applications

### Option 3: Mailgun
- **Free Tier**: 5,000 emails/month free
- **Setup Time**: 10 minutes
- **Best For**: Production applications

### Option 4: AWS SES (Amazon Simple Email Service)
- **Free Tier**: 62,000 emails/month free (if on EC2)
- **Setup Time**: 15 minutes
- **Best For**: High-volume production

---

## Setup Instructions

### For Gmail (Quick Setup)

1. **Enable 2-Step Verification** on your Gmail account
2. **Generate App Password**:
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Enter "Booking Platform" as the name
   - Copy the 16-character password

3. **Add to `.env` file**:
```env
# Gmail SMTP Settings
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-character-app-password

# Admin email (who receives booking notifications)
ADMIN_EMAIL=admin@yourcompany.com
```

### For SendGrid (Production Recommended)

1. **Sign up** at https://sendgrid.com
2. **Create API Key**:
   - Go to Settings > API Keys
   - Create a new API Key with "Mail Send" permissions
   - Copy the API key

3. **Verify Sender**:
   - Go to Settings > Sender Authentication
   - Verify your email address

4. **Add to `.env` file**:
```env
# SendGrid SMTP Settings
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key

# Admin email (who receives booking notifications)
ADMIN_EMAIL=admin@yourcompany.com
```

### For Mailgun

1. **Sign up** at https://www.mailgun.com
2. **Get SMTP credentials** from your Mailgun dashboard
3. **Add to `.env` file**:
```env
# Mailgun SMTP Settings
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-mailgun-smtp-username
SMTP_PASS=your-mailgun-smtp-password

# Admin email
ADMIN_EMAIL=admin@yourcompany.com
```

---

## Environment Variables

Add these to your `.env` file:

```env
# SMTP Email Configuration
SMTP_HOST=smtp.gmail.com          # SMTP server hostname
SMTP_PORT=587                     # SMTP port (587 for TLS, 465 for SSL)
SMTP_SECURE=false                 # true for SSL (port 465), false for TLS (port 587)
SMTP_USER=your-email@gmail.com    # Your email address
SMTP_PASS=your-password           # Your email password or app password

# Admin Email (receives booking notifications)
ADMIN_EMAIL=admin@yourcompany.com # Email address for booking notifications
```

---

## How It Works

When a user creates a booking:

1. **User receives** a confirmation email with:
   - Booking details (date, time, therapist)
   - Session information
   - Payment status
   - Booking status

2. **Admin receives** a notification email with:
   - User information
   - Booking details
   - Therapist information
   - Payment status

---

## Testing

After setting up your email configuration:

1. Create a test booking
2. Check your email inbox
3. Check the admin email inbox
4. Verify both emails are received correctly

---

## Troubleshooting

### Emails not sending?

1. **Check `.env` file** - Make sure all SMTP variables are set
2. **Check server logs** - Look for email error messages
3. **Verify credentials** - Test your SMTP credentials
4. **Check spam folder** - Emails might be filtered

### Gmail specific issues:

- Make sure you're using an **App Password**, not your regular password
- Enable "Less secure app access" if using regular password (not recommended)
- Check if 2-Step Verification is enabled

### Common errors:

- **"Invalid login"**: Check SMTP_USER and SMTP_PASS
- **"Connection timeout"**: Check SMTP_HOST and SMTP_PORT
- **"Authentication failed"**: Verify your credentials

---

## Security Notes

- **Never commit** `.env` file to git
- Use **App Passwords** instead of regular passwords
- For production, use a dedicated email service (SendGrid, Mailgun)
- Keep your SMTP credentials secure

---

## Support

If you encounter issues:
1. Check server console for error messages
2. Verify your SMTP configuration
3. Test with a simple email client first
4. Check email service provider's documentation


