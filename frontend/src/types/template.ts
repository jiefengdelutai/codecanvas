/**
 * 模板类型定义
 */

export interface Template {
  id: string
  name: string
  description?: string
  content: string
  thumbnail?: string
  category: string
  tags?: string
  downloads: number
  authorId: number
  authorName?: string
  sourceProjectId?: string
  isPublic: boolean
  createdAt: string
  updatedAt: string
}

/**
 * 创建模板参数
 */
export interface CreateTemplateData {
  name: string
  description?: string
  content: string
  category: string
  tags?: string
  thumbnail?: string
  sourceProjectId?: string
  isPublic?: boolean
  authorId?: number
  authorName?: string
}

/**
 * 模板列表查询参数
 */
export interface TemplateListParams {
  category?: string
  keyword?: string
  recommend?: 'on' | 'off'
  projectId?: string
}

/**
 * API响应类型
 */
export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  error?: string
}
