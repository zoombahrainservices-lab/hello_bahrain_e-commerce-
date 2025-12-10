# Google OAuth Setup Guide

## ✅ What I Fixed

1. **Created Next.js API routes** for Google OAuth (replacing Express/Passport.js)
2. **Updated frontend** to use relative paths (no more localhost:5000)
3. **Fixed redirect URLs** to use Vercel domain instead of Render

---

## 🔧 Setup Steps

### Step 1: Add Environment Variables in Vercel

Go to **Vercel Dashboard** → **Settings** → **Environment Variables** and add:

```env
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_CALLBACK_URL=https://helloonebahrain.com/api/auth/google/callback
CLIENT_URL=https://helloonebahrain.com
```

### Step 2: Update Google Cloud Console

1. Go to **Google Cloud Console**: https://console.cloud.google.com
2. Select your project
3. Go to **APIs & Services** → **Credentials**
4. Click on your **OAuth 2.0 Client ID**
5. Under **Authorized redirect URIs**, add:
   ```
   https://helloonebahrain.com/api/auth/google/callback
   ```
6. **Remove** the old Render URL if it exists:
   ```
   https://hello-bahrain-e-commerce.onrender.com/api/auth/google/callback
   ```
7. Click **Save**

### Step 3: Redeploy on Vercel

After adding environment variables:

1. Go to **Vercel** → **Deployments**
2. Click **"..."** → **"Redeploy"**
3. Wait for deployment to complete

---

## 🧪 Test Google Auth

1. Go to your website: `https://helloonebahrain.com`
2. Click **"Login"**
3. Click **"Continue with Google"**
4. Should redirect to Google login
5. After login, should redirect back to your site

---

## 📁 Files Created/Updated

### New Files:
- `client/src/app/api/auth/google/route.ts` - Initiates Google OAuth
- `client/src/app/api/auth/google/callback/route.ts` - Handles callback
- `client/src/app/auth/google/success/page.tsx` - Success page

### Updated Files:
- `client/src/app/auth/login/LoginClient.tsx` - Uses relative path
- `client/src/app/auth/register/page.tsx` - Uses relative path

---

## 🔍 Troubleshooting

### Issue: "Unknown authentication strategy 'google'"
**Fixed!** This was because the old Express/Passport.js routes didn't exist in Next.js. Now we have proper Next.js API routes.

### Issue: Redirecting to localhost
**Fixed!** Updated all frontend code to use relative paths (`/api/auth/google`) instead of `http://localhost:5000/api/auth/google`.

### Issue: "redirect_uri_mismatch" error
**Solution**: Make sure the redirect URI in Google Cloud Console **exactly matches**:
```
https://helloonebahrain.com/api/auth/google/callback
```

### Issue: Still not working
1. Check environment variables are set in Vercel
2. Verify `GOOGLE_CALLBACK_URL` matches Google Cloud Console
3. **Redeploy** after changing environment variables
4. Check Vercel function logs for errors

---

## ✅ Quick Checklist

- [ ] Added `GOOGLE_CLIENT_ID` to Vercel
- [ ] Added `GOOGLE_CLIENT_SECRET` to Vercel
- [ ] Added `GOOGLE_CALLBACK_URL` to Vercel (or it will use default)
- [ ] Added `CLIENT_URL` to Vercel (or it will use default)
- [ ] Updated Google Cloud Console redirect URI
- [ ] **Redeployed** on Vercel
- [ ] Tested Google login

---

## 🎉 Done!

Google OAuth should now work with your Vercel deployment!


