@echo off
REM Start both backend and frontend for the HRMS demo.
echo Starting HRMS backend (port 5000)...
start "HRMS-Backend" cmd /k "cd /d %~dp0backend && npm run dev"
echo Starting HRMS frontend (port 5173)...
start "HRMS-Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"
echo.
echo Open http://localhost:5173 in your browser.
echo Demo accounts (password Welcome@123):
echo   HR Admin    hr@nexuscorp.example
echo   Manager     manager@nexuscorp.example
echo   Employee    employee@nexuscorp.example
