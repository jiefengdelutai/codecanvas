import { Router, Request, Response } from 'express'
import { authenticateToken } from '../middleware/auth'
import { CollaboratorService } from '../services/collaboratorService'

const router = Router()

// 应用认证中间件
router.use(authenticateToken)

/**
 * 搜索用户（用于添加协作者）
 * GET /api/collaborators/:projectId/search?keyword=xxx
 * 注意：必须放在 /:projectId 路由之前
 */
router.get('/:projectId/search', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params
    const { keyword } = req.query
    const userId = req.user!.id

    // 检查用户是否是创建者
    const isOwner = await CollaboratorService.isOwner(projectId, userId)
    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: '只有项目创建者可以搜索用户',
      })
    }

    if (!keyword || typeof keyword !== 'string') {
      return res.status(400).json({
        success: false,
        message: '请提供搜索关键词',
      })
    }

    // 获取当前项目的所有协作者ID
    const collaborators = await CollaboratorService.getCollaborators(projectId)
    const excludeUserIds = collaborators.map(c => c.userId)

    const users = await CollaboratorService.searchUsers(keyword, excludeUserIds)

    res.json({
      success: true,
      data: users,
    })
  } catch (error: any) {
    console.error('搜索用户失败:', error)
    res.status(500).json({
      success: false,
      message: error.message || '搜索用户失败',
    })
  }
})

/**
 * 检查用户权限
 * GET /api/collaborators/:projectId/check
 * 注意：必须放在 /:projectId 路由之前
 */
router.get('/:projectId/check', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params
    const userId = req.user!.id

    const role = await CollaboratorService.getUserRole(projectId, userId)

    res.json({
      success: true,
      data: {
        isCollaborator: !!role,
        isOwner: role === 'owner',
        role,
      },
    })
  } catch (error: any) {
    console.error('检查权限失败:', error)
    res.status(500).json({
      success: false,
      message: error.message || '检查权限失败',
    })
  }
})

/**
 * 转让项目所有权
 * PUT /api/collaborators/:projectId/transfer
 * 注意：必须放在 /:projectId 路由之前
 */
router.put('/:projectId/transfer', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params
    const { newOwnerId } = req.body
    const currentUserId = req.user!.id

    if (!newOwnerId) {
      return res.status(400).json({
        success: false,
        message: '请提供新创建者ID',
      })
    }

    await CollaboratorService.transferOwnership(projectId, currentUserId, newOwnerId)

    res.json({
      success: true,
      message: '所有权转让成功',
    })
  } catch (error: any) {
    console.error('转让所有权失败:', error)
    res.status(400).json({
      success: false,
      message: error.message || '转让所有权失败',
    })
  }
})

/**
 * 获取项目的所有协作者
 * GET /api/collaborators/:projectId
 */
router.get('/:projectId', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params
    const userId = req.user!.id

    // 检查用户是否是协作者
    const isCollaborator = await CollaboratorService.isCollaborator(projectId, userId)
    if (!isCollaborator) {
      return res.status(403).json({
        success: false,
        message: '无权查看该项目的协作者',
      })
    }

    const collaborators = await CollaboratorService.getCollaborators(projectId)

    res.json({
      success: true,
      data: collaborators,
    })
  } catch (error: any) {
    console.error('获取协作者失败:', error)
    res.status(500).json({
      success: false,
      message: error.message || '获取协作者失败',
    })
  }
})

/**
 * 添加协作者
 * POST /api/collaborators/:projectId
 * Body: { userId: number, role: 'owner' | 'editor' }
 */
router.post('/:projectId', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params
    const { userId, role } = req.body
    const currentUserId = req.user!.id

    // 检查当前用户是否是创建者
    const isOwner = await CollaboratorService.isOwner(projectId, currentUserId)
    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: '只有项目创建者可以添加协作者',
      })
    }

    // 验证参数
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: '请提供用户ID',
      })
    }

    if (role && !['owner', 'editor'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: '角色必须是 owner 或 editor',
      })
    }

    const collaborator = await CollaboratorService.addCollaborator(
      projectId,
      userId,
      role || 'editor',
      currentUserId
    )

    res.json({
      success: true,
      message: '协作者添加成功',
      data: collaborator,
    })
  } catch (error: any) {
    console.error('添加协作者失败:', error)
    res.status(400).json({
      success: false,
      message: error.message || '添加协作者失败',
    })
  }
})

/**
 * 删除协作者
 * DELETE /api/collaborators/:projectId/:userId
 * 注意：必须放在 POST /:projectId 路由之后
 */
router.delete('/:projectId/:userId', async (req: Request, res: Response) => {
  try {
    const { projectId, userId } = req.params
    const currentUserId = req.user!.id

    // 检查当前用户是否是创建者
    const isOwner = await CollaboratorService.isOwner(projectId, currentUserId)
    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: '只有项目创建者可以删除协作者',
      })
    }

    await CollaboratorService.removeCollaborator(projectId, parseInt(userId))

    res.json({
      success: true,
      message: '协作者删除成功',
    })
  } catch (error: any) {
    console.error('删除协作者失败:', error)
    res.status(400).json({
      success: false,
      message: error.message || '删除协作者失败',
    })
  }
})


export default router
