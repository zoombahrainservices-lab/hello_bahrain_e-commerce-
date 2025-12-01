# How to Check if Your Backend is Working

## Method 1: Start the Backend and Test

### Step 1: Start the Backend Server

Open a terminal in the **server** directory and run:

```bash
cd server
npm run dev
```

You should see output like:
```
🚀 Server is running on port 5000
📍 Health check: http://localhost:5000/health
🌍 Client URL: http://localhost:3000
✅ Supabase Connected Successfully
```

### Step 2: Test the Health Endpoint

**Option A: Using Browser**
- Open: http://localhost:5000/health
- You should see: `{"status":"OK","message":"Server is running"}`

**Option B: Using PowerShell**
```powershell
Invoke-WebRequest -Uri "http://localhost:5000/health" -UseBasicParsing
```

**Option C: Using curl (if available)**
```bash
curl http://localhost:5000/health
```

## Method 2: Test API Endpoints

### Test Products Endpoint
```powershell
# Get all products
Invoke-WebRequest -Uri "http://localhost:5000/api/products" -UseBasicParsing

# Get products with filters
Invoke-WebRequest -Uri "http://localhost:5000/api/products?category=T-Shirts&limit=5" -UseBasicParsing
```

### Test Banners Endpoint
```powershell
Invoke-WebRequest -Uri "http://localhost:5000/api/banners/active" -UseBasicParsing
```

### Test Auth Endpoint (Health Check)
```powershell
Invoke-WebRequest -Uri "http://localhost:5000/api/auth/me" -UseBasicParsing
# Should return 401 (unauthorized) - this is normal, means endpoint is working
```

## Method 3: Check if Port is in Use

```powershell
Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue
```

If you see output, the port is in use (backend might be running).

## Method 4: Quick Test Script

Create a file `test-backend.ps1`:

```powershell
Write-Host "Testing Backend Server..." -ForegroundColor Cyan

# Test health endpoint
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/health" -TimeoutSec 3 -UseBasicParsing
    Write-Host "✅ Backend is RUNNING!" -ForegroundColor Green
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($response.Content)" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend is NOT running" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host "`nStart the backend with: cd server && npm run dev" -ForegroundColor Yellow
}

# Test products endpoint
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/products?limit=1" -TimeoutSec 3 -UseBasicParsing
    Write-Host "`n✅ Products API is working!" -ForegroundColor Green
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "`n⚠️  Products API test failed" -ForegroundColor Yellow
}
```

Run it:
```powershell
.\test-backend.ps1
```

## Common Issues

### Backend Not Starting?

1. **Check if port 5000 is already in use:**
   ```powershell
   Get-NetTCPConnection -LocalPort 5000
   ```
   If something is using it, either stop that process or change `SERVER_PORT` in `server/.env`

2. **Check environment variables:**
   ```powershell
   Get-Content server\.env
   ```
   Make sure `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set

3. **Check for errors in terminal:**
   - Look for connection errors
   - Check if Supabase credentials are correct

### Backend Starts but Health Check Fails?

1. **Wait a few seconds** - server might still be initializing
2. **Check the terminal output** for any error messages
3. **Verify Supabase connection** - should see "✅ Supabase Connected Successfully"

## Expected Behavior

When backend is working correctly:

✅ Health endpoint returns: `{"status":"OK","message":"Server is running"}`
✅ Products endpoint returns: JSON array of products
✅ Banners endpoint returns: JSON array of banners
✅ No errors in terminal
✅ Port 5000 is listening

## Quick Commands Reference

```bash
# Start backend
cd server
npm run dev

# Test health (in another terminal)
Invoke-WebRequest http://localhost:5000/health

# Test products
Invoke-WebRequest http://localhost:5000/api/products

# Check if running
Get-NetTCPConnection -LocalPort 5000
```




