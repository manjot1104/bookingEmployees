# SendGrid Quick Setup

## Your .env Configuration

Add these exact lines to your `.env` file:

```env
# SendGrid SMTP Configuration
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=SG.your-sendgrid-api-key-here

# Admin Email (receives booking notifications)
ADMIN_EMAIL=your-admin-email@yourcompany.com
```

## Important Notes:

1. **SMTP_USER must be exactly**: `apikey` (lowercase, no spaces)
2. **SMTP_PASS** is your SendGrid API Key (starts with `SG.`)
3. Replace `ADMIN_EMAIL` with the email that should receive booking notifications

## Steps:

1. **Get SendGrid API Key**:
   - Login to SendGrid → Settings → API Keys
   - Create new API Key with "Mail Send" permission
   - Copy the key (starts with `SG.`)

2. **Verify Sender Email**:
   - Settings → Sender Authentication
   - Verify a Single Sender
   - Use the email you want to send from

3. **Add to .env file** (as shown above)

4. **Restart your server**

5. **Test**: Create a booking and check emails!

## Troubleshooting:

- **"Invalid login"**: Make sure `SMTP_USER=apikey` (exactly as shown)
- **"Authentication failed"**: Check your API key is correct
- **Check server logs**: Look for "✅ Email service connected successfully"


