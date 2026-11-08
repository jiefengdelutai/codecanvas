import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../models/User'
import { sequelize } from '../config/database'
import { QueryTypes, Op } from 'sequelize'

export class UserService {
  static async checkUserTableExists(): Promise<boolean> {
    try {
      const results = await sequelize.query("SHOW TABLES LIKE 'users'", { type: QueryTypes.SELECT })
      return Array.isArray(results) && results.length > 0
    } catch {
      return false
    }
  }

  static async createUserTable(): Promise<boolean> {
    try {
      await User.sync({ alter: true })
      return true
    } catch {
      try {
        await User.sync({ force: false })
        return true
      } catch {
        return false
      }
    }
  }

  static async initializeUserTable(): Promise<void> {
    try {
      const tableExists = await this.checkUserTableExists()
      if (!tableExists) {
        const created = await this.createUserTable()
        if (created) await this.createInitialUsers()
      } else {
        await User.sync({ alter: true })

        // 强制修正头像字段类型为路径字符串
        try {
          await sequelize.query('ALTER TABLE `users` MODIFY COLUMN `avatar_url` VARCHAR(500) NULL')
          await sequelize.query('ALTER TABLE `users` MODIFY COLUMN `avatar_mime` VARCHAR(100) NULL')
          console.log('✅ 用户头像字段类型已修正为 VARCHAR(500)')
        } catch (alterError) {
          console.warn('⚠️  修正头像字段类型失败:', alterError)
        }

        const userCount = await User.count()
        if (userCount === 0) await this.createInitialUsers()
      }
    } catch (error) {
      console.error('❌ 用户表初始化失败:', error)
    }
  }

  static async createInitialUsers(): Promise<void> {
    try {
      const initialUsers = [
        { username: 'admin', email: 'admin@codecanvas.com', password: 'admin123', nickname: '系统管理员', role: 'admin' as const, email_verified: true, ai_quota_limit: 10000, project_limit: 100 },
        { username: 'testuser', email: 'test@codecanvas.com', password: 'test123', nickname: '测试用户', role: 'user' as const, email_verified: true },
        { username: 'premium', email: 'premium@codecanvas.com', password: 'premium123', nickname: '高级用户', role: 'premium' as const, email_verified: true, ai_quota_limit: 5000, project_limit: 50 },
      ]
      for (const userData of initialUsers) {
        const existingUser = await User.findOne({ where: { [Op.or]: [{ username: userData.username }, { email: userData.email }] } })
        if (existingUser) continue
        const hashedPassword = await bcrypt.hash(userData.password, 12)
        await User.create({ username: userData.username, email: userData.email, password_hash: hashedPassword, nickname: userData.nickname, role: userData.role, email_verified: userData.email_verified, ai_quota_limit: userData.ai_quota_limit || 1000, project_limit: userData.project_limit || 10 } as any)
      }
    } catch (error) {
      console.error('❌ 创建初始用户失败:', error)
    }
  }

  static async register(userData: { username: string; email: string; password: string; nickname?: string }) {
    try {
      const existingUsername = await User.findOne({ where: { username: userData.username } })
      if (existingUsername) throw new Error('用户名已存在')
      const existingEmail = await User.findOne({ where: { email: userData.email } })
      if (existingEmail) throw new Error('邮箱已被注册')
      const hashedPassword = await bcrypt.hash(userData.password, 12)
      const user = await User.create({ username: userData.username, email: userData.email, password_hash: hashedPassword, nickname: userData.nickname || userData.username } as any)
      const token = this.generateToken(user.id)
      return { success: true, message: '注册成功', data: { user: { id: user.id, username: user.username, email: user.email, nickname: user.nickname, role: user.role, status: user.status }, token } }
    } catch (error: any) {
      return { success: false, message: error.message || '注册失败' }
    }
  }

  static async login(loginData: { username: string; password: string; ip?: string }) {
    try {
      const user = await User.findOne({ where: { [Op.or]: [{ username: loginData.username }, { email: loginData.username }] } })
      if (!user) throw new Error('用户不存在')
      if (user.status !== 'active') throw new Error('账户已被禁用')
      const isPasswordValid = await bcrypt.compare(loginData.password, user.password_hash)
      if (!isPasswordValid) throw new Error('密码错误')
      await user.update({ last_login_at: new Date(), last_login_ip: loginData.ip, login_count: user.login_count + 1 })
      const token = this.generateToken(user.id)
      return { success: true, message: '登录成功', data: { user: { id: user.id, username: user.username, email: user.email, nickname: user.nickname, role: user.role, status: user.status, ai_quota_used: user.ai_quota_used, ai_quota_limit: user.ai_quota_limit, project_count: user.project_count, project_limit: user.project_limit, avatar_url: user.avatar_url ? `data:${user.avatar_mime || 'image/png'};base64,${Buffer.from(user.avatar_url).toString('base64')}` : undefined, avatar_mime: user.avatar_mime }, token } }
    } catch (error: any) {
      return { success: false, message: error.message || '登录失败' }
    }
  }

  static generateToken(userId: number): string {
    const secret = process.env.JWT_SECRET || 'codecanvas-secret-key'
    return jwt.sign({ userId }, secret, { expiresIn: '7d' })
  }

  static verifyToken(token: string): { userId: number } | null {
    try { return jwt.verify(token, process.env.JWT_SECRET || 'codecanvas-secret-key') as { userId: number } } catch { return null }
  }

  static async getUserById(userId: number) {
    try {
      const user = await User.findByPk(userId, { attributes: { exclude: ['password_hash'] } })
      if (!user) throw new Error('用户不存在')
      const plain = user.toJSON() as any
      return { success: true, data: plain }
    } catch (error: any) {
      return { success: false, message: error.message || '获取用户信息失败' }
    }
  }

  static async getAvatarByUserId(userId: number) {
    try {
      const user = await User.findByPk(userId, { attributes: ['avatar_url', 'avatar_mime'] }) as any
      if (!user || !user.avatar_url) throw new Error('头像不存在')
      return { success: true, data: { path: user.avatar_url as string, mime: user.avatar_mime || 'image/png' } }
    } catch (error: any) {
      return { success: false, message: error.message || '获取头像失败' }
    }
  }

  static async changePassword(userId: number, oldPassword: string, newPassword: string) {
    try {
      const user = await User.findByPk(userId)
      if (!user) throw new Error('用户不存在')
      const isPasswordValid = await bcrypt.compare(oldPassword, user.password_hash)
      if (!isPasswordValid) throw new Error('旧密码不正确')
      const hashedPassword = await bcrypt.hash(newPassword, 12)
      await user.update({ password_hash: hashedPassword })
      return { success: true, message: '密码修改成功' }
    } catch (error: any) {
      return { success: false, message: error.message || '修改密码失败' }
    }
  }

  static async updateUserProfile(userId: number, payload: { nickname?: string; email?: string; phone?: string; avatar_url?: string | null; avatar_mime?: string | null }) {
    try {
      const user = await User.findByPk(userId)
      if (!user) throw new Error('用户不存在')
      if (payload.email && payload.email !== user.email) {
        const existingEmail = await User.findOne({ where: { email: payload.email } })
        if (existingEmail) throw new Error('邮箱已被注册')
        user.email_verified = false
      }
      if (payload.phone !== undefined && payload.phone !== user.phone) user.phone_verified = false
      const updateData: Record<string, any> = {}
      if (payload.nickname !== undefined) updateData.nickname = payload.nickname
      if (payload.email !== undefined) updateData.email = payload.email
      if (payload.phone !== undefined) updateData.phone = payload.phone
      if (payload.avatar_url !== undefined) updateData.avatar_url = payload.avatar_url
      if (payload.avatar_mime !== undefined) updateData.avatar_mime = payload.avatar_mime
      await user.update(updateData)
      return { success: true, message: '资料更新成功', data: await this.getUserById(userId).then((result) => result.data) }
    } catch (error: any) {
      return { success: false, message: error.message || '更新用户资料失败' }
    }
  }
}

export default UserService
