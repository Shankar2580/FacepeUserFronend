# PowerShell script to install required dependencies for face registration
Write-Host "Installing required dependencies for face registration..." -ForegroundColor Green

# Navigate to the PayByFaeAi directory
Set-Location PayByFaeAi

# Install expo-image-picker for camera/gallery functionality
Write-Host "Installing expo-image-picker..." -ForegroundColor Yellow
npm install expo-image-picker

Write-Host "Dependencies installed successfully!" -ForegroundColor Green
Write-Host "You may need to restart your development server after installation." -ForegroundColor Yellow 