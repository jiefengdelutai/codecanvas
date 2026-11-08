import { Router, Request, Response } from 'express'
import { Version, Project } from '../models'

const router = Router()

/**
 * 获取项目版本列表
 */
router.get('/:projectId', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params
    
    const versions = await Version.findAll({
      where: { projectId },
      order: [['createdAt', 'DESC']],
    })
    
    res.json({
      success: true,
      data: versions,
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '获取版本列表失败',
      error: error.message,
    })
  }
})

/**
 * 创建新版本
 */
router.post('/:projectId', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params
    const { description } = req.body
    
    // 检查项目是否存在
    const project = await Project.findByPk(projectId)
    if (!project) {
      return res.status(404).json({
        success: false,
        message: '项目不存在',
      })
    }
    
    // 获取当前版本数量，生成新版本号
    const count = await Version.count({ where: { projectId } })
    const versionNumber = `v${count + 1}.0.0`
    
    // 创建新版本
    const version = await Version.create({
      projectId,
      version: versionNumber,
      content: project.content,
      description,
    })
    
    res.status(201).json({
      success: true,
      data: version,
      message: '版本创建成功',
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '创建版本失败',
      error: error.message,
    })
  }
})

/**
 * 回滚到指定版本
 */
router.post('/:projectId/rollback', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params
    const { versionId } = req.body
    
    if (!versionId) {
      return res.status(400).json({
        success: false,
        message: '请提供版本ID',
      })
    }
    
    // 查找版本
    const version = await Version.findByPk(versionId)
    if (!version || version.projectId !== projectId) {
      return res.status(404).json({
        success: false,
        message: '版本不存在',
      })
    }
    
    // 更新项目内容为该版本的内容
    const project = await Project.findByPk(projectId)
    if (!project) {
      return res.status(404).json({
        success: false,
        message: '项目不存在',
      })
    }
    
    await project.update({ content: version.content })
    
    res.json({
      success: true,
      data: project,
      message: `已回滚到版本 ${version.version}`,
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '版本回滚失败',
      error: error.message,
    })
  }
})

/**
 * 对比两个版本的差异
 */
router.get('/diff/:v1/:v2', async (req: Request, res: Response) => {
  try {
    const { v1, v2 } = req.params
    
    const version1 = await Version.findByPk(v1)
    const version2 = await Version.findByPk(v2)
    
    if (!version1 || !version2) {
      return res.status(404).json({
        success: false,
        message: '版本不存在',
      })
    }
    
    // TODO: 实现代码差异对比算法
    // 这里返回简单的对比信息
    res.json({
      success: true,
      data: {
        diff: `版本 ${version1.version} 和 ${version2.version} 的差异对比功能待实现`,
        version1: {
          id: version1.id,
          version: version1.version,
          contentLength: version1.content.length,
        },
        version2: {
          id: version2.id,
          version: version2.version,
          contentLength: version2.content.length,
        },
      },
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '版本对比失败',
      error: error.message,
    })
  }
})

export default router

