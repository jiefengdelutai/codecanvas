import express from 'express'
import { ChatService } from '../services/chatService'
import { authenticateToken } from '../middleware/auth'

const router = express.Router()

/**
 * 获取用户所有聊天会话
 * GET /api/chat/sessions
 */
router.get('/sessions', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ error: '用户未认证' })
    }

    const sessions = await ChatService.getUserSessions(userId)
    res.json({ sessions })
  } catch (error) {
    console.error('获取会话列表失败:', error)
    res.status(500).json({ error: '获取会话列表失败' })
  }
})

/**
 * 创建新的聊天会话
 * POST /api/chat/sessions
 */
router.post('/sessions', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ error: '用户未认证' })
    }

    const { title } = req.body
    const session = await ChatService.createSession(userId, title)
    res.json({ session })
  } catch (error) {
    console.error('创建会话失败:', error)
    res.status(500).json({ error: '创建会话失败' })
  }
})

/**
 * 获取会话的所有消息
 * GET /api/chat/sessions/:id/messages
 */
router.get('/sessions/:id/messages', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ error: '用户未认证' })
    }

    const sessionId = parseInt(req.params.id)
    if (isNaN(sessionId)) {
      return res.status(400).json({ error: '无效的会话ID' })
    }

    const messages = await ChatService.getSessionMessages(sessionId, userId)
    res.json({ messages })
  } catch (error: any) {
    console.error('获取会话消息失败:', error)
    if (error.message === '会话不存在或无权限访问') {
      res.status(404).json({ error: error.message })
    } else {
      res.status(500).json({ error: '获取会话消息失败' })
    }
  }
})

/**
 * 发送消息到会话
 * POST /api/chat/sessions/:id/messages
 */
router.post('/sessions/:id/messages', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ error: '用户未认证' })
    }

    const sessionId = parseInt(req.params.id)
    if (isNaN(sessionId)) {
      return res.status(400).json({ error: '无效的会话ID' })
    }

    const { type, content } = req.body
    if (!type || !content) {
      return res.status(400).json({ error: '消息类型和内容不能为空' })
    }

    if (type !== 'user' && type !== 'assistant') {
      return res.status(400).json({ error: '无效的消息类型' })
    }

    const message = await ChatService.sendMessage(sessionId, userId, type, content)
    res.json({ message })
  } catch (error: any) {
    console.error('发送消息失败:', error)
    if (error.message === '会话不存在或无权限访问') {
      res.status(404).json({ error: error.message })
    } else {
      res.status(500).json({ error: '发送消息失败' })
    }
  }
})

/**
 * 设置活跃会话
 * PUT /api/chat/sessions/:id/active
 */
router.put('/sessions/:id/active', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ error: '用户未认证' })
    }

    const sessionId = parseInt(req.params.id)
    if (isNaN(sessionId)) {
      return res.status(400).json({ error: '无效的会话ID' })
    }

    const session = await ChatService.setActiveSession(sessionId, userId)
    res.json({ session })
  } catch (error: any) {
    console.error('设置活跃会话失败:', error)
    if (error.message === '会话不存在或无权限访问') {
      res.status(404).json({ error: error.message })
    } else {
      res.status(500).json({ error: '设置活跃会话失败' })
    }
  }
})

/**
 * 删除聊天会话
 * DELETE /api/chat/sessions/:id
 */
router.delete('/sessions/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ error: '用户未认证' })
    }

    const sessionId = parseInt(req.params.id)
    if (isNaN(sessionId)) {
      return res.status(400).json({ error: '无效的会话ID' })
    }

    await ChatService.deleteSession(sessionId, userId)
    res.json({ success: true })
  } catch (error: any) {
    console.error('删除会话失败:', error)
    if (error.message === '会话不存在或无权限访问') {
      res.status(404).json({ error: error.message })
    } else {
      res.status(500).json({ error: '删除会话失败' })
    }
  }
})

/**
 * 获取活跃会话
 * GET /api/chat/active-session
 */
router.get('/active-session', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ error: '用户未认证' })
    }

    const session = await ChatService.getOrCreateActiveSession(userId)
    res.json({ session })
  } catch (error) {
    console.error('获取活跃会话失败:', error)
    res.status(500).json({ error: '获取活跃会话失败' })
  }
})

/**
 * 更新会话标题
 * PUT /api/chat/sessions/:id/title
 */
router.put('/sessions/:id/title', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ error: '用户未认证' })
    }

    const sessionId = parseInt(req.params.id)
    if (isNaN(sessionId)) {
      return res.status(400).json({ error: '无效的会话ID' })
    }

    const { title } = req.body
    if (!title || title.trim() === '') {
      return res.status(400).json({ error: '标题不能为空' })
    }

    const session = await ChatService.updateSessionTitle(sessionId, userId, title.trim())
    res.json({ session })
  } catch (error: any) {
    console.error('更新会话标题失败:', error)
    if (error.message === '会话不存在或无权限访问') {
      res.status(404).json({ error: error.message })
    } else {
      res.status(500).json({ error: '更新会话标题失败' })
    }
  }
})

export default router
