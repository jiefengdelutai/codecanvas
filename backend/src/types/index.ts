/**
 * 后端类型定义
 */

// API 响应类型
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

// 用户类型
export interface User {
  id: string
  username: string
  email: string
  password: string
  createdAt: Date
  updatedAt: Date
}

// 项目类型
export interface Project {
  id: string
  userId: string
  name: string
  description?: string
  content: string
  thumbnail?: string
  createdAt: Date
  updatedAt: Date
}

// 模板类型
export interface Template {
  id: string
  name: string
  description?: string
  content: string
  thumbnail?: string
  category: string
  tags?: string
  downloads: number
  createdAt: Date
  updatedAt: Date
}

// 版本类型
export interface Version {
  id: string
  projectId: string
  version: string
  content: string
  description?: string
  createdAt: Date
}

// 部署类型
export interface Deploy {
  id: string
  projectId: string
  url: string
  status: 'pending' | 'success' | 'failed'
  errorMessage?: string
  createdAt: Date
  updatedAt: Date
}

// AI 请求类型
export interface AIImageToCodeRequest {
  image: Express.Multer.File
}

export interface AIChatRequest {
  message: string
  context?: string
}

export interface AIOptimizeRequest {
  code: string
}

