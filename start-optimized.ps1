# EduFlow Optimized Startup Script
Write-Host "🚀 Starting EduFlow with CPU optimizations..." -ForegroundColor Green
Write-Host ""

# Clear cache
Write-Host "🧹 Clearing cache..." -ForegroundColor Yellow
if (Test-Path ".next") { Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue }
if (Test-Path "node_modules\.cache") { Remove-Item -Recurse -Force node_modules\.cache -ErrorAction SilentlyContinue }

Write-Host ""
Write-Host "⚙️  Setting performance optimizations..." -ForegroundColor Yellow

# Set environment variables for performance
$env:NODE_OPTIONS = "--max_old_space_size=2048 --optimize_for_size"
$env:NEXT_TELEMETRY_DISABLED = "1"

Write-Host ""
Write-Host "🔧 Starting development server with Turbopack..." -ForegroundColor Green
Write-Host ""

# Start the development server
npm run dev:turbo
