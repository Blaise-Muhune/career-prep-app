@echo off
echo Killing Node processes...
taskkill /F /IM node.exe
timeout /t 2

echo Cleaning Prisma...
rd /s /q "./node_modules/.prisma" 2>nul
rd /s /q "./node_modules/@prisma" 2>nul

@REM echo Installing dependencies...
@REM npm install

@REM echo Generating Prisma client...
@REM npx prisma generate

@REM echo Applying migrations...
@REM npx prisma migrate dev

echo Done!
pause 