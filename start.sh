#!/bin/bash

echo "========================================"
echo "    CodeCanvas 启动脚本"
echo "========================================"
echo ""

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "[错误] 未检测到Node.js，请先安装Node.js"
    echo "下载地址: https://nodejs.org/"
    exit 1
fi

# 检查npm是否可用
if ! command -v npm &> /dev/null; then
    echo "[错误] npm不可用，请检查Node.js安装"
    exit 1
fi

echo "[信息] Node.js环境检查通过"
echo ""

# 检查依赖是否安装
if [ ! -d "node_modules" ]; then
    echo "[警告] 根目录依赖未安装"
    echo "[信息] 正在安装根目录依赖..."
    npm install
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "[警告] 前端依赖未安装"
    echo "[信息] 正在安装前端依赖..."
    cd frontend
    npm install
    cd ..
fi

if [ ! -d "backend/node_modules" ]; then
    echo "[警告] 后端依赖未安装"
    echo "[信息] 正在安装后端依赖..."
    cd backend
    npm install
    cd ..
fi

# 检查环境配置文件
if [ ! -f "backend/.env" ]; then
    echo "[警告] 未找到环境配置文件"
    echo "[信息] 正在创建默认配置文件..."
    cp "backend/env.example" "backend/.env"
    echo "[提示] 请修改 backend/.env 文件中的数据库配置"
    echo ""
    read -p "按Enter键继续..."
fi

echo ""
echo "[信息] 依赖检查完成"
echo "[信息] 正在启动前后端服务..."
echo ""
echo "========================================"
echo " 🚀 CodeCanvas 正在启动..."
echo "========================================"
echo " 📍 前端服务: http://localhost:3000"
echo " 📍 后端服务: http://localhost:5000"
echo " 🛑 按 Ctrl+C 停止服务"
echo "========================================"
echo ""

# 启动服务
npm run dev

