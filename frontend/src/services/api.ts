import axios from 'axios'
import type { Project, Template, Version, Deploy } from '@/types'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
})

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 添加 token 认证信息
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    // 409版本冲突是预期的业务错误,不打印到控制台
    // 其他错误才打印日志便于调试
    if (error.response?.status !== 409) {
      console.error('API Error:', error)
    }
    
    // 如果是401错误，清除token并跳转到登录页
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// 用户认证相关类型定义
export interface LoginRequest {
  username: string
  password: string
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
  nickname?: string
}

export interface User {
  id: number
  username: string
  email: string
  nickname?: string
  avatar_url?: string
  avatar_mime?: string
  phone?: string
  role: 'admin' | 'user' | 'premium'
  status: 'active' | 'inactive' | 'banned'
  email_verified: boolean
  phone_verified: boolean
  ai_quota_used: number
  ai_quota_limit: number
  storage_used: number
  storage_limit: number
  project_count: number
  project_limit: number
  last_login_at?: string
  last_login_ip?: string
  login_count: number
  preferences?: any
  created_at: string
  updated_at: string
  deleted_at?: string
}

export interface AuthResponse {
  success: boolean
  message: string
  data?: {
    user: User
    token: string
  }
}

export interface ProfileUpdateRequest {
  avatarFile?: File
  nickname?: string
  email?: string
  phone?: string
}

export interface ChangePasswordRequest {
  oldPassword: string
  newPassword: string
}

/**
 * 用户认证 API
 */
export const authApi = {
  // 用户登录
  login: (data: LoginRequest): Promise<AuthResponse> => {
    return api.post('/auth/login', data)
  },
  
  // 用户注册
  register: (data: RegisterRequest): Promise<AuthResponse> => {
    return api.post('/auth/register', data)
  },
  
  // 获取当前用户信息
  getCurrentUser: (): Promise<{ success: boolean; data: User }> => {
    return api.get('/auth/me')
  },
  
  // 更新用户资料
  updateProfile: (data: ProfileUpdateRequest): Promise<{ success: boolean; message: string; data?: User }> => {
    return api.put('/auth/profile', data)
  },

  // 上传头像
  uploadAvatar: (file: File): Promise<{ success: boolean; message: string; data?: User }> => {
    const formData = new FormData()
    formData.append('avatar', file)
    return api.post('/auth/avatar', formData)
  },

  // 修改密码
  changePassword: (data: ChangePasswordRequest): Promise<{ success: boolean; message: string }> => {
    return api.post('/auth/change-password', data)
  },

  // 用户登出
  logout: (): Promise<{ success: boolean; message: string }> => {
    return api.post('/auth/logout')
  },
  
  // 检查用户名是否可用
  checkUsername: (username: string): Promise<{ success: boolean; available: boolean; message: string }> => {
    return api.get(`/auth/check-username/${username}`)
  },
  
  // 检查邮箱是否可用
  checkEmail: (email: string): Promise<{ success: boolean; available: boolean; message: string }> => {
    return api.get(`/auth/check-email/${email}`)
  },
}

/**
 * 项目管理 API
 */
export const projectApi = {
  // 获取项目列表
  getProjects: () => api.get<Project[]>('/projects'),
  
  // 获取项目详情
  getProject: (id: string) => api.get<Project>(`/projects/${id}`),
  
  // 创建项目
  createProject: (data: Partial<Project>) => api.post<Project>('/projects', data),
  
  // 更新项目
  updateProject: (id: string, data: Partial<Project>) => api.put<Project>(`/projects/${id}`, data),
  
  // 删除项目
  deleteProject: (id: string) => api.delete(`/projects/${id}`),
}

/**
 * AI 功能 API
 */
export const aiApi = {
  // AI 图生码
  imageToCode: (imageFile: File) => {
    const formData = new FormData()
    formData.append('image', imageFile)
    return api.post<{ code: string }>('/ai/image-to-code', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  
  // AI 对话（支持RAG开关与项目上下文）
  chat: (
    message: string,
    options?: {
      context?: string
      rag?: 'on' | 'off'
      intent?: 'modify' | 'query' | 'ask' | 'other'
      projectId?: string
      sessionId?: number
    }
  ) => {
    return api.post<{ reply: string; citations?: Array<{ sourceType: string; sourceId: string; score: number; snippet: string }> }>('/ai/chat', {
      message,
      context: options?.context,
      rag: options?.rag,
      intent: options?.intent,
      projectId: options?.projectId,
      sessionId: options?.sessionId,
    })
  },
  
  // 获取项目上下文（仅项目代码）
  getProjectContext: (projectId: string) => {
    return api.post<{ projectCode: string }>('/ai/project-context', { projectId })
  },
  
  // 代码优化建议
  optimize: (code: string) => {
    return api.post<{ suggestions: string[] }>('/ai/optimize', { code })
  },
}

/**
 * 模板市场 API
 */
export const templateApi = {
  // 获取模板列表
  getTemplates: (params?: { category?: string; keyword?: string }) => {
    return api.get<Template[]>('/templates', { params })
  },
  
  // 获取模板详情
  getTemplate: (id: string) => api.get<Template>(`/templates/${id}`),
  
  // 创建模板
  createTemplate: (data: Partial<Template>) => api.post<Template>('/templates', data),
}

/**
 * 版本控制 API
 */
export const versionApi = {
  // 获取项目版本列表
  getVersions: (projectId: string) => api.get<Version[]>(`/versions/${projectId}`),
  
  // 创建版本
  createVersion: (projectId: string, data: Partial<Version>) => {
    return api.post<Version>(`/versions/${projectId}`, data)
  },
  
  // 回滚版本
  rollback: (projectId: string, versionId: string) => {
    return api.post(`/versions/${projectId}/rollback`, { versionId })
  },
  
  // 对比版本差异
  diff: (v1: string, v2: string) => {
    return api.get<{ diff: string }>(`/versions/diff/${v1}/${v2}`)
  },
}

/**
 * 部署 API
 */
export const deployApi = {
  // 一键发布
  deploy: (projectId: string) => api.post<Deploy>('/deploy', { projectId }),
  
  // 获取部署状态
  getDeployStatus: (id: string) => api.get<Deploy>(`/deploy/${id}`),
  
  // 获取部署历史
  getDeployHistory: (projectId: string) => api.get<Deploy[]>(`/deploy/list/${projectId}`),
}

export default api

