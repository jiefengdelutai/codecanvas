/**
 * 项目相关类型定义
 */
export interface Project {
  id: string
  name: string
  description?: string
  content: string
  thumbnail?: string
  createdAt: string
  updatedAt: string
}

/**
 * 模板相关类型定义
 */
export interface Template {
  id: string
  name: string
  description?: string
  content: string
  thumbnail?: string
  category: string
  tags?: string[]
  downloads: number
  createdAt: string
}

/**
 * 版本相关类型定义
 */
export interface Version {
  id: string
  projectId: string
  version: string
  content: string
  description?: string
  createdAt: string
}

/**
 * 部署相关类型定义
 */
export interface Deploy {
  id: string
  projectId: string
  url: string
  status: 'pending' | 'success' | 'failed'
  createdAt: string
}

/**
 * AI 对话消息类型
 */
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

/**
 * 编辑器模式
 */
export type EditorMode = 'visual' | 'code'

/**
 * 选中的元素
 */
export interface SelectedElement {
  id: string
  type: string
  props: Record<string, any>
}

