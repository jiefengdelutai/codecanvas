import ProjectCollaborator from '../models/ProjectCollaborator'
import Project from '../models/Project'
import User from '../models/User'
import { Op } from 'sequelize'

export class CollaboratorService {
  /**
   * 获取项目的所有协作者
   */
  static async getCollaborators(projectId: string) {
    const collaborators = await ProjectCollaborator.findAll({
      where: { projectId },
      order: [['createdAt', 'ASC']],
    })

    // 获取协作者的用户信息
    const userIds = collaborators.map(c => c.userId)
    const users = await User.findAll({
      where: { id: { [Op.in]: userIds } },
      attributes: ['id', 'username', 'email', 'nickname', 'avatar_url'],
    })

    // 组合数据
    return collaborators.map(c => {
      const user = users.find(u => u.id === c.userId)
      return {
        id: c.id,
        projectId: c.projectId,
        userId: c.userId,
        role: c.role,
        addedBy: c.addedBy,
        createdAt: c.createdAt,
        user: user ? {
          id: user.id,
          username: user.username,
          email: user.email,
          nickname: user.nickname,
          avatar_url: user.avatar_url,
        } : null,
      }
    })
  }

  /**
   * 检查用户是否是项目的协作者
   */
  static async isCollaborator(projectId: string, userId: number): Promise<boolean> {
    const collaborator = await ProjectCollaborator.findOne({
      where: { projectId, userId },
    })
    return !!collaborator
  }

  /**
   * 检查用户是否是项目的创建者
   */
  static async isOwner(projectId: string, userId: number): Promise<boolean> {
    const collaborator = await ProjectCollaborator.findOne({
      where: { projectId, userId, role: 'owner' },
    })
    return !!collaborator
  }

  /**
   * 获取用户在项目中的角色
   */
  static async getUserRole(projectId: string, userId: number): Promise<'owner' | 'editor' | null> {
    const collaborator = await ProjectCollaborator.findOne({
      where: { projectId, userId },
    })
    return collaborator ? collaborator.role : null
  }

  /**
   * 添加协作者
   */
  static async addCollaborator(
    projectId: string,
    userId: number,
    role: 'owner' | 'editor',
    addedBy: number
  ) {
    // 检查项目是否存在
    const project = await Project.findByPk(projectId)
    if (!project) {
      throw new Error('项目不存在')
    }

    // 检查用户是否存在
    const user = await User.findByPk(userId)
    if (!user) {
      throw new Error('用户不存在')
    }

    // 检查是否已经是协作者
    const existing = await ProjectCollaborator.findOne({
      where: { projectId, userId },
    })
    if (existing) {
      throw new Error('该用户已经是协作者')
    }

    // 检查协作者数量限制（最多5人）
    const count = await ProjectCollaborator.count({ where: { projectId } })
    if (count >= 5) {
      throw new Error('协作者数量已达上限（最多5人）')
    }

    // 创建协作者记录
    const collaborator = await ProjectCollaborator.create({
      projectId,
      userId,
      role,
      addedBy,
    })

    return collaborator
  }

  /**
   * 删除协作者
   */
  static async removeCollaborator(projectId: string, userId: number) {
    // 检查是否是创建者（创建者不能被删除）
    const collaborator = await ProjectCollaborator.findOne({
      where: { projectId, userId },
    })

    if (!collaborator) {
      throw new Error('协作者不存在')
    }

    if (collaborator.role === 'owner') {
      throw new Error('不能删除项目创建者')
    }

    await collaborator.destroy()
    return true
  }

  /**
   * 转让项目所有权
   */
  static async transferOwnership(projectId: string, currentOwnerId: number, newOwnerId: number) {
    // 检查当前创建者
    const currentOwner = await ProjectCollaborator.findOne({
      where: { projectId, userId: currentOwnerId, role: 'owner' },
    })

    if (!currentOwner) {
      throw new Error('您不是项目创建者')
    }

    // 检查新创建者是否是协作者
    const newOwner = await ProjectCollaborator.findOne({
      where: { projectId, userId: newOwnerId },
    })

    if (!newOwner) {
      throw new Error('新创建者必须先是项目协作者')
    }

    // 转让所有权
    currentOwner.role = 'editor'
    newOwner.role = 'owner'

    await currentOwner.save()
    await newOwner.save()

    return true
  }

  /**
   * 创建项目时自动添加创建者
   */
  static async addOwner(projectId: string, userId: number) {
    await ProjectCollaborator.create({
      projectId,
      userId,
      role: 'owner',
      addedBy: userId,
    })
  }

  /**
   * 搜索用户（用于添加协作者时搜索）
   */
  static async searchUsers(keyword: string, excludeUserIds: number[] = []) {
    const users = await User.findAll({
      where: {
        [Op.and]: [
          {
            [Op.or]: [
              { username: { [Op.like]: `%${keyword}%` } },
              { email: { [Op.like]: `%${keyword}%` } },
              { nickname: { [Op.like]: `%${keyword}%` } },
            ],
          },
          {
            id: { [Op.notIn]: excludeUserIds },
          },
        ],
      },
      attributes: ['id', 'username', 'email', 'nickname', 'avatar_url'],
      limit: 10,
    })

    return users
  }
}
