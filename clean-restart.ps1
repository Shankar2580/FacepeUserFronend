# Clean restart script for React Native Expo app
Write-Host "🧹 Cleaning development environment..." -ForegroundColor Green

# Stop any running Metro bundler
Write-Host "⏹️  Stopping Metro bundler..." -ForegroundColor Yellow
try {
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowTitle -like "*Metro*" } | Stop-Process -Force
} catch {
    Write-Host "No Metro processes to stop" -ForegroundColor Gray
}

# Clear Metro cache
Write-Host "🧽 Clearing Metro cache..." -ForegroundColor Yellow
npx expo r -c

# Clear npm cache
Write-Host "📦 Clearing npm cache..." -ForegroundColor Yellow
npm cache clean --force

# Remove node_modules and reinstall (optional - uncomment if needed)
# Write-Host "🗂️  Removing node_modules..." -ForegroundColor Yellow
# Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
# Write-Host "📥 Reinstalling dependencies..." -ForegroundColor Yellow
# npm install

Write-Host "✅ Environment cleaned! Starting development server..." -ForegroundColor Green
Write-Host "🚀 Starting Expo with clear cache..." -ForegroundColor Cyan

# Start Expo with cleared cache
npx expo start --clear 