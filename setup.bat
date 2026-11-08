@echo off
chcp 65001 >nul
echo ========================================
echo     CodeCanvas 环境配置脚本
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

echo [信息] 当前Node.js版本:
node --version
echo.

echo [信息] 当前npm版本:
npm --version
echo.

echo [信息] 开始安装项目依赖...
echo.

REM 安装根目录依赖
echo [1/3] 安装根目录依赖...
call npm install
if %errorlevel% neq 0 (
    echo [错误] 根目录依赖安装失败
    pause
    exit /b 1
)

REM 安装前端依赖
echo.
echo [2/3] 安装前端依赖...
cd frontend
call npm install
if %errorlevel% neq 0 (
    echo [错误] 前端依赖安装失败
    pause
    exit /b 1
)
cd ..

REM 安装后端依赖
echo.
echo [3/3] 安装后端依赖...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo [错误] 后端依赖安装失败
    pause
    exit /b 1
)
cd ..

REM 创建环境配置文件
echo.
echo [信息] 创建环境配置文件...
if not exist "backend\.env" (
    copy "backend\env.example" "backend\.env"
    echo [成功] 已创建 backend\.env 文件
    echo [提示] 请根据需要修改 backend\.env 中的配置
)

REM 创建上传目录
echo.
echo [信息] 创建必要的目录...
if not exist "backend\uploads" (
    mkdir "backend\uploads"
    echo [成功] 已创建 backend\uploads 目录
)

echo.
echo ========================================
echo          安装完成！
echo ========================================
echo.
echo 📌 下一步操作:
echo.
echo 1. 确保 MySQL 数据库已安装并运行
echo 2. 创建数据库: CREATE DATABASE codecanvas;
echo 3. 修改配置: 编辑 backend\.env 文件
echo 4. 启动项目: 双击 start.bat 或运行 npm run dev
echo.
echo 访问地址:
echo   前端: http://localhost:3000
echo   后端: http://localhost:5000
echo.
echo ========================================

pause

