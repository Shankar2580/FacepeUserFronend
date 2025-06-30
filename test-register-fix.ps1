#!/usr/bin/env pwsh

Write-Host "Testing Registration Screen Fixes..." -ForegroundColor Green

# Clear any existing Metro cache
Write-Host "Clearing Metro cache..." -ForegroundColor Yellow
npx expo start --clear --dev-client

Write-Host "Registration screen fixes applied:" -ForegroundColor Green
Write-Host "1. Fixed text rendering issue with phone prefix" -ForegroundColor Cyan
Write-Host "2. Made button widths consistent with input areas" -ForegroundColor Cyan
Write-Host "3. Aligned form layout with login screen" -ForegroundColor Cyan
Write-Host "4. Removed unnecessary width constraints" -ForegroundColor Cyan

Write-Host "`nPlease test the registration flow and verify:" -ForegroundColor Yellow
Write-Host "- No 'Text strings must be rendered within a <Text> component' error" -ForegroundColor White
Write-Host "- Registration button same width as input areas" -ForegroundColor White
Write-Host "- Input areas same size as login screen" -ForegroundColor White 