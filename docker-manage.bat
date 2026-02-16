@echo off
REM Car Repair System - Docker Management Script for Windows
REM Run from the project root directory

setlocal enabledelayedexpansion

if "%1"=="" (
    echo.
    echo === Car Repair System Docker Manager (Windows) ===
    echo.
    echo Usage: docker-manage.bat {command}
    echo.
    echo Commands:
    echo   start      - Start all services
    echo   stop       - Stop all services
    echo   restart    - Restart all services
    echo   logs       - Show live logs from all services
    echo   clean      - Stop and remove containers
    echo   backup     - Backup PostgreSQL database
    echo   restore    - Restore from backup
    echo   status     - Show status of all services
    echo   build      - Rebuild all containers
    echo   init-dev   - Locally install node_modules using Docker (fixes lint errors)
    echo.
    exit /b 0
)

if "%1"=="init-dev" (
    echo.
    echo [1/2] Installing Backend dependencies...
    docker run --rm -v "%cd%\backend:/app" -w /app node:18-alpine npm install
    
    echo.
    echo [2/2] Installing Frontend dependencies...
    docker run --rm -v "%cd%\Frontend:/app" -w /app node:18-alpine npm install
    
    echo.
    echo [OK] Done! Your IDE should now recognize the node_modules.
    exit /b 0
)

if "%1"=="start" (
    echo Starting all services...
    docker-compose up -d
    echo.
    echo [OK] Services started!
    echo.
    echo Access at:
    echo   Frontend: http://localhost
    echo   Backend:  http://localhost:3000
    echo   pgAdmin:  http://localhost:5050
    exit /b 0
)

if "%1"=="stop" (
    echo Stopping all services...
    docker-compose down
    echo [OK] Services stopped!
    exit /b 0
)

if "%1"=="restart" (
    echo Restarting all services...
    docker-compose down
    docker-compose up -d
    echo [OK] Services restarted!
    exit /b 0
)

if "%1"=="logs" (
    echo Showing live logs (Ctrl+C to exit)...
    docker-compose logs -f
    exit /b 0
)

if "%1"=="status" (
    echo.
    echo Service Status:
    docker-compose ps
    exit /b 0
)

if "%1"=="build" (
    echo Building containers (this may take a few minutes)...
    docker-compose build --no-cache
    echo [OK] Build complete!
    exit /b 0
)

if "%1"=="clean" (
    setlocal
    set /p confirm="WARNING: Remove all containers? (y/n): "
    if /i "%confirm%"=="y" (
        docker-compose down
        echo [OK] Cleaned up!
    )
    exit /b 0
)

if "%1"=="backup" (
    for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (set mydate=%%c%%a%%b)
    for /f "tokens=1-2 delims=/:" %%a in ('time /t') do (set mytime=%%a%%b)
    set BACKUP_FILE=car_repair_backup_!mydate!_!mytime!.sql
    echo Creating database backup: !BACKUP_FILE!
    docker-compose exec postgres pg_dump -U postgres car_repair > !BACKUP_FILE!
    echo [OK] Backup created: !BACKUP_FILE!
    exit /b 0
)

if "%1"=="restore" (
    if "%2"=="" (
        echo Please provide backup file: docker-manage.bat restore ^<backup_file^>
        exit /b 1
    )
    if not exist "%2" (
        echo Backup file not found: %2
        exit /b 1
    )
    setlocal
    set /p confirm="WARNING: Overwrite current database? (y/n): "
    if /i "!confirm!"=="y" (
        echo Restoring database from: %2
        docker-compose exec -T postgres psql -U postgres car_repair < %2
        echo [OK] Database restored!
    )
    exit /b 0
)

echo Unknown command: %1
echo Use: docker-manage.bat {start^|stop^|restart^|logs^|status^|build^|clean^|backup^|restore}
exit /b 1
