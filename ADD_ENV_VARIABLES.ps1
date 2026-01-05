# PowerShell script to add BENEFIT environment variables to .env.local
# Run this script from the project root: .\ADD_ENV_VARIABLES.ps1

$envFile = "client\.env.local"

# BENEFIT environment variables to add
$benefitVars = @"

# BENEFIT Payment Gateway (for BenefitPay payments)
BENEFIT_TRANPORTAL_ID=your_tranportal_id_here
BENEFIT_TRANPORTAL_PASSWORD=your_tranportal_password_here
BENEFIT_RESOURCE_KEY=your_resource_key_here
BENEFIT_ENDPOINT=https://test.benefit-gateway.bh/payment/API/hosted.htm

"@

if (Test-Path $envFile) {
    # Check if BENEFIT variables already exist
    $content = Get-Content $envFile -Raw
    if ($content -match "BENEFIT_TRANPORTAL_ID") {
        Write-Host "BENEFIT environment variables already exist in .env.local" -ForegroundColor Yellow
    } else {
        Add-Content -Path $envFile -Value $benefitVars
        Write-Host "BENEFIT environment variables added to .env.local" -ForegroundColor Green
    }
} else {
    Set-Content -Path $envFile -Value $benefitVars
    Write-Host "Created .env.local with BENEFIT environment variables" -ForegroundColor Green
}

Write-Host "`nPlease update the placeholder values with your actual BENEFIT credentials!" -ForegroundColor Cyan
Write-Host "Edit: $envFile" -ForegroundColor Cyan


