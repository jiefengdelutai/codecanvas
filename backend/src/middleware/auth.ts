import { Request, Response, NextFunction } from 'express'
import { UserService } from '../services/userService'

// 扩展Request接口以包含用户信息
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number
        username: string
        email: string
        role: string
      }
    }
  }
}

/**
 * JWT认证中间件
 */
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: '访问被拒绝，未提供认证令牌',
      })
    }

    // 验证token
    const decoded = UserService.verifyToken(token)
    if (!decoded) {
      return res.status(403).json({
        success: false,
        message: '无效的认证令牌',
      })
    }

    // 获取用户信息
    const userResult = await UserService.getUserById(decoded.userId)
    if (!userResult.success) {
      return res.status(403).json({
        success: false,
        message: '用户不存在',
      })
    }

    // 将用户信息添加到请求对象
    if (userResult.data) {
      req.user = {
        id: userResult.data.id,
        username: userResult.data.username,
        email: userResult.data.email,
        role: userResult.data.role,
      }
    }

    next()
  } catch (error) {
    console.error('认证中间件错误:', error)
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    })
  }
}

/**
 * 角色权限检查中间件
 */
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '未认证的用户',
      })
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: '权限不足',
      })
    }

    next()
  }
}

/**
 * 管理员权限检查中间件
 */
export const requireAdmin = requireRole(['admin'])

/**
 * 高级用户权限检查中间件
 */
export const requirePremium = requireRole(['admin', 'premium'])

/**
 * 可选认证中间件（不强制要求登录）
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(' ')[1]

    if (token) {
      const decoded = UserService.verifyToken(token)
      if (decoded) {
        const userResult = await UserService.getUserById(decoded.userId)
        if (userResult.success && userResult.data) {
          req.user = {
            id: userResult.data.id,
            username: userResult.data.username,
            email: userResult.data.email,
            role: userResult.data.role,
          }
        }
      }
    }

    next()
  } catch (error) {
    // 可选认证失败时不阻止请求继续
    next()
  }
}
