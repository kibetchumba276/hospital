@echo off
echo.
echo ========================================================
echo    Hospital Management System - Installation Script
echo ========================================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed. Please install Node.js 18+ first.
    pause
    exit /b 1
)

echo [OK] Node.js version:
node --version
echo.

REM Install dependencies
echo [INFO] Installing dependencies...
call npm install

if %ERRORLEVEL% EQU 0 (
    echo [OK] Dependencies installed successfully!
) else (
    echo [ERROR] Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo ========================================================
echo [SUCCESS] Installation Complete!
echo ========================================================
echo.
echo Next Steps:
echo.
echo 1. Setup Database:
echo    - Go to: https://supabase.com/dashboard/project/mzxubcgsidqaoodwclwe/sql
echo    - Run database-schema.sql
echo    - Run rls-policies.sql
echo.
echo 2. Create Admin User (see QUICK-START.md)
echo.
echo 3. Start Development Server:
echo    npm run dev
echo.
echo 4. Open: http://localhost:3000
echo.
echo Documentation:
echo    - QUICK-START.md - Get running in 5 minutes
echo    - DEPLOYMENT-GUIDE.md - Complete setup guide
echo    - PROJECT-SUMMARY.md - Full feature overview
echo.
echo Happy coding!
echo.
pause
