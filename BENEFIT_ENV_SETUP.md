# BENEFIT Payment Gateway - Environment Variables Setup

## Required Environment Variables

Add these to your `client/.env.local` file:

```env
# BENEFIT Payment Gateway (for BenefitPay payments)
BENEFIT_TRANPORTAL_ID=your_tranportal_id_here
BENEFIT_TRANPORTAL_PASSWORD=your_tranportal_password_here
BENEFIT_RESOURCE_KEY=your_resource_key_here
BENEFIT_ENDPOINT=https://test.benefit-gateway.bh/payment/API/hosted.htm
```

## Getting Your Credentials

Contact your BENEFIT Payment Gateway account manager or technical support to obtain:

1. **Tranportal ID** - Your merchant tranportal identifier
2. **Tranportal Password** - Your tranportal password for authentication
3. **Resource Key** - Encryption key for AES encryption (must be exactly 32 characters for AES-256)
4. **Payment Gateway Endpoint** - API endpoint URL

## Environment-Specific Endpoints

### Test/Sandbox Environment
```env
BENEFIT_ENDPOINT=https://test.benefit-gateway.bh/payment/API/hosted.htm
```

### Production Environment
```env
BENEFIT_ENDPOINT=https://www.benefit-gateway.bh/payment/API/hosted.htm
```

## Security Notes

1. **Never commit `.env.local` to version control** - It's already in `.gitignore`
2. **Use test credentials for development** - Get separate production credentials
3. **Resource Key must be 32 characters** - For AES-256-CBC encryption
4. **Rotate credentials if compromised** - Contact BENEFIT support immediately

## For Vercel Deployment

After testing locally, add the same variables to:
- **Vercel Dashboard** → **Your Project** → **Settings** → **Environment Variables**
- Set them for **Production**, **Preview**, and **Development** environments

## Verification

After adding the variables:
1. Restart your development server: `npm run dev`
2. Check the console for any configuration errors
3. Test the payment flow with test credentials

## Support

If you need help obtaining credentials:
- Contact BENEFIT Payment Gateway support
- Email: support@benefit.bh (or your account manager)
- Provide your merchant details and integration requirements



