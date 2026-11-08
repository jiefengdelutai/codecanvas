import { Router, Request, Response } from 'express'
import { Project, ProjectCollaborator } from '../models'
import { authenticateToken } from '../middleware/auth'
import { CollaboratorService } from '../services/collaboratorService'
import { Op } from 'sequelize'

const router = Router()

// 应用认证中间件到所有路由
router.use(authenticateToken)

/**
 * 获取项目列表
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id
    const { keyword, sortBy = 'updatedAt', sortOrder = 'DESC', status } = req.query
    
    // 获取用户作为协作者的所有项目 ID
    const collaborations = await ProjectCollaborator.findAll({
      where: { userId },
      attributes: ['projectId', 'role'],
    })
    
    const projectIds = collaborations.map(c => c.projectId)
    
    if (projectIds.length === 0) {
      return res.json({
        success: true,
        data: [],
      })
    }
    
    const where: any = {
      id: { [Op.in]: projectIds }
    }
    
    // 关键词搜索
    if (keyword) {
      where.name = {
        [Op.like]: `%${keyword}%`
      }
    }
    
    // 状态筛选
    if (status) {
      where.status = status
    }
    
    const projects = await Project.findAll({
      where,
      order: [[sortBy as string, sortOrder as string]],
    })
    
    // 添加用户在每个项目中的角色
    const projectsWithRole = projects.map(project => {
      const collaboration = collaborations.find(c => c.projectId === project.id)
      return {
        ...project.toJSON(),
        userRole: collaboration?.role || null,
      }
    })
    
    res.json({
      success: true,
      data: projectsWithRole,
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '获取项目列表失败',
      error: error.message,
    })
  }
})

/**
 * 获取项目详情
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const userId = req.user!.id
    
    // 检查用户是否是协作者
    const isCollaborator = await CollaboratorService.isCollaborator(id, userId)
    if (!isCollaborator) {
      return res.status(404).json({
        success: false,
        message: '项目不存在或无权访问',
      })
    }
    
    const project = await Project.findByPk(id)
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: '项目不存在',
      })
    }
    
    // 更新最后访问时间
    await project.update({ lastAccessedAt: new Date() })
    
    res.json({
      success: true,
      data: project,
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '获取项目详情失败',
      error: error.message,
    })
  }
})

/**
 * 创建项目
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id
    const { name, description, content, tags, status = 'draft' } = req.body
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: '项目名称不能为空',
      })
    }
    
    // 计算内容大小
    const contentStr = typeof content === 'string' ? content : JSON.stringify(content)
    const size = Buffer.byteLength(contentStr, 'utf8')
    
    const project = await Project.create({
      userId,
      name,
      description: description || null,
      content: contentStr,
      tags: tags || '',
      status,
      size,
      viewCount: 0,
      isFavorite: false,
    })
    
    // 自动添加创建者为项目创建者
    await CollaboratorService.addOwner(project.id, userId)
    
    res.status(201).json({
      success: true,
      data: project,
      message: '项目创建成功',
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '创建项目失败',
      error: error.message,
    })
  }
})

/**
 * 更新项目
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const userId = req.user!.id
    const { name, description, content, thumbnail, tags, status, isFavorite, currentVersion } = req.body
    
    // 检查用户是否是协作者
    const isCollaborator = await CollaboratorService.isCollaborator(id, userId)
    if (!isCollaborator) {
      return res.status(403).json({
        success: false,
        message: '无权编辑该项目',
      })
    }
    
    const project = await Project.findByPk(id)
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: '项目不存在',
      })
    }
    
    // 版本冲突检测：如果提供了currentVersion，检查是否与数据库中的版本一致
    if (currentVersion !== undefined && project.currentVersion !== currentVersion) {
      return res.status(409).json({
        success: false,
        message: '项目已被其他用户修改，请刷新后再试',
        code: 'VERSION_CONFLICT',
        data: {
          serverVersion: project.currentVersion,
          clientVersion: currentVersion,
        },
      })
    }
    
    // 计算新的内容大小
    let size = project.size
    if (content !== undefined) {
      const contentStr = typeof content === 'string' ? content : JSON.stringify(content)
      size = Buffer.byteLength(contentStr, 'utf8')
    }
    
    // 更新项目，如果有内容变更则递增版本号
    const shouldIncrementVersion = content !== undefined && content !== project.content
    
    await project.update({
      name: name ?? project.name,
      description: description !== undefined ? description : project.description,
      content: content ?? project.content,
      thumbnail: thumbnail !== undefined ? thumbnail : project.thumbnail,
      tags: tags !== undefined ? tags : project.tags,
      status: status ?? project.status,
      isFavorite: isFavorite !== undefined ? isFavorite : project.isFavorite,
      size,
      currentVersion: shouldIncrementVersion ? project.currentVersion + 1 : project.currentVersion,
    })
    
    res.json({
      success: true,
      data: project,
      message: '项目更新成功',
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '更新项目失败',
      error: error.message,
    })
  }
})

/**
 * 删除项目
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const userId = req.user!.id
    
    // 检查用户是否是项目创建者（只有创建者可以删除项目）
    const isOwner = await CollaboratorService.isOwner(id, userId)
    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: '只有项目创建者可以删除项目',
      })
    }
    
    const project = await Project.findByPk(id)
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: '项目不存在',
      })
    }
    
    await project.destroy()
    
    res.json({
      success: true,
      message: '项目删除成功',
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '删除项目失败',
      error: error.message,
    })
  }
})

export default router

