# BenefitPay Environment Variables Configuration

## Critical: Update These Variables

For the BenefitPay integration to work correctly, you MUST set these environment variables:

### Local Development (.env.local)

Create or update `client/.env.local` with:

```bash
# CRITICAL: Must be production URL (never localhost)
# BenefitPay servers need to reach your ACK endpoint
CLIENT_URL=https://helloonebahrain.com

# BenefitPay Credentials
BENEFIT_TRANPORTAL_ID=your_tranportal_id_here
BENEFIT_TRANPORTAL_PASSWORD=your_tranportal_password_here
BENEFIT_RESOURCE_KEY=your_resource_key_here

# BenefitPay Endpoint
# Test environment:
BENEFIT_ENDPOINT=https://test.benefit-gateway.bh/payment/API/hosted.htm
# Production environment (when ready):
# BENEFIT_ENDPOINT=https://benefit-gateway.bh/payment/API/hosted.htm
```

### Vercel Deployment

Set these same variables in Vercel:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add each variable:
   - `CLIENT_URL` = `https://helloonebahrain.com`
   - `BENEFIT_TRANPORTAL_ID` = (your value)
   - `BENEFIT_TRANPORTAL_PASSWORD` = (your value)
   - `BENEFIT_RESOURCE_KEY` = (your value)
   - `BENEFIT_ENDPOINT` = `https://test.benefit-gateway.bh/payment/API/hosted.htm`

3. Make sure to select "Production", "Preview", and "Development" for each variable

## Why CLIENT_URL Must Be Production URL

The `CLIENT_URL` must ALWAYS be your production domain (never `localhost:3000`) because:

1. **BenefitPay Merchant Notification**: BenefitPay servers POST to your ACK endpoint at:
   ```
   https://helloonebahrain.com/api/payments/benefit/ack
   ```

2. **BenefitPay cannot reach localhost**: If you use `localhost:3000`, BenefitPay servers cannot reach your server, causing the IPAY0400001 error.

3. **Testing locally**: If you need to test locally:
   - Deploy to Vercel first
   - OR use ngrok/cloudflared tunnel and update CLIENT_URL to the tunnel URL

## Verification Checklist

After setting environment variables:

- [ ] `CLIENT_URL` is set to production domain (no localhost)
- [ ] All BenefitPay credentials are correct
- [ ] Variables are set in both local .env.local and Vercel
- [ ] Vercel variables are applied to all environments (Production, Preview, Development)
- [ ] After updating Vercel variables, redeploy the application

## Testing

To verify the configuration:

1. Check that the ACK endpoint is publicly accessible:
   ```
   curl https://helloonebahrain.com/api/payments/benefit/ack?orderId=test
   ```
   Should return: `REDIRECT=https://helloonebahrain.com/pay/benefit/response?orderId=test`

2. Test the complete payment flow on production

3. Check Vercel logs for any configuration errors


