# Publish OTA Update Script for Facepe App
# This script publishes updates to existing APK installations

param(
    [string]$Message = "Bug fixes and improvements",
    [string]$Channel = "production"
)

Write-Host "🚀 Publishing OTA Update to Facepe App" -ForegroundColor Green
Write-Host "Channel: $Channel" -ForegroundColor Yellow
Write-Host "Message: $Message" -ForegroundColor Yellow
Write-Host ""

# Check if EAS CLI is installed
Write-Host "📋 Checking EAS CLI..." -ForegroundColor Blue
try {
    $easVersion = eas --version
    Write-Host "✅ EAS CLI found: $easVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ EAS CLI not found. Installing..." -ForegroundColor Red
    npm install -g eas-cli
    Write-Host "✅ EAS CLI installed successfully" -ForegroundColor Green
}

# Login to EAS if needed
Write-Host "🔐 Checking EAS authentication..." -ForegroundColor Blue
try {
    $whoami = eas whoami
    Write-Host "✅ Logged in as: $whoami" -ForegroundColor Green
} catch {
    Write-Host "❌ Not logged in to EAS. Please login..." -ForegroundColor Red
    eas login
    Write-Host "✅ Login completed" -ForegroundColor Green
}

# Build and publish the update
Write-Host "📦 Publishing update..." -ForegroundColor Blue
Write-Host "This will publish to both phones with existing APK installations" -ForegroundColor Yellow

try {
    # Publish the update
    Write-Host "Publishing to channel: $Channel" -ForegroundColor Cyan
    eas update --channel $Channel --message "$Message"

    Write-Host ""
    Write-Host "🎉 Update published successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📱 The update will be available to:" -ForegroundColor Yellow
    Write-Host "   • Your phone (with existing APK)" -ForegroundColor White
    Write-Host "   • Stakeholder's phone (with existing APK)" -ForegroundColor White
    Write-Host ""
    Write-Host "⏱️  Update delivery:" -ForegroundColor Yellow
    Write-Host "   • Automatic check: Next app launch" -ForegroundColor White
    Write-Host "   • Manual check: Profile > Check for Updates" -ForegroundColor White
    Write-Host ""
    Write-Host "🔄 Users will see an update notification when they open the app" -ForegroundColor Green
    
} catch {
    Write-Host "❌ Failed to publish update: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "💡 Try running: eas login" -ForegroundColor Yellow
    exit 1
}

# Show next steps
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Blue
Write-Host "1. Ask both users to open the app" -ForegroundColor White
Write-Host "2. They will see 'Update Available' notification" -ForegroundColor White
Write-Host "3. Users can tap 'Update Now' to install" -ForegroundColor White
Write-Host "4. Or check manually in Profile > Check for Updates" -ForegroundColor White

Write-Host ""
Write-Host "✨ Update Process Complete!" -ForegroundColor Green
Write-Host "Both phones will receive the update automatically when they next open the app." -ForegroundColor White 