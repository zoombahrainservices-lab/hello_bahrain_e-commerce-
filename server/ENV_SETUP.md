# Server Environment Variables Setup

Create a `.env` file in the `server` directory with the following variables:

```env
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/hellobahrain_ecommerce
# For MongoDB Atlas, use:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/hellobahrain_ecommerce

# JWT Secret (use a strong, random string in production)
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production

# Google OAuth Credentials (optional)
# Get these from https://console.cloud.google.com/
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Client Configuration
CLIENT_URL=http://localhost:3000

# Server Configuration
SERVER_PORT=5000

# Environment
NODE_ENV=development
```

## Getting Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to Credentials → Create Credentials → OAuth 2.0 Client ID
5. Configure the OAuth consent screen if prompted
6. Set Application type to "Web application"
7. Add Authorized redirect URI: `http://localhost:5000/api/auth/google/callback`
8. Copy the Client ID and Client Secret to your `.env` file

## Security Notes

- Never commit the `.env` file to version control
- Use strong, unique values for JWT_SECRET in production
- Rotate secrets regularly in production
- Use environment-specific configurations for different deployment stages

