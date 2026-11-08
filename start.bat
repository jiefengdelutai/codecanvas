@echo off
chcp 65001 >nul
echo ========================================
echo     CodeCanvas 启动脚本
echo ========================================
echo.

REM 检查Node.js是否安装
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到Node.js，请先安装Node.js
    echo 下载地址: https://nodejs.org/
    pause
    exit /b 1
)

REM 检查npm是否可用
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] npm不可用，请检查Node.js安装
    pause
    exit /b 1
)

echo [信息] Node.js环境检查通过
echo.

REM 检查依赖是否安装
if not exist "node_modules" (
    echo [警告] 根目录依赖未安装
    echo [信息] 正在安装根目录依赖...
    call npm install
)

if not exist "frontend\node_modules" (
    echo [警告] 前端依赖未安装
    echo [信息] 正在安装前端依赖...
    cd frontend
    call npm install
    cd ..
)

if not exist "backend\node_modules" (
    echo [警告] 后端依赖未安装
    echo [信息] 正在安装后端依赖...
    cd backend
    call npm install
    cd ..
)

REM 检查环境配置文件
if not exist "backend\.env" (
    echo [警告] 未找到环境配置文件
    echo [信息] 正在创建默认配置文件...
    copy "backend\env.example" "backend\.env"
    echo [提示] 请修改 backend\.env 文件中的数据库配置
    echo.
    pause
)

echo.
echo [信息] 依赖检查完成
echo [信息] 正在启动前后端服务...
echo.
echo ========================================
echo  🚀 CodeCanvas 正在启动...
echo ========================================
echo  📍 前端服务: http://localhost:3000
echo  📍 后端服务: http://localhost:5000
echo  🛑 按 Ctrl+C 停止服务
echo ========================================
echo.

REM 启动服务
call npm run dev

pause

