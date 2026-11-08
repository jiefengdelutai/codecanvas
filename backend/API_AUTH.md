# 用户认证API文档

## 概述

本文档描述了CodeCanvas后端用户认证相关的API接口。

## 基础信息

- **基础URL**: `http://localhost:5000/api/auth`
- **认证方式**: JWT Bearer Token
- **数据格式**: JSON

## 接口列表

### 1. 用户注册

**接口**: `POST /api/auth/register`

**描述**: 注册新用户账号

**请求参数**:
```json
{
  "username": "string",     // 用户名，3-50字符，必填
  "email": "string",        // 邮箱地址，必填
  "password": "string",     // 密码，最少6位，必填
  "nickname": "string"      // 昵称，可选
}
```

**响应示例**:
```json
{
  "success": true,
  "message": "注册成功",
  "data": {
    "user": {
      "id": 1,
      "username": "testuser",
      "email": "test@example.com",
      "nickname": "测试用户",
      "role": "user",
      "status": "active"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 2. 用户登录

**接口**: `POST /api/auth/login`

**描述**: 用户登录（支持用户名或邮箱）

**请求参数**:
```json
{
  "username": "string",     // 用户名或邮箱，必填
  "password": "string"      // 密码，必填
}
```

**响应示例**:
```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "user": {
      "id": 1,
      "username": "testuser",
      "email": "test@example.com",
      "nickname": "测试用户",
      "role": "user",
      "status": "active",
      "ai_quota_used": 50,
      "ai_quota_limit": 1000,
      "project_count": 3,
      "project_limit": 10
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 3. 获取当前用户信息

**接口**: `GET /api/auth/me`

**描述**: 获取当前登录用户的详细信息

**请求头**:
```
Authorization: Bearer <token>
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "testuser",
    "email": "test@example.com",
    "nickname": "测试用户",
    "role": "user",
    "status": "active",
    "ai_quota_used": 50,
    "ai_quota_limit": 1000,
    "project_count": 3,
    "project_limit": 10,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### 4. 用户登出

**接口**: `POST /api/auth/logout`

**描述**: 用户登出（前端删除token即可）

**响应示例**:
```json
{
  "success": true,
  "message": "登出成功"
}
```

### 5. 检查用户名可用性

**接口**: `GET /api/auth/check-username/:username`

**描述**: 检查用户名是否已被使用

**响应示例**:
```json
{
  "success": true,
  "available": true,
  "message": "用户名可用"
}
```

### 6. 检查邮箱可用性

**接口**: `GET /api/auth/check-email/:email`

**描述**: 检查邮箱是否已被注册

**响应示例**:
```json
{
  "success": true,
  "available": true,
  "message": "邮箱可用"
}
```

## 错误响应

所有接口在出错时都会返回以下格式的错误响应：

```json
{
  "success": false,
  "message": "错误描述信息"
}
```

常见错误状态码：
- `400`: 请求参数错误
- `401`: 未认证或认证失败
- `403`: 权限不足
- `404`: 资源不存在
- `500`: 服务器内部错误

## 初始用户账号

系统会自动创建以下初始用户账号：

1. **管理员账号**
   - 用户名: `admin`
   - 邮箱: `admin@codecanvas.com`
   - 密码: `admin123`
   - 角色: `admin`

2. **测试用户**
   - 用户名: `testuser`
   - 邮箱: `test@codecanvas.com`
   - 密码: `test123`
   - 角色: `user`

3. **高级用户**
   - 用户名: `premium`
   - 邮箱: `premium@codecanvas.com`
   - 密码: `premium123`
   - 角色: `premium`

## 认证中间件

项目提供了以下认证中间件：

1. **authenticateToken**: 强制要求JWT认证
2. **optionalAuth**: 可选JWT认证
3. **requireRole**: 要求特定角色权限
4. **requireAdmin**: 要求管理员权限
5. **requirePremium**: 要求高级用户权限

使用示例：
```typescript
import { authenticateToken, requireAdmin } from '../middleware/auth'

// 需要登录的接口
router.get('/protected', authenticateToken, (req, res) => {
  // req.user 包含用户信息
})

// 需要管理员权限的接口
router.get('/admin-only', authenticateToken, requireAdmin, (req, res) => {
  // 只有管理员可以访问
})
```

## 数据库表结构

用户表会在首次启动时自动创建，包含以下主要字段：

- `id`: 用户ID（主键）
- `username`: 用户名（唯一）
- `email`: 邮箱（唯一）
- `password_hash`: 密码哈希
- `nickname`: 昵称
- `role`: 用户角色（admin/user/premium）
- `status`: 账户状态（active/inactive/banned）
- `ai_quota_*`: AI调用配额管理
- `project_*`: 项目数量管理
- `created_at/updated_at`: 时间戳

## 安全说明

1. 密码使用bcrypt加密存储
2. JWT token有效期为7天
3. 支持软删除（paranoid模式）
4. 包含登录IP和时间记录
5. 支持角色权限控制
