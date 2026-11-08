import { Router, Request, Response } from 'express'
import multer from 'multer'
import path from 'path'
import { optionalAuth, authenticateToken } from '../middleware/auth'
import { RAGService } from '../services/ragService'
import Project from '../models/Project'

const router = Router()

// 配置文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/')
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
})

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
})

/**
 * AI图生码
 */
router.post('/image-to-code', upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '请上传图片文件',
      })
    }
    
    // TODO: 调用AI API进行图生码
    // 这里返回模拟数据
    const mockCode = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI生成页面</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; }
    .container { max-width: 1200px; margin: 0 auto; }
  </style>
</head>
<body>
  <div class="container">
    <h1>这是AI根据图片生成的页面</h1>
    <p>图片文件: ${req.file.filename}</p>
  </div>
</body>
</html>`
    
    res.json({
      success: true,
      data: { code: mockCode },
      message: 'AI图生码成功',
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'AI图生码失败',
      error: error.message,
    })
  }
})

/**
 * 获取项目上下文（仅项目代码）
 */
router.post('/project-context', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { projectId } = req.body

    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: '请提供项目ID',
      })
    }

    const project = await Project.findByPk(projectId, {
      attributes: ['content'],
    })

    if (!project) {
      return res.status(404).json({
        success: false,
        message: '项目不存在',
      })
    }

    return res.json({
      success: true,
      data: {
        projectCode: project.content || '',
      },
      message: '获取项目上下文成功',
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '获取项目上下文失败',
      error: error.message,
    })
  }
})

/**
 * AI对话（支持RAG开关）
 */
router.post('/chat', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { message, intent, projectId, sessionId } = req.body

    if (!message) {
      return res.status(400).json({
        success: false,
        message: '请提供对话内容',
      })
    }

    const normalizedIntent = typeof intent === 'string' ? intent.toLowerCase() : 'other'

    if (normalizedIntent === 'query' || normalizedIntent === 'ask') {
      if (!projectId) {
        return res.status(400).json({
          success: false,
          message: '查询项目上下文时请提供项目ID',
        })
      }

      const project = await Project.findByPk(projectId, {
        attributes: ['id', 'name', 'description', 'status', 'tags', 'content'],
      })

      if (!project) {
        return res.status(404).json({
          success: false,
          message: '项目不存在',
        })
      }

      const reply = [
        '检索到的项目知识如下：',
        `项目名称：${project.name || '未设置'}`,
        `项目描述：${project.description || '未设置'}`,
        `项目状态：${project.status || '未设置'}`,
        `项目标签：${project.tags || '未设置'}`,
        '',
        '当前项目代码：',
        project.content || '暂无代码',
      ].join('\n')

      return res.json({
        success: true,
        data: {
          intent: normalizedIntent,
          title: '项目查询结果',
          items: [
            { label: '项目名称', value: project.name || '未设置' },
            { label: '项目描述', value: project.description || '未设置' },
            { label: '项目状态', value: project.status || '未设置' },
            { label: '项目标签', value: project.tags || '未设置' },
            { label: '当前项目代码', value: project.content || '暂无代码' },
          ],
          reply,
        },
        message: '项目查询成功',
      })
    }

    if (normalizedIntent === 'modify') {
      if (!projectId) {
        return res.status(400).json({
          success: false,
          message: '获取项目上下文时请提供项目ID',
        })
      }

      const project = await Project.findByPk(projectId, {
        attributes: ['content'],
      })

      if (!project) {
        return res.status(404).json({
          success: false,
          message: '项目不存在',
        })
      }

      return res.json({
        success: true,
        data: {
          intent: 'modify',
          projectCode: project.content || '',
        },
        message: '获取项目上下文成功',
      })
    }

    const mockReply = `收到您的消息："${message}"。当前为普通对话路径回复。`

    return res.json({
      success: true,
      data: {
        intent: 'other',
        reply: mockReply,
      },
      message: 'AI对话成功',
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'AI对话失败',
      error: error.message,
    })
  }
})

/**
 * 代码优化建议
 */
router.post('/optimize', async (req: Request, res: Response) => {
  try {
    const { code } = req.body
    
    if (!code) {
      return res.status(400).json({
        success: false,
        message: '请提供需要优化的代码',
      })
    }
    
    // TODO: 调用AI API进行代码优化分析
    // 这里返回模拟数据
    const mockSuggestions = [
      '建议使用语义化的HTML标签',
      '可以添加CSS变量来统一管理颜色',
      '建议添加响应式设计支持',
      '考虑使用Flexbox或Grid布局',
    ]
    
    res.json({
      success: true,
      data: { suggestions: mockSuggestions },
      message: '代码优化建议生成成功',
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '代码优化建议生成失败',
      error: error.message,
    })
  }
})

export default router

