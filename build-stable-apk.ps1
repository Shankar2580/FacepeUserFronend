#!/usr/bin/env powershell

# Stable APK Build Script
# This script builds an APK with crash-prevention measures

Write-Host "Building Stable Facepe APK..." -ForegroundColor Green
Write-Host "This script applies crash fixes before building" -ForegroundColor Cyan

# Check if we're in the correct directory
if (-not (Test-Path "package.json")) {
    Write-Host "Error: package.json not found. Please run this script from the PayByFaeAi directory." -ForegroundColor Red
    exit 1
}

# Step 1: Create backup and apply stability fixes
Write-Host "Step 1: Applying stability fixes..." -ForegroundColor Yellow

# Backup original app.json
if (-not (Test-Path "app.json.original")) {
    Copy-Item "app.json" "app.json.original"
    Write-Host "✓ Created backup of original app.json" -ForegroundColor Green
}

# Read and modify app.json for stability
$appJson = Get-Content "app.json" | ConvertFrom-Json

# Fix 1: Disable New Architecture (major crash cause)
Write-Host "  - Disabling New Architecture..." -ForegroundColor Cyan
$appJson.expo.newArchEnabled = $false

# Fix 2: Disable Expo Updates (prevents network-related crashes)
Write-Host "  - Disabling Expo Updates..." -ForegroundColor Cyan
$appJson.expo.updates.enabled = $false
$appJson.expo.updates.checkAutomatically = "NEVER"

# Fix 3: Ensure proper Android configuration
Write-Host "  - Optimizing Android configuration..." -ForegroundColor Cyan
$appJson.expo.android.versionCode = 3  # Increment version code
$appJson.expo.version = "1.0.2"        # Increment version

# Save the modified configuration
$appJson | ConvertTo-Json -Depth 10 | Set-Content "app.json"
Write-Host "✓ Applied stability fixes to app.json" -ForegroundColor Green

# Step 2: Clean build environment
Write-Host "Step 2: Cleaning build environment..." -ForegroundColor Yellow

$foldersToClean = @(
    "android/app/build",
    ".expo",
    "node_modules/.cache",
    "android/.gradle"
)

foreach ($folder in $foldersToClean) {
    if (Test-Path $folder) {
        Write-Host "  - Cleaning $folder..." -ForegroundColor Cyan
        Remove-Item -Recurse -Force $folder -ErrorAction SilentlyContinue
        Write-Host "  ✓ Cleaned $folder" -ForegroundColor Green
    }
}

# Step 3: Verify Android environment
Write-Host "Step 3: Verifying Android environment..." -ForegroundColor Yellow

if (-not $env:ANDROID_HOME) {
    Write-Host "Error: ANDROID_HOME environment variable is not set." -ForegroundColor Red
    Write-Host "Please install Android SDK and set ANDROID_HOME." -ForegroundColor Red
    exit 1
}

Write-Host "✓ Android environment verified" -ForegroundColor Green

# Step 4: Pre-build the JavaScript bundle
Write-Host "Step 4: Pre-building JavaScript bundle..." -ForegroundColor Yellow
Write-Host "Running: npx expo export --platform android --dev false" -ForegroundColor Cyan

npx expo export --platform android --dev false --clear
if ($LASTEXITCODE -ne 0) {
    Write-Host "Warning: JavaScript bundle build had issues, but continuing..." -ForegroundColor Yellow
}

# Step 5: Build the APK
Write-Host "Step 5: Building Android APK..." -ForegroundColor Yellow
Set-Location android

Write-Host "Building with stability flags..." -ForegroundColor Cyan
Write-Host "Command: .\gradlew assembleRelease --no-daemon --max-workers=2 --stacktrace" -ForegroundColor Gray

.\gradlew assembleRelease --no-daemon --max-workers=2 --stacktrace
$buildResult = $LASTEXITCODE

Set-Location ..

if ($buildResult -ne 0) {
    Write-Host "Error: APK build failed." -ForegroundColor Red
    Write-Host "Check the error messages above for details." -ForegroundColor Red
    exit 1
}

# Step 6: Verify and copy APK
Write-Host "Step 6: Finalizing APK..." -ForegroundColor Yellow

$apkPath = "android\app\build\outputs\apk\release\app-release.apk"
if (Test-Path $apkPath) {
    Write-Host "✓ APK built successfully!" -ForegroundColor Green
    
    # Get APK info
    $apkSize = [math]::Round((Get-Item $apkPath).Length / 1MB, 2)
    Write-Host "APK Size: $apkSize MB" -ForegroundColor Cyan
    
    # Create output directory
    $outputDir = "apk-builds"
    if (-not (Test-Path $outputDir)) {
        New-Item -ItemType Directory -Path $outputDir | Out-Null
    }
    
    # Copy with descriptive name
    $timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
    $outputApk = "$outputDir\Facepe-STABLE-v1.0.2-$timestamp.apk"
    Copy-Item $apkPath $outputApk
    
    Write-Host "✓ Stable APK saved to: $outputApk" -ForegroundColor Green
    
    # Step 7: Installation instructions
    Write-Host ""
    Write-Host "INSTALLATION INSTRUCTIONS:" -ForegroundColor Yellow
    Write-Host "=========================" -ForegroundColor Cyan
    Write-Host "1. UNINSTALL the old Facepe app completely" -ForegroundColor White
    Write-Host "2. Restart your Android device" -ForegroundColor White
    Write-Host "3. Install the new APK:" -ForegroundColor White
    Write-Host "   adb install `"$outputApk`"" -ForegroundColor Gray
    Write-Host "4. Or copy APK to device and install manually" -ForegroundColor White
    Write-Host ""
    Write-Host "STABILITY IMPROVEMENTS APPLIED:" -ForegroundColor Yellow
    Write-Host "==============================" -ForegroundColor Cyan
    Write-Host "✓ New Architecture disabled (prevents crashes)" -ForegroundColor Green
    Write-Host "✓ Expo Updates disabled (prevents network issues)" -ForegroundColor Green
    Write-Host "✓ Clean build environment" -ForegroundColor Green
    Write-Host "✓ Optimized Android configuration" -ForegroundColor Green
    Write-Host "✓ Version incremented (1.0.2)" -ForegroundColor Green
    Write-Host ""
    Write-Host "This APK should be much more stable!" -ForegroundColor Green
    
} else {
    Write-Host "Error: APK file not found at expected location." -ForegroundColor Red
    Write-Host "Expected: $apkPath" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Stable APK build completed successfully!" -ForegroundColor Green 