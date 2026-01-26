# SendGrid Email Setup Guide

## Step-by-Step SendGrid Configuration

### Step 1: Create SendGrid Account
1. Go to https://sendgrid.com
2. Sign up for a free account (100 emails/day free)
3. Verify your email address

### Step 2: Create API Key
1. Log in to SendGrid dashboard
2. Go to **Settings** → **API Keys**
3. Click **Create API Key**
4. Name it: "Booking Platform"
5. Select **Full Access** or **Restricted Access** with "Mail Send" permission
6. Click **Create & View**
7. **IMPORTANT**: Copy the API key immediately (you won't see it again!)

### Step 3: Verify Sender Email
1. Go to **Settings** → **Sender Authentication**
2. Click **Verify a Single Sender**
3. Fill in your details:
   - **From Email Address**: The email you want to send from (e.g., noreply@yourcompany.com)
   - **From Name**: Booking Platform
   - **Reply To**: Your admin email
4. Click **Create**
5. Check your email and click the verification link

### Step 4: Configure .env File

Add these to your `.env` file:

```env
# SendGrid SMTP Configuration
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=SG.your-actual-sendgrid-api-key-here

# Admin Email (who receives booking notifications)
ADMIN_EMAIL=admin@yourcompany.com
```

**Important Notes:**
- `SMTP_USER` must be exactly: `apikey` (lowercase, no spaces)
- `SMTP_PASS` is your SendGrid API Key (starts with `SG.`)
- Replace `ADMIN_EMAIL` with the email address that should receive booking notifications

### Step 5: Test Configuration

1. Restart your server
2. Create a test booking
3. Check both email inboxes:
   - User's email (booking confirmation)
   - Admin email (booking notification)

## Troubleshooting

### Emails not sending?

1. **Check API Key**: Make sure you copied the full API key (starts with `SG.`)
2. **Check Sender Verification**: Your sender email must be verified in SendGrid
3. **Check Server Logs**: Look for email error messages in console
4. **Check SendGrid Dashboard**: Go to Activity → Email Activity to see delivery status

### Common Errors:

- **"Invalid login"**: 
  - Make sure `SMTP_USER=apikey` (exactly as shown)
  - Verify your API key is correct

- **"Authentication failed"**:
  - Check if API key has "Mail Send" permission
  - Verify sender email is verified

- **"Sender not verified"**:
  - Go to SendGrid → Sender Authentication
  - Verify your sender email address

## SendGrid Limits

- **Free Tier**: 100 emails/day
- **Paid Plans**: Start at $19.95/month for 50,000 emails

## Security Best Practices

1. **Never commit** `.env` file to git
2. **Use Restricted API Keys** with only "Mail Send" permission
3. **Rotate API Keys** periodically
4. **Monitor** email activity in SendGrid dashboard

## Support

- SendGrid Documentation: https://docs.sendgrid.com
- SendGrid Support: https://support.sendgrid.com


