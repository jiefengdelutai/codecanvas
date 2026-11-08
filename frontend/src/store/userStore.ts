import { makeAutoObservable, runInAction } from 'mobx'
import { authApi, type User, type LoginRequest, type RegisterRequest, type ProfileUpdateRequest, type ChangePasswordRequest } from '@/services/api'
import { message } from 'antd'

class UserStore {
  user: User | null = null
  token: string | null = null
  isLoading = false
  isLoggedIn = false

  constructor() {
    makeAutoObservable(this)
    this.initializeAuth()
  }

  /**
   * 初始化认证状态
   */
  initializeAuth() {
    const token = localStorage.getItem('token')
    if (token) {
      runInAction(() => {
        this.token = token
        this.isLoggedIn = true
      })
    }
  }

  /**
   * 验证token有效性
   */
  async validateToken() {
    try {
      const response = await authApi.getCurrentUser()
      if (response.success && response.data) {
        const updatedUser = response.data
        runInAction(() => {
          this.user = updatedUser
        })
        localStorage.setItem('user', JSON.stringify(updatedUser))
      }
    } catch (error) {
      console.error('Token验证失败:', error)
      this.clearAuth()
    }
  }

  /**
   * 用户登录
   */
  async login(loginData: LoginRequest): Promise<boolean> {
    this.isLoading = true
    try {
      const response = await authApi.login(loginData)
      
      if (response.success && response.data) {
        this.token = response.data.token
        this.user = response.data.user
        this.isLoggedIn = true
        
        // 保存到localStorage
        localStorage.setItem('token', response.data.token)
        localStorage.setItem('user', JSON.stringify(response.data.user))
        
        message.success(response.message || '登录成功')
        return true
      } else {
        message.error(response.message || '登录失败')
        return false
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || '登录失败，请检查网络连接'
      message.error(errorMessage)
      return false
    } finally {
      this.isLoading = false
    }
  }

  /**
   * 用户注册
   */
  async register(registerData: RegisterRequest): Promise<boolean> {
    this.isLoading = true
    try {
      const response = await authApi.register(registerData)
      
      if (response.success && response.data) {
        this.token = response.data.token
        this.user = response.data.user
        this.isLoggedIn = true
        
        // 保存到localStorage
        localStorage.setItem('token', response.data.token)
        localStorage.setItem('user', JSON.stringify(response.data.user))
        
        message.success(response.message || '注册成功')
        return true
      } else {
        message.error(response.message || '注册失败')
        return false
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || '注册失败，请检查网络连接'
      message.error(errorMessage)
      return false
    } finally {
      this.isLoading = false
    }
  }

  /**
   * 用户登出
   */
  async logout() {
    try {
      await authApi.logout()
    } catch (error) {
      console.error('登出请求失败:', error)
    } finally {
      this.clearAuth()
      message.success('已退出登录')
    }
  }

  /**
   * 更新用户资料
   */
  async updateProfile(profile: ProfileUpdateRequest): Promise<boolean> {
    if (!this.user) return false

    try {
      const response = profile.avatarFile
        ? await authApi.uploadAvatar(profile.avatarFile)
        : await authApi.updateProfile(profile)
      if (response.success && response.data) {
        const updatedUser = response.data
        runInAction(() => {
          this.user = updatedUser
        })
        localStorage.setItem('user', JSON.stringify(updatedUser))
        return true
      }

      message.error(response.message || '更新失败')
      return false
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || '更新失败，请检查网络连接'
      message.error(errorMessage)
      return false
    }
  }

  async changePassword(data: ChangePasswordRequest): Promise<boolean> {
    try {
      const response = await authApi.changePassword(data)
      if (response.success) {
        message.success(response.message || '密码修改成功')
        return true
      }
      message.error(response.message || '修改密码失败')
      return false
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || '修改密码失败，请检查网络连接'
      message.error(errorMessage)
      return false
    }
  }

  /**
   * 清除认证信息
   */
  clearAuth() {
    this.user = null
    this.token = null
    this.isLoggedIn = false
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  /**
   * 检查用户名是否可用
   */
  async checkUsername(username: string): Promise<boolean> {
    try {
      const response = await authApi.checkUsername(username)
      return response.available
    } catch (error) {
      console.error('检查用户名失败:', error)
      return false
    }
  }

  /**
   * 检查邮箱是否可用
   */
  async checkEmail(email: string): Promise<boolean> {
    try {
      const response = await authApi.checkEmail(email)
      return response.available
    } catch (error) {
      console.error('检查邮箱失败:', error)
      return false
    }
  }

  /**
   * 获取用户角色
   */
  get userRole() {
    return this.user?.role || 'user'
  }

  /**
   * 检查是否为管理员
   */
  get isAdmin() {
    return this.user?.role === 'admin'
  }

  /**
   * 检查是否为高级用户
   */
  get isPremium() {
    return this.user?.role === 'premium' || this.user?.role === 'admin'
  }

  /**
   * 获取AI配额使用情况
   */
  get aiQuotaUsage() {
    if (!this.user) return { used: 0, limit: 0, percentage: 0 }
    
    const used = this.user.ai_quota_used
    const limit = this.user.ai_quota_limit
    const percentage = limit > 0 ? (used / limit) * 100 : 0
    
    return { used, limit, percentage }
  }

  /**
   * 获取项目数量使用情况
   */
  get projectUsage() {
    if (!this.user) return { count: 0, limit: 0, percentage: 0 }
    
    const count = this.user.project_count
    const limit = this.user.project_limit
    const percentage = limit > 0 ? (count / limit) * 100 : 0
    
    return { count, limit, percentage }
  }
}

export const userStore = new UserStore()
export default userStore
