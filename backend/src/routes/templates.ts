import { Router, Request, Response } from 'express'
import { Template, Project } from '../models'
import { Op } from 'sequelize'
import { authenticateToken, optionalAuth } from '../middleware/auth'
import { CollaboratorService } from '../services/collaboratorService'
import { TemplateRecommendService } from '../services/templateRecommendService'

const router = Router()

// 需要认证的路由
router.post('/', authenticateToken)
router.get('/mine', authenticateToken)
router.get('/', optionalAuth)
router.post('/:id/import', authenticateToken)
router.put('/:id', authenticateToken)
router.delete('/:id', authenticateToken)

/**
 * 获取模板列表
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { category, keyword, recommend, projectId, debugRecommend } = req.query

    const where: any = {}

    if (category) {
      where.category = category
    }

    if (keyword) {
      where.name = {
        [Op.like]: `%${keyword}%`
      }
    }

    // A/B 演示开关：
    // - recommend=off 或 recommend=b：关闭推荐，走基线排序（B组）
    // - 其他值（默认）启用推荐重排（A组）
    const recommendFlag = typeof recommend === 'string' ? recommend.toLowerCase() : 'on'
    const enableRecommend = recommendFlag !== 'off' && recommendFlag !== 'b'

    // 先按原有规则召回，后续在内存中执行推荐重排（放置点A）
    const templates = await Template.findAll({
      where,
      order: [['downloads', 'DESC'], ['createdAt', 'DESC']],
    })

    let rankedTemplates = templates
    let debugScores: any[] = []
    let strategy: 'baseline' | 'recommend' = 'baseline'

    if (enableRecommend) {
      try {
        const rankedResult = await TemplateRecommendService.rankTemplatesWithScores(templates, {
          userId: req.user?.id,
          keyword: typeof keyword === 'string' ? keyword : undefined,
          category: typeof category === 'string' ? category : undefined,
          projectId: typeof projectId === 'string' ? projectId : undefined,
        })
        rankedTemplates = rankedResult.templates
        debugScores = rankedResult.scores
        strategy = 'recommend'
      } catch (rankError) {
        // 推荐排序失败时回退到原有排序，保证接口稳定
        console.warn('模板推荐重排失败，已回退默认排序:', rankError)
      }
    }

    const shouldReturnDebug =
      process.env.NODE_ENV !== 'production' &&
      typeof debugRecommend === 'string' &&
      (debugRecommend.toLowerCase() === '1' || debugRecommend.toLowerCase() === 'true')

    res.json({
      success: true,
      data: rankedTemplates,
      meta: {
        strategy,
        recommendFlag,
      },
      ...(shouldReturnDebug ? { debugRecommend: { scores: debugScores } } : {}),
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '获取模板列表失败',
      error: error.message,
    })
  }
})

/**
 * 获取当前用户发布的模板列表
 * ⚠️ 必须在 /:id 之前注册，否则 'mine' 会被误当作 id
 */
router.get('/mine', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id
    const templates = await Template.findAll({
      where: { authorId: userId },
      order: [['createdAt', 'DESC']],
    })
    res.json({ success: true, data: templates })
  } catch (error: any) {
    res.status(500).json({ success: false, message: '获取我的模板失败', error: error.message })
  }
})

/**
 * 获取模板详情
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const template = await Template.findByPk(id)
    
    if (!template) {
      return res.status(404).json({
        success: false,
        message: '模板不存在',
      })
    }
    
    // 增加下载次数
    await template.update({ downloads: template.downloads + 1 })
    
    res.json({
      success: true,
      data: template,
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '获取模板详情失败',
      error: error.message,
    })
  }
})

/**
 * 创建模板
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, description, content, category, tags, thumbnail, sourceProjectId, isPublic, authorId, authorName } = req.body
    
    if (!name || !content) {
      return res.status(400).json({
        success: false,
        message: '模板名称和内容不能为空',
      })
    }
    
    const template = await Template.create({
      name,
      description,
      content,
      category: category || 'general',
      tags: Array.isArray(tags) ? tags.join(',') : tags,
      thumbnail,
      downloads: 0,
      authorId: authorId || req.user!.id,
      authorName: authorName || req.user!.username,
      sourceProjectId: sourceProjectId || null,
      isPublic: isPublic !== undefined ? isPublic : true,
    })
    
    res.status(201).json({
      success: true,
      data: template,
      message: '模板创建成功',
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '创建模板失败',
      error: error.message,
    })
  }
})

/**
 * 更新模板
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const userId = req.user!.id
    const { name, description, content, category, tags, thumbnail, isPublic } = req.body
    
    const template = await Template.findByPk(id)
    
    if (!template) {
      return res.status(404).json({
        success: false,
        message: '模板不存在',
      })
    }
    
    // 验证权限：只有作者可以更新模板
    if (template.authorId !== userId) {
      return res.status(403).json({
        success: false,
        message: '无权更新此模板',
      })
    }
    
    await template.update({
      name: name ?? template.name,
      description: description ?? template.description,
      content: content ?? template.content,
      category: category ?? template.category,
      tags: tags ? (Array.isArray(tags) ? tags.join(',') : tags) : template.tags,
      thumbnail: thumbnail ?? template.thumbnail,
      isPublic: isPublic !== undefined ? isPublic : template.isPublic,
    })
    
    res.json({
      success: true,
      data: template,
      message: '模板更新成功',
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '更新模板失败',
      error: error.message,
    })
  }
})

/**
 * 导入模板 - 基于模板内容创建新项目
 */
router.post('/:id/import', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { projectName } = req.body
    const userId = req.user!.id

    if (!projectName || !projectName.trim()) {
      return res.status(400).json({
        success: false,
        message: '项目名称不能为空',
      })
    }

    const template = await Template.findByPk(id)
    if (!template) {
      return res.status(404).json({
        success: false,
        message: '模板不存在',
      })
    }

    // 创建新项目
    const project = await Project.create({
      userId,
      name: projectName.trim(),
      description: template.description || '',
      content: template.content,
      tags: template.tags || '',
      size: Buffer.byteLength(template.content, 'utf8'),
      status: 'draft',
    })

    // 将导入者设为项目 owner（否则 GET /projects 查不到该项目）
    await CollaboratorService.addOwner(project.id, userId)

    // 增加模板使用次数
    await template.update({ downloads: template.downloads + 1 })

    res.status(201).json({
      success: true,
      data: project,
      message: '模板导入成功',
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '导入模板失败',
      error: error.message,
    })
  }
})

/**
 * 删除模板（仅作者可操作）
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const userId = req.user!.id

    const template = await Template.findByPk(id)
    if (!template) {
      return res.status(404).json({ success: false, message: '模板不存在' })
    }

    if (template.authorId !== userId) {
      return res.status(403).json({ success: false, message: '无权删除此模板' })
    }

    await template.destroy()
    res.json({ success: true, message: '模板删除成功' })
  } catch (error: any) {
    res.status(500).json({ success: false, message: '删除模板失败', error: error.message })
  }
})

export default router

