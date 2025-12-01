# Deployment Guide

This guide covers deploying the HelloBahrain e-commerce application to production.

## Prerequisites

- MongoDB Atlas account (or self-hosted MongoDB)
- Hosting service for the backend (Heroku, Railway, DigitalOcean, etc.)
- Hosting service for the frontend (Vercel, Netlify, etc.)
- Domain name (optional)

## Backend Deployment

### Option 1: Railway

1. **Create a Railway Account** at [railway.app](https://railway.app)

2. **Create a New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Connect your repository

3. **Configure Environment Variables**
   ```
   MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/db
   JWT_SECRET=your_production_jwt_secret
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   CLIENT_URL=https://your-frontend-domain.com
   SERVER_PORT=5000
   NODE_ENV=production
   ```

4. **Configure Build Settings**
   - Root Directory: `server`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`

5. **Deploy** - Railway will automatically deploy your app

### Option 2: Heroku

1. **Install Heroku CLI** and login
   ```bash
   heroku login
   ```

2. **Create Heroku App**
   ```bash
   cd server
   heroku create your-app-name
   ```

3. **Set Environment Variables**
   ```bash
   heroku config:set MONGODB_URI=your_mongodb_uri
   heroku config:set JWT_SECRET=your_jwt_secret
   heroku config:set GOOGLE_CLIENT_ID=your_google_client_id
   heroku config:set GOOGLE_CLIENT_SECRET=your_google_client_secret
   heroku config:set CLIENT_URL=https://your-frontend.vercel.app
   heroku config:set NODE_ENV=production
   ```

4. **Create Procfile** in server directory:
   ```
   web: node dist/index.js
   ```

5. **Deploy**
   ```bash
   git push heroku main
   ```

## Frontend Deployment

### Vercel (Recommended for Next.js)

1. **Create Vercel Account** at [vercel.com](https://vercel.com)

2. **Import Project**
   - Click "New Project"
   - Import from GitHub
   - Select your repository

3. **Configure Project**
   - Framework Preset: Next.js
   - Root Directory: `client`
   - Build Command: `npm run build`
   - Output Directory: `.next`

4. **Environment Variables**
   ```
   NEXT_PUBLIC_API_BASE_URL=https://your-backend-api.railway.app
   ```

5. **Deploy** - Vercel will automatically build and deploy

### Netlify

1. **Create Netlify Account** at [netlify.com](https://netlify.com)

2. **Import Project**
   - Click "Add new site"
   - Import from Git

3. **Build Settings**
   - Base directory: `client`
   - Build command: `npm run build`
   - Publish directory: `client/.next`

4. **Environment Variables**
   - Add `NEXT_PUBLIC_API_BASE_URL` in Site Settings → Environment Variables

## MongoDB Atlas Setup

1. **Create MongoDB Atlas Account** at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)

2. **Create a Cluster**
   - Choose free tier for development
   - Select a cloud provider and region

3. **Create Database User**
   - Go to Database Access
   - Add a new user with password
   - Save credentials securely

4. **Configure Network Access**
   - Go to Network Access
   - Add IP Address
   - For development: Allow access from anywhere (0.0.0.0/0)
   - For production: Whitelist specific IPs

5. **Get Connection String**
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your user's password

6. **Seed Production Database** (Optional)
   ```bash
   # Update server/.env with production MONGODB_URI
   cd server
   npm run seed
   ```

## Google OAuth Production Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to Credentials
4. Edit your OAuth 2.0 Client ID
5. Add Authorized redirect URIs:
   ```
   https://your-backend-domain.com/api/auth/google/callback
   ```
6. Update environment variables with production credentials

## Post-Deployment Checklist

- [ ] Backend is running and accessible
- [ ] Frontend is deployed and accessible
- [ ] Database connection is working
- [ ] Environment variables are set correctly
- [ ] Google OAuth works (if enabled)
- [ ] Test user registration and login
- [ ] Test product browsing and search
- [ ] Test cart functionality
- [ ] Test checkout and order creation
- [ ] Test admin panel access
- [ ] Verify HTTPS is working
- [ ] Check CORS configuration
- [ ] Monitor error logs

## Domain Configuration

### Backend Custom Domain

1. **Railway**: Go to Settings → Domains → Add custom domain
2. **Heroku**: 
   ```bash
   heroku domains:add api.yourdomain.com
   ```
3. Configure DNS records as instructed

### Frontend Custom Domain

1. **Vercel**: Go to Settings → Domains → Add domain
2. **Netlify**: Go to Domain Settings → Add custom domain
3. Configure DNS records (usually CNAME or A record)

## Continuous Deployment

Both Vercel and Railway support automatic deployments:
- Push to your main branch to deploy to production
- Push to development branch for staging environment
- Use pull request previews for testing changes

## Monitoring and Logs

### Backend Logs
- **Railway**: View logs in the Railway dashboard
- **Heroku**: `heroku logs --tail`

### Frontend Logs
- **Vercel**: View deployment logs in dashboard
- **Netlify**: View logs in deployment details

## Security Best Practices

1. **Use Strong Secrets**
   - Generate strong JWT secrets: `openssl rand -base64 32`
   - Never commit secrets to version control

2. **Enable HTTPS**
   - Both Vercel and Railway provide HTTPS by default
   - Enforce HTTPS in production

3. **Secure Cookies**
   - JWT cookies are set to secure in production (NODE_ENV=production)

4. **Rate Limiting** (Optional Enhancement)
   - Add rate limiting middleware to prevent abuse
   - Use services like Cloudflare for DDoS protection

5. **Regular Updates**
   - Keep dependencies updated
   - Monitor security advisories

## Troubleshooting

### Backend Won't Start
- Check environment variables are set correctly
- Verify MongoDB connection string
- Check build logs for errors

### Frontend Can't Connect to Backend
- Verify NEXT_PUBLIC_API_BASE_URL is correct
- Check CORS settings in backend
- Ensure backend is accessible

### Database Connection Issues
- Check MongoDB Atlas IP whitelist
- Verify connection string format
- Ensure database user has correct permissions

## Scaling Considerations

As your application grows:
1. Upgrade MongoDB Atlas tier for more storage/connections
2. Enable Redis for session management
3. Add CDN for static assets
4. Implement caching strategies
5. Consider load balancing for backend
6. Monitor performance and optimize queries

