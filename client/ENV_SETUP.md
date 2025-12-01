# Client Environment Variables Setup

Create a `.env.local` file in the `client` directory with the following variables:

```env
# API Base URL
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
```

## Environment-Specific Configuration

### Development
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
```

### Production
```env
NEXT_PUBLIC_API_BASE_URL=https://your-api-domain.com
```

## Notes

- The `NEXT_PUBLIC_` prefix is required for variables that need to be available in the browser
- Never put sensitive secrets in `NEXT_PUBLIC_` variables as they are exposed to the client
- `.env.local` is automatically ignored by git
- Restart the development server after changing environment variables

