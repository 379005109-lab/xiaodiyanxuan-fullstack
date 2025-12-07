@echo off
chcp 65001 >nul

echo ============================================
echo  正在下载最新代码（带缓存破解）...
echo ============================================

:: 设置路径
set DOWNLOAD_PATH=%TEMP%\miniapp_update_%RANDOM%.zip
set EXTRACT_PATH=%TEMP%\miniapp_extract_%RANDOM%
set TARGET_PATH=D:\xiaodiyanxuan-fullstack\miniapp

:: 生成时间戳用于缓存破解
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "TIMESTAMP=%dt:~0,14%"

echo 时间戳: %TIMESTAMP%
echo 下载路径: %DOWNLOAD_PATH%

:: 下载 ZIP（使用 PowerShell，添加缓存破解）
echo 正在从 GitHub 下载...
powershell -Command "& {[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; $headers = @{'Cache-Control'='no-cache'; 'Pragma'='no-cache'}; Invoke-WebRequest -Uri 'https://codeload.github.com/379005109-lab/xiaodiyanxuan-fullstack/zip/refs/heads/main?t=%TIMESTAMP%' -OutFile '%DOWNLOAD_PATH%' -Headers $headers}"

if not exist "%DOWNLOAD_PATH%" (
    echo 下载失败！请检查网络
    goto END
)

:: 检查文件大小
for %%A in ("%DOWNLOAD_PATH%") do set filesize=%%~zA
echo 下载文件大小: %filesize% 字节

if %filesize% LSS 10000 (
    echo 文件太小，可能下载失败！
    goto END
)

echo 正在解压...

:: 删除旧的解压目录
if exist "%EXTRACT_PATH%" rmdir /s /q "%EXTRACT_PATH%"

:: 解压
powershell -Command "Expand-Archive -Path '%DOWNLOAD_PATH%' -DestinationPath '%EXTRACT_PATH%' -Force"

:: 复制 miniapp 文件夹
if exist "%EXTRACT_PATH%\xiaodiyanxuan-fullstack-main\miniapp" (
    echo 正在复制文件...
    xcopy /s /e /y "%EXTRACT_PATH%\xiaodiyanxuan-fullstack-main\miniapp\*" "%TARGET_PATH%\"
    echo ============================================
    echo  更新完成！请在微信开发者工具点击"编译"
    echo ============================================
) else (
    echo 解压失败！找不到 miniapp 文件夹
    echo 解压目录内容:
    dir "%EXTRACT_PATH%"
)

:: 清理临时文件
del /f /q "%DOWNLOAD_PATH%" 2>nul
rmdir /s /q "%EXTRACT_PATH%" 2>nul

:END
echo.
echo 按任意键关闭...
pause >nul
