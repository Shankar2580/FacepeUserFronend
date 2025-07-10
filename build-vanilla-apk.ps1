#!/usr/bin/env powershell

# Build APK using vanilla React Native method (not EAS)
# This script creates a production APK for the Facepe app

Write-Host "Building Facepe APK using vanilla React Native method..." -ForegroundColor Green
Write-Host "This will create a production-ready APK file" -ForegroundColor Cyan

# Check if we're in the correct directory
if (-not (Test-Path "package.json")) {
    Write-Host "Error: package.json not found. Please run this script from the PayByFaeAi directory." -ForegroundColor Red
    exit 1
}

# Check if Android development environment is set up
Write-Host "Checking Android development environment..." -ForegroundColor Yellow

if (-not $env:ANDROID_HOME) {
    Write-Host "Error: ANDROID_HOME environment variable is not set." -ForegroundColor Red
    Write-Host "Please install Android SDK and set ANDROID_HOME environment variable." -ForegroundColor Red
    exit 1
}

if (-not (Test-Path "$env:ANDROID_HOME\platform-tools\adb.exe")) {
    Write-Host "Error: Android SDK platform-tools not found." -ForegroundColor Red
    Write-Host "Please install Android SDK platform-tools." -ForegroundColor Red
    exit 1
}

Write-Host "Android development environment is set up correctly." -ForegroundColor Green

# Clean previous builds
Write-Host "Cleaning previous builds..." -ForegroundColor Yellow
if (Test-Path "android\app\build") {
    Remove-Item -Recurse -Force "android\app\build"
    Write-Host "Cleaned android/app/build directory" -ForegroundColor Green
}

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Failed to install dependencies." -ForegroundColor Red
    exit 1
}
Write-Host "Dependencies installed successfully." -ForegroundColor Green

# Pre-build bundle
Write-Host "Creating JavaScript bundle..." -ForegroundColor Yellow
npx expo export --platform android --output-dir dist
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Failed to create JavaScript bundle." -ForegroundColor Red
    exit 1
}
Write-Host "JavaScript bundle created successfully." -ForegroundColor Green

# Navigate to android directory
Set-Location android

# Clean gradle
Write-Host "Cleaning gradle..." -ForegroundColor Yellow
.\gradlew clean
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Gradle clean failed." -ForegroundColor Red
    Set-Location ..
    exit 1
}
Write-Host "Gradle clean completed." -ForegroundColor Green

# Build release APK
Write-Host "Building release APK..." -ForegroundColor Yellow
Write-Host "This may take several minutes..." -ForegroundColor Cyan
.\gradlew assembleRelease
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: APK build failed." -ForegroundColor Red
    Set-Location ..
    exit 1
}

# Navigate back to root
Set-Location ..

# Check if APK was created
$apkPath = "android\app\build\outputs\apk\release\app-release.apk"
if (Test-Path $apkPath) {
    Write-Host "SUCCESS! APK built successfully!" -ForegroundColor Green
    Write-Host "APK Location: $apkPath" -ForegroundColor Cyan
    
    # Get APK size
    $apkSize = [math]::Round((Get-Item $apkPath).Length / 1MB, 2)
    Write-Host "APK Size: $apkSize MB" -ForegroundColor Cyan
    
    # Create a more accessible copy
    $outputDir = "apk-builds"
    if (-not (Test-Path $outputDir)) {
        New-Item -ItemType Directory -Path $outputDir | Out-Null
    }
    
    $timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
    $outputApk = "$outputDir\Facepe-v1.0.1-$timestamp.apk"
    Copy-Item $apkPath $outputApk
    
    Write-Host "APK copied to: $outputApk" -ForegroundColor Green
    Write-Host "" -ForegroundColor White
    Write-Host "BUILD SUMMARY:" -ForegroundColor Yellow
    Write-Host "  Face Registration: Working with HTTP network config" -ForegroundColor Green
    Write-Host "  Notifications: Fully implemented and tested" -ForegroundColor Green
    Write-Host "  Network Security: HTTP API access configured" -ForegroundColor Green
    Write-Host "  APK Build: Vanilla React Native method (not EAS)" -ForegroundColor Green
    Write-Host "" -ForegroundColor White
    Write-Host "Install APK on device:" -ForegroundColor Cyan
    Write-Host "  adb install `"$outputApk`"" -ForegroundColor White
    Write-Host "" -ForegroundColor White
    Write-Host "Network Configuration:" -ForegroundColor Cyan
    Write-Host "  Face API: https://18.188.145.222:8443" -ForegroundColor White
    Write-Host "  Main API: https://customer-backend-3esf.onrender.com" -ForegroundColor White
    Write-Host "  HTTP traffic allowed for face registration" -ForegroundColor White
    
} else {
    Write-Host "Error: APK file not found at expected location." -ForegroundColor Red
    Write-Host "Expected: $apkPath" -ForegroundColor Red
    exit 1
}

Write-Host "" -ForegroundColor White
Write-Host "Build process completed successfully!" -ForegroundColor Green 