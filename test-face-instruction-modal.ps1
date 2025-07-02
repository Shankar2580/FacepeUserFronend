#!/usr/bin/env pwsh

# Face Registration Instruction Modal Test Script
# This script helps test the enhanced face registration modal with images

Write-Host "Face Registration Instruction Modal Test" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# Check if we're in the correct directory
if (-not (Test-Path "app.json")) {
    Write-Host "Error: Please run this script from the PayByFaeAi directory" -ForegroundColor Red
    exit 1
}

Write-Host "Checking project structure..." -ForegroundColor Yellow

# Check if assets/images directory exists
if (-not (Test-Path "assets/images")) {
    Write-Host "Creating assets/images directory..." -ForegroundColor Blue
    New-Item -ItemType Directory -Path "assets/images" -Force | Out-Null
    Write-Host "Created assets/images directory" -ForegroundColor Green
} else {
    Write-Host "assets/images directory exists" -ForegroundColor Green
}

# Check for required image files
$requiredImages = @(
    "assets/images/facerec1.png",
    "assets/images/facerec2.png"
)

$missingImages = @()
foreach ($image in $requiredImages) {
    if (Test-Path $image) {
        Write-Host "Found: $image" -ForegroundColor Green
    } else {
        Write-Host "Missing: $image" -ForegroundColor Red
        $missingImages += $image
    }
}

if ($missingImages.Count -gt 0) {
    Write-Host ""
    Write-Host "MISSING IMAGES DETECTED" -ForegroundColor Yellow
    Write-Host "The following images need to be added for the modal to display properly:" -ForegroundColor Yellow
    foreach ($image in $missingImages) {
        Write-Host "  - $image" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "Please add these images and run the script again." -ForegroundColor Blue
    Write-Host "See FACE_INSTRUCTION_IMAGES_SETUP.md for detailed instructions." -ForegroundColor Blue
}

# Check if the modal component exists and has been updated
if (Test-Path "components/ui/FaceRegistrationInstructionModal.tsx") {
    Write-Host "FaceRegistrationInstructionModal.tsx exists" -ForegroundColor Green
    
    # Check if the component has the new image functionality
    $componentContent = Get-Content "components/ui/FaceRegistrationInstructionModal.tsx" -Raw
    if ($componentContent -match "instructionImage" -and $componentContent -match "isTablet") {
        Write-Host "Modal component has been updated with image support and tablet responsiveness" -ForegroundColor Green
    } else {
        Write-Host "Modal component needs to be updated" -ForegroundColor Red
    }
} else {
    Write-Host "FaceRegistrationInstructionModal.tsx not found" -ForegroundColor Red
}

Write-Host ""
Write-Host "TESTING OPTIONS" -ForegroundColor Cyan
Write-Host "===============" -ForegroundColor Cyan

# Ask user what they want to do
Write-Host "Choose an option:" -ForegroundColor Yellow
Write-Host "1. Start development server to test the modal" -ForegroundColor White
Write-Host "2. Check component syntax and dependencies" -ForegroundColor White
Write-Host "3. View setup instructions" -ForegroundColor White
Write-Host "4. Exit" -ForegroundColor White

$choice = Read-Host "Enter your choice (1-4)"

switch ($choice) {
    "1" {
        Write-Host "Starting development server..." -ForegroundColor Blue
        Write-Host "Navigate to the face registration screen to test the modal!" -ForegroundColor Green
        Write-Host "Path: Profile -> Face Recognition -> Setup" -ForegroundColor Yellow
        npx expo start
    }
    "2" {
        Write-Host "Checking TypeScript and dependencies..." -ForegroundColor Blue
        npx tsc --noEmit
        if ($LASTEXITCODE -eq 0) {
            Write-Host "TypeScript check passed" -ForegroundColor Green
        } else {
            Write-Host "TypeScript errors found" -ForegroundColor Red
        }
    }
    "3" {
        Write-Host "Opening setup instructions..." -ForegroundColor Blue
        if (Test-Path "FACE_INSTRUCTION_IMAGES_SETUP.md") {
            if (Get-Command code -ErrorAction SilentlyContinue) {
                code "FACE_INSTRUCTION_IMAGES_SETUP.md"
            } else {
                Write-Host "Please open FACE_INSTRUCTION_IMAGES_SETUP.md manually" -ForegroundColor Yellow
            }
        } else {
            Write-Host "Setup instructions file not found" -ForegroundColor Red
        }
    }
    "4" {
        Write-Host "Goodbye!" -ForegroundColor Green
        exit 0
    }
    default {
        Write-Host "Invalid choice. Exiting." -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "FEATURES ADDED TO MODAL" -ForegroundColor Green
Write-Host "========================" -ForegroundColor Green
Write-Host "Visual instruction images (when added)" -ForegroundColor White
Write-Host "Tablet-responsive design (auto-detects tablets)" -ForegroundColor White
Write-Host "Enhanced tips and descriptions" -ForegroundColor White
Write-Host "Better spacing and typography" -ForegroundColor White
Write-Host "Fallback icons if images do not load" -ForegroundColor White
Write-Host "Professional gradients and shadows" -ForegroundColor White

Write-Host ""
Write-Host "TABLET FEATURES" -ForegroundColor Blue
Write-Host "===============" -ForegroundColor Blue
Write-Host "Larger images (300x300px vs 200x200px)" -ForegroundColor White
Write-Host "Increased text sizes" -ForegroundColor White
Write-Host "Better spacing and padding" -ForegroundColor White
Write-Host "Responsive layout constraints" -ForegroundColor White
Write-Host "Auto-detection for screens >= 768px width" -ForegroundColor White 