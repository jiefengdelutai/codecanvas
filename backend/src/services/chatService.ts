import { Op } from 'sequelize'
import ChatSession from '../models/ChatSession'
import ChatMessage from '../models/ChatMessage'

/**
 * 聊天服务类
 * 处理聊天会话和消息的业务逻辑
 */
export class ChatService {
  /**
   * 获取用户的所有聊天会话
   */
  static async getUserSessions(userId: number) {
    try {
      const sessions = await ChatSession.findAll({
        where: { userId },
        order: [['updatedAt', 'DESC']],
        include: [{
          model: ChatMessage,
          as: 'messages',
          limit: 1,
          order: [['createdAt', 'DESC']],
          required: false,
        }],
      })
      return sessions
    } catch (error) {
      console.error('获取用户会话失败:', error)
      throw new Error('获取聊天会话失败')
    }
  }

  /**
   * 创建新的聊天会话
   */
  static async createSession(userId: number, title: string = '新对话') {
    try {
      // 先将用户的其他会话设为非活跃
      await ChatSession.update(
        { isActive: false },
        { where: { userId } }
      )

      // 创建新会话并设为活跃
      const session = await ChatSession.create({
        userId,
        title,
        isActive: true,
      })
      return session
    } catch (error) {
      console.error('创建会话失败:', error)
      throw new Error('创建聊天会话失败')
    }
  }

  /**
   * 获取会话的所有消息
   */
  static async getSessionMessages(sessionId: number, userId: number) {
    try {
      // 验证会话是否属于该用户
      const session = await ChatSession.findOne({
        where: { id: sessionId, userId },
      })
      
      if (!session) {
        throw new Error('会话不存在或无权限访问')
      }

      const messages = await ChatMessage.findAll({
        where: { sessionId },
        order: [['createdAt', 'ASC']],
      })
      return messages
    } catch (error) {
      console.error('获取会话消息失败:', error)
      throw error
    }
  }

  /**
   * 发送消息到会话
   */
  static async sendMessage(sessionId: number, userId: number, type: 'user' | 'assistant', content: string) {
    try {
      // 验证会话是否属于该用户
      const session = await ChatSession.findOne({
        where: { id: sessionId, userId },
      })
      
      if (!session) {
        throw new Error('会话不存在或无权限访问')
      }

      // 创建消息
      const message = await ChatMessage.create({
        sessionId,
        type,
        content,
      })

      // 更新会话的最后更新时间
      await session.update({ updatedAt: new Date() })

      return message
    } catch (error) {
      console.error('发送消息失败:', error)
      throw error
    }
  }

  /**
   * 设置活跃会话
   */
  static async setActiveSession(sessionId: number, userId: number) {
    try {
      // 验证会话是否属于该用户
      const session = await ChatSession.findOne({
        where: { id: sessionId, userId },
      })
      
      if (!session) {
        throw new Error('会话不存在或无权限访问')
      }

      // 将用户的其他会话设为非活跃
      await ChatSession.update(
        { isActive: false },
        { where: { userId } }
      )

      // 设置当前会话为活跃
      await session.update({ isActive: true })

      return session
    } catch (error) {
      console.error('设置活跃会话失败:', error)
      throw error
    }
  }

  /**
   * 删除聊天会话
   */
  static async deleteSession(sessionId: number, userId: number) {
    try {
      // 验证会话是否属于该用户
      const session = await ChatSession.findOne({
        where: { id: sessionId, userId },
      })
      
      if (!session) {
        throw new Error('会话不存在或无权限访问')
      }

      // 删除会话（关联的消息会因为CASCADE自动删除）
      await session.destroy()

      return { success: true }
    } catch (error) {
      console.error('删除会话失败:', error)
      throw error
    }
  }

  /**
   * 获取用户的活跃会话
   */
  static async getActiveSession(userId: number) {
    try {
      const session = await ChatSession.findOne({
        where: { userId, isActive: true },
        include: [{
          model: ChatMessage,
          as: 'messages',
          order: [['createdAt', 'ASC']],
        }],
      })
      return session
    } catch (error) {
      console.error('获取活跃会话失败:', error)
      throw new Error('获取活跃会话失败')
    }
  }

  /**
   * 更新会话标题
   */
  static async updateSessionTitle(sessionId: number, userId: number, title: string) {
    try {
      // 验证会话是否属于该用户
      const session = await ChatSession.findOne({
        where: { id: sessionId, userId },
      })
      
      if (!session) {
        throw new Error('会话不存在或无权限访问')
      }

      await session.update({ title })
      return session
    } catch (error) {
      console.error('更新会话标题失败:', error)
      throw error
    }
  }

  /**
   * 获取或创建活跃会话
   * 如果用户没有活跃会话，则创建一个新的
   */
  static async getOrCreateActiveSession(userId: number) {
    try {
      let session = await this.getActiveSession(userId)
      
      if (!session) {
        session = await this.createSession(userId, '新对话')
      }
      
      return session
    } catch (error) {
      console.error('获取或创建活跃会话失败:', error)
      throw new Error('获取或创建活跃会话失败')
    }
  }
}
