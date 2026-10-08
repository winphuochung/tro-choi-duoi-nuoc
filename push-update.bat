@echo off
REM ============================================================
REM  1-CLICK PUSH: git add + commit + push (Windows)
REM  Dung trong thu muc du-an (duoi-nuoc). Chay file nay
REM  de dong bo nhanh toan bo thay doi len GitHub.
REM ============================================================
setlocal
chcp 65001 >nul

REM Duyen len tim repo neu bat dau tu thu muc con
git rev-parse --show-toplevel >nul 2>&1
if errorlevel 1 (
    echo [Luu y] Thu muc hien tai chua phai git repo. Dang dong ho...
    git init
    git remote add origin https://github.com/winphuochung/tro-choi-duoi-nuoc.git
    git branch -M main
)

echo [1/3] git pull --rebase (gioi thieu thay doi tu GitHub)...
git pull --rebase
if errorlevel 1 (
    echo [Loi] Khep thong merge. Xem thong bao tren va giai quyet tay.
    echo        Neu co conflict: sua file, run 'git add .' roi 'git rebase --continue'.
    pause
    exit /b 1
)

echo [2/3] git add + commit...
git add -A
git commit -m "update %date% %time%"
if errorlevel 1 (
    echo [OK] Khong co gi de commit (da dong bo).
    goto :push
)

:push
echo [3/3] git push...
git push
if errorlevel 1 (
    echo [Loi] Push that bai. Kiem tra phong va (token) cua GitHub.
    pause
    exit /b 1
)

echo.
echo ===== DONE. Ma nguon da gui len GitHub =====
echo Chi tiet: git log --oneline -3
git log --oneline -3
echo.
pause
