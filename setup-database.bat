@echo off
REM BLUECON Database Setup Script
REM PostgreSQL 18 - Windows

SET PSQL="C:\Program Files\PostgreSQL\18\bin\psql.exe"
SET PGUSER=postgres
SET DB_NAME=bluecon

echo ============================================
echo BLUECON Database Setup
echo ============================================
echo.
echo You will be prompted for the PostgreSQL password.
echo (This is the password you set during PostgreSQL installation)
echo.

REM Step 1: Create Database
echo [1/5] Creating database...
%PSQL% -U %PGUSER% -c "CREATE DATABASE %DB_NAME%;"
if %errorlevel% neq 0 (
    echo Database might already exist, continuing...
)
echo.

REM Step 2: Run Schema
echo [2/5] Creating tables and schema...
%PSQL% -U %PGUSER% -d %DB_NAME% -f database\schema.sql
if %errorlevel% neq 0 (
    echo ERROR: Failed to create schema!
    pause
    exit /b 1
)
echo.

REM Step 3: Run Feed Cost Triggers
echo [3/5] Setting up feed cost triggers...
%PSQL% -U %PGUSER% -d %DB_NAME% -f database\feed_cost_auto_update.sql
if %errorlevel% neq 0 (
    echo ERROR: Failed to create feed cost triggers!
    pause
    exit /b 1
)
echo.

REM Step 4: Run All Triggers
echo [4/5] Setting up all triggers...
%PSQL% -U %PGUSER% -d %DB_NAME% -f database\triggers.sql
if %errorlevel% neq 0 (
    echo ERROR: Failed to create triggers!
    pause
    exit /b 1
)
echo.

REM Step 5: Run Business Logic
echo [5/5] Setting up business logic functions...
%PSQL% -U %PGUSER% -d %DB_NAME% -f database\business_logic.sql
if %errorlevel% neq 0 (
    echo ERROR: Failed to create business logic!
    pause
    exit /b 1
)
echo.

REM Optional: Run Seeds
if exist database\seeds.sql (
    echo [BONUS] Loading seed data...
    %PSQL% -U %PGUSER% -d %DB_NAME% -f database\seeds.sql
    echo.
)

echo ============================================
echo SUCCESS! Database setup completed!
echo ============================================
echo.
echo Next steps:
echo   1. cd backend
echo   2. npm install
echo   3. Create .env file with your database credentials
echo   4. npm run dev
echo.
pause
