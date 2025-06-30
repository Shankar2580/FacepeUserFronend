#!/usr/bin/env powershell

# Debug APK Crash Script
# This script helps identify and fix common APK crash issues

Write-Host "Debugging Facepe APK Crash Issues..." -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan

# Check if we're in the correct directory
if (-not (Test-Path "package.json")) {
    Write-Host "Error: package.json not found. Please run this script from the PayByFaeAi directory." -ForegroundColor Red
    exit 1
}

Write-Host "1. Checking for common crash causes..." -ForegroundColor Yellow

# Check if device is connected
Write-Host "   - Checking ADB connection..." -ForegroundColor Cyan
$adbDevices = adb devices
if ($adbDevices -match "device$") {
    Write-Host "   ✓ Android device detected" -ForegroundColor Green
    
    # Try to get crash logs
    Write-Host "   - Fetching crash logs..." -ForegroundColor Cyan
    Write-Host "   Running: adb logcat -d | findstr -i 'facepe\|crash\|error\|exception'" -ForegroundColor Gray
    
    $crashLogs = adb logcat -d | Select-String -Pattern "facepe|crash|error|exception" -CaseSensitive:$false | Select-Object -Last 20
    if ($crashLogs) {
        Write-Host "   ⚠ Found potential crash logs:" -ForegroundColor Yellow
        $crashLogs | ForEach-Object { Write-Host "     $_" -ForegroundColor Red }
    } else {
        Write-Host "   ⚠ No obvious crash logs found in recent logcat" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ⚠ No Android device connected via ADB" -ForegroundColor Yellow
    Write-Host "   Please connect your device and enable USB debugging" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "2. Analyzing app configuration..." -ForegroundColor Yellow

# Check app.json for problematic settings
$appJson = Get-Content "app.json" | ConvertFrom-Json
Write-Host "   - New Architecture: $($appJson.expo.newArchEnabled)" -ForegroundColor Cyan
Write-Host "   - Updates enabled: $($appJson.expo.updates.enabled)" -ForegroundColor Cyan
Write-Host "   - Version: $($appJson.expo.version)" -ForegroundColor Cyan

if ($appJson.expo.newArchEnabled -eq $true) {
    Write-Host "   ⚠ New Architecture is enabled - this can cause crashes" -ForegroundColor Yellow
}

if ($appJson.expo.updates.enabled -eq $true) {
    Write-Host "   ⚠ Expo Updates is enabled - this can cause crashes if server is unreachable" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "3. Common fixes to try:" -ForegroundColor Yellow

Write-Host "   Fix 1: Disable New Architecture (recommended)" -ForegroundColor Cyan
Write-Host "   Fix 2: Disable Expo Updates for standalone APK" -ForegroundColor Cyan
Write-Host "   Fix 3: Build with compatibility mode" -ForegroundColor Cyan
Write-Host "   Fix 4: Clear app data and rebuild" -ForegroundColor Cyan

Write-Host ""
$choice = Read-Host "Would you like to apply these fixes automatically? (y/n)"

if ($choice -eq 'y' -or $choice -eq 'Y') {
    Write-Host ""
    Write-Host "Applying fixes..." -ForegroundColor Green
    
    # Create backup
    Write-Host "Creating backup of app.json..." -ForegroundColor Cyan
    Copy-Item "app.json" "app.json.backup"
    
    # Fix 1: Disable New Architecture
    Write-Host "Fix 1: Disabling New Architecture..." -ForegroundColor Cyan
    $appJson.expo.newArchEnabled = $false
    
    # Fix 2: Disable Expo Updates
    Write-Host "Fix 2: Disabling Expo Updates..." -ForegroundColor Cyan
    $appJson.expo.updates.enabled = $false
    $appJson.expo.updates.checkAutomatically = "NEVER"
    
    # Save changes
    $appJson | ConvertTo-Json -Depth 10 | Set-Content "app.json"
    Write-Host "✓ Updated app.json with fixes" -ForegroundColor Green
    
    # Fix 3: Clean build
    Write-Host "Fix 3: Cleaning build cache..." -ForegroundColor Cyan
    if (Test-Path "android/app/build") {
        Remove-Item -Recurse -Force "android/app/build"
        Write-Host "✓ Cleaned Android build cache" -ForegroundColor Green
    }
    
    if (Test-Path ".expo") {
        Remove-Item -Recurse -Force ".expo"
        Write-Host "✓ Cleaned Expo cache" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "Fixes applied! Now building new APK..." -ForegroundColor Green
    Write-Host "Running: powershell -ExecutionPolicy Bypass -File build-apk-direct.ps1" -ForegroundColor Cyan
    
    # Build new APK
    & powershell -ExecutionPolicy Bypass -File build-apk-direct.ps1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "SUCCESS! New APK built with crash fixes applied." -ForegroundColor Green
        Write-Host "The new APK should be more stable." -ForegroundColor Cyan
        Write-Host ""
        Write-Host "If it still crashes, try these additional steps:" -ForegroundColor Yellow
        Write-Host "1. Uninstall the old app completely before installing new one" -ForegroundColor White
        Write-Host "2. Restart your device" -ForegroundColor White
        Write-Host "3. Check if your device has sufficient storage" -ForegroundColor White
        Write-Host "4. Try installing on a different device" -ForegroundColor White
    } else {
        Write-Host "Build failed. Please check the error messages above." -ForegroundColor Red
    }
    
} else {
    Write-Host ""
    Write-Host "Manual fix instructions:" -ForegroundColor Yellow
    Write-Host "1. Edit app.json and set newArchEnabled to false" -ForegroundColor White
    Write-Host "2. Edit app.json and set updates.enabled to false" -ForegroundColor White
    Write-Host "3. Delete android/app/build and .expo folders" -ForegroundColor White
    Write-Host "4. Rebuild APK using build-apk-direct.ps1" -ForegroundColor White
}

Write-Host ""
Write-Host "Debug script completed!" -ForegroundColor Green 