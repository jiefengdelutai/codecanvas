import { Op } from 'sequelize'
import User from '../models/User'
import Project from '../models/Project'
import Version from '../models/Version'
import Deploy from '../models/Deploy'
import Template from '../models/Template'

/**
 * 关联查询服务
 * 用于处理表之间的逻辑关联关系，替代数据库外键
 */
export class RelationService {
  /**
   * 获取用户的所有项目
   */
  static async getUserProjects(userId: number) {
    try {
      const projects = await Project.findAll({
        where: { userId },
        order: [['createdAt', 'DESC']],
      })
      return projects
    } catch (error) {
      console.error('获取用户项目失败:', error)
      return []
    }
  }

  /**
   * 获取项目详情（包含用户信息）
   */
  static async getProjectWithUser(projectId: string) {
    try {
      const project = await Project.findByPk(projectId)
      if (!project) return null

      const user = await User.findByPk(project.userId, {
        attributes: { exclude: ['password_hash'] }
      })

      return {
        ...project.toJSON(),
        user: user?.toJSON() || null,
      }
    } catch (error) {
      console.error('获取项目详情失败:', error)
      return null
    }
  }

  /**
   * 获取项目的所有版本
   */
  static async getProjectVersions(projectId: string) {
    try {
      const versions = await Version.findAll({
        where: { projectId },
        order: [['createdAt', 'DESC']],
      })
      return versions
    } catch (error) {
      console.error('获取项目版本失败:', error)
      return []
    }
  }

  /**
   * 获取项目的部署历史
   */
  static async getProjectDeploys(projectId: string) {
    try {
      const deploys = await Deploy.findAll({
        where: { projectId },
        order: [['createdAt', 'DESC']],
      })
      return deploys
    } catch (error) {
      console.error('获取项目部署历史失败:', error)
      return []
    }
  }

  /**
   * 获取项目完整信息（包含用户、版本、部署信息）
   */
  static async getProjectFullInfo(projectId: string) {
    try {
      const project = await this.getProjectWithUser(projectId)
      if (!project) return null

      const [versions, deploys] = await Promise.all([
        this.getProjectVersions(projectId),
        this.getProjectDeploys(projectId),
      ])

      return {
        ...project,
        versions: versions.map(v => v.toJSON()),
        deploys: deploys.map(d => d.toJSON()),
      }
    } catch (error) {
      console.error('获取项目完整信息失败:', error)
      return null
    }
  }

  /**
   * 获取用户统计信息
   */
  static async getUserStats(userId: number) {
    try {
      const [projectCount, projects] = await Promise.all([
        Project.count({ where: { userId } }),
        Project.findAll({ where: { userId }, attributes: ['id'] }),
      ])

      // 获取所有项目的版本和部署数量
      const projectIds = projects.map(p => p.id)
      const [versionCount, deployCount] = await Promise.all([
        Version.count({ where: { projectId: projectIds } }),
        Deploy.count({ where: { projectId: projectIds } }),
      ])

      return {
        projectCount,
        versionCount,
        deployCount,
      }
    } catch (error) {
      console.error('获取用户统计信息失败:', error)
      return {
        projectCount: 0,
        versionCount: 0,
        deployCount: 0,
      }
    }
  }

  /**
   * 删除项目及其相关数据
   */
  static async deleteProjectCascade(projectId: string) {
    try {
      // 按依赖顺序删除相关数据
      await Promise.all([
        Version.destroy({ where: { projectId } }),
        Deploy.destroy({ where: { projectId } }),
      ])

      // 最后删除项目本身
      await Project.destroy({ where: { id: projectId } })

      console.log(`✅ 项目 ${projectId} 及其相关数据删除成功`)
      return true
    } catch (error) {
      console.error('删除项目失败:', error)
      return false
    }
  }

  /**
   * 检查用户是否拥有项目
   */
  static async checkProjectOwnership(projectId: string, userId: number): Promise<boolean> {
    try {
      const project = await Project.findOne({
        where: { id: projectId, userId },
      })
      return !!project
    } catch (error) {
      console.error('检查项目所有权失败:', error)
      return false
    }
  }

  /**
   * 获取热门模板
   */
  static async getPopularTemplates(limit: number = 10) {
    try {
      const templates = await Template.findAll({
        order: [['downloads', 'DESC']],
        limit,
      })
      return templates
    } catch (error) {
      console.error('获取热门模板失败:', error)
      return []
    }
  }

  /**
   * 搜索模板
   */
  static async searchTemplates(keyword: string, category?: string) {
    try {
      const whereClause: any = {}
      
      if (keyword) {
        whereClause[Op.or] = [
          { name: { [Op.like]: `%${keyword}%` } },
          { description: { [Op.like]: `%${keyword}%` } },
          { tags: { [Op.like]: `%${keyword}%` } },
        ]
      }
      
      if (category) {
        whereClause.category = category
      }

      const templates = await Template.findAll({
        where: whereClause,
        order: [['downloads', 'DESC']],
      })
      
      return templates
    } catch (error) {
      console.error('搜索模板失败:', error)
      return []
    }
  }
}

export default RelationService
