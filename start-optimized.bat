@echo off
echo Starting EduFlow with CPU monitoring...
echo.

REM Clear any existing cache
echo Clearing cache...
if exist .next rmdir /s /q .next
if exist node_modules\.cache rmdir /s /q node_modules\.cache

echo.
echo Starting development server with optimizations...
echo.

REM Set memory limits to prevent excessive usage
set NODE_OPTIONS=--max_old_space_size=2048 --optimize_for_size

REM Enable Next.js performance debugging
set DEBUG=next:*

REM Start with Turbopack for better performance
npm run dev:turbo

pause
