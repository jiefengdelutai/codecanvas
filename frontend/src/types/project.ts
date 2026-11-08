/**
 * 项目类型定义
 */

export interface Project {
  // 基础信息
  id: string
  name: string
  description?: string
  thumbnail?: string
  
  // 内容
  content: string  // JSON格式: {html, css, js}
  
  // 元数据
  userId: number
  status: 'draft' | 'published' | 'archived'
  tags: string  // 逗号分隔的标签字符串
  
  // 统计信息
  createdAt: string
  updatedAt: string
  viewCount: number
  size: number  // 字节
  
  // 用户偏好
  isFavorite: boolean
  lastAccessedAt?: string
  
  // 模板和部署
  isPublishedAsTemplate: boolean
  templateId?: string
  deployUrl?: string
  deployStatus?: 'deploying' | 'deployed' | 'failed'
  
  // 版本控制
  currentVersion: number
}

/**
 * 项目列表查询参数
 */
export interface ProjectListParams {
  keyword?: string
  sortBy?: 'updatedAt' | 'createdAt' | 'name' | 'viewCount'
  sortOrder?: 'ASC' | 'DESC'
  status?: 'draft' | 'published' | 'archived'
  page?: number
  pageSize?: number
}

/**
 * 创建项目参数
 */
export interface CreateProjectData {
  name: string
  description?: string
  content?: string
  tags?: string
  status?: 'draft' | 'published' | 'archived'
}

/**
 * 更新项目参数
 */
export interface UpdateProjectData {
  name?: string
  description?: string
  content?: string
  thumbnail?: string
  tags?: string
  status?: 'draft' | 'published' | 'archived'
  isFavorite?: boolean
  isPublishedAsTemplate?: boolean
  templateId?: string
  deployUrl?: string
  deployStatus?: 'deploying' | 'deployed' | 'failed'
  currentVersion?: number
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
