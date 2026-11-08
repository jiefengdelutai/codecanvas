import { message } from 'antd'
import api from './api'

// 聊天会话接口
export interface ChatSession {
  id: number
  userId: number
  title: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  messages?: ChatMessage[]
}

// 聊天消息接口
export interface ChatMessage {
  id: number
  sessionId: number
  type: 'user' | 'assistant'
  content: string
  createdAt: string
  updatedAt: string
}

/**
 * 聊天服务类
 * 处理前端与后端聊天API的交互
 */
export class ChatService {
  /**
   * 获取用户的所有聊天会话
   */
  static async getUserSessions(): Promise<ChatSession[]> {
    try {
      const response: any = await api.get('/chat/sessions')
      return response.sessions
    } catch (error: any) {
      console.error('获取会话列表失败:', error)
      message.error('获取会话列表失败')
      throw error
    }
  }

  /**
   * 创建新的聊天会话
   */
  static async createSession(title: string = '新对话'): Promise<ChatSession> {
    try {
      const response: any = await api.post('/chat/sessions', { title })
      message.success('创建新对话成功')
      return response.session
    } catch (error: any) {
      console.error('创建会话失败:', error)
      message.error('创建会话失败')
      throw error
    }
  }

  /**
   * 获取会话的所有消息
   */
  static async getSessionMessages(sessionId: number): Promise<ChatMessage[]> {
    try {
      const response: any = await api.get(`/chat/sessions/${sessionId}/messages`)
      return response.messages
    } catch (error: any) {
      console.error('获取会话消息失败:', error)
      message.error('获取会话消息失败')
      throw error
    }
  }

  /**
   * 发送消息到会话
   */
  static async sendMessage(sessionId: number, type: 'user' | 'assistant', content: string): Promise<ChatMessage> {
    try {
      const response: any = await api.post(`/chat/sessions/${sessionId}/messages`, {
        type,
        content
      })
      return response.message
    } catch (error: any) {
      console.error('发送消息失败:', error)
      message.error('发送消息失败')
      throw error
    }
  }

  /**
   * 设置活跃会话
   */
  static async setActiveSession(sessionId: number): Promise<ChatSession> {
    try {
      const response: any = await api.put(`/chat/sessions/${sessionId}/active`)
      return response.session
    } catch (error: any) {
      console.error('设置活跃会话失败:', error)
      message.error('设置活跃会话失败')
      throw error
    }
  }

  /**
   * 删除聊天会话
   */
  static async deleteSession(sessionId: number): Promise<void> {
    try {
      await api.delete(`/chat/sessions/${sessionId}`)
      message.success('删除对话成功')
    } catch (error: any) {
      console.error('删除会话失败:', error)
      message.error('删除会话失败')
      throw error
    }
  }

  /**
   * 获取活跃会话
   */
  static async getActiveSession(): Promise<ChatSession> {
    try {
      const response: any = await api.get('/chat/active-session')
      console.log('API响应数据:', response) // 调试日志
      
      // 注意：api.js的响应拦截器已经返回了response.data，所以这里response就是数据本身
      if (!response || !response.session) {
        throw new Error('API返回数据格式错误')
      }
      
      return response.session
    } catch (error: any) {
      console.error('获取活跃会话失败:', error)
      console.error('错误详情:', error.response?.data) // 添加更详细的错误信息
      message.error('获取活跃会话失败')
      throw error
    }
  }

  /**
   * 更新会话标题
   */
  static async updateSessionTitle(sessionId: number, title: string): Promise<ChatSession> {
    try {
      const response: any = await api.put(`/chat/sessions/${sessionId}/title`, { title })
      message.success('更新对话标题成功')
      return response.session
    } catch (error: any) {
      console.error('更新会话标题失败:', error)
      message.error('更新会话标题失败')
      throw error
    }
  }

  /**
   * 发送用户消息并获取AI回复
   * 这是一个便捷方法，结合了发送用户消息和AI回复的逻辑
   */
  static async sendUserMessageAndGetAIReply(
    sessionId: number, 
    userMessage: string,
    aiService: (message: string) => Promise<string>
  ): Promise<{ userMsg: ChatMessage; aiMsg: ChatMessage }> {
    try {
      // 发送用户消息
      const userMsg = await this.sendMessage(sessionId, 'user', userMessage)
      
      // 调用AI服务获取回复
      const aiReply = await aiService(userMessage)
      
      // 发送AI回复消息
      const aiMsg = await this.sendMessage(sessionId, 'assistant', aiReply)
      
      return { userMsg, aiMsg }
    } catch (error: any) {
      console.error('发送消息并获取AI回复失败:', error)
      throw error
    }
  }
}
