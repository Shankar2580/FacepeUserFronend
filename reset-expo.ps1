# Reset Expo Development Environment
Write-Host "🔄 Resetting Expo environment..." -ForegroundColor Green

# Clear Expo cache
Write-Host "🧹 Clearing Expo cache..." -ForegroundColor Yellow
if (Test-Path ".expo") {
    Remove-Item -Recurse -Force .expo
    Write-Host "✅ .expo directory removed" -ForegroundColor Green
} else {
    Write-Host "ℹ️  No .expo directory found" -ForegroundColor Gray
}

# Clear Metro cache
Write-Host "🧹 Clearing Metro cache..." -ForegroundColor Yellow
npx expo r -c

Write-Host "✅ Environment reset complete!" -ForegroundColor Green
Write-Host "📝 Now you can run: npx expo start" -ForegroundColor Cyan 