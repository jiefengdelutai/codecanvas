import { makeAutoObservable, runInAction } from 'mobx'
import { message } from 'antd'
import { projectService } from '../services/projectService'
import { Project, ProjectListParams, CreateProjectData, UpdateProjectData } from '../types/project'

/**
 * 项目状态管理 Store
 */
class ProjectStore {
  projects: Project[] = []
  loading = false
  currentProject: Project | null = null
  
  // 搜索和筛选参数
  searchParams: ProjectListParams = {
    sortBy: 'updatedAt',
    sortOrder: 'DESC'
  }

  constructor() {
    makeAutoObservable(this)
  }

  /**
   * 获取项目列表
   */
  async fetchProjects(params?: ProjectListParams) {
    this.loading = true
    try {
      const mergedParams = { ...this.searchParams, ...params }
      const response = await projectService.getProjects(mergedParams)
      
      runInAction(() => {
        if (response.success && response.data) {
          this.projects = response.data
        }
        this.loading = false
      })
    } catch (error: any) {
      runInAction(() => {
        this.loading = false
      })
      message.error(error.message || '获取项目列表失败')
      throw error
    }
  }

  /**
   * 获取项目详情
   */
  async fetchProject(id: string) {
    this.loading = true
    try {
      const response = await projectService.getProject(id)
      
      runInAction(() => {
        if (response.success && response.data) {
          this.currentProject = response.data
        }
        this.loading = false
      })
      
      return response.data
    } catch (error: any) {
      runInAction(() => {
        this.loading = false
      })
      message.error(error.message || '获取项目详情失败')
      throw error
    }
  }

  /**
   * 创建项目
   */
  async createProject(data: CreateProjectData) {
    try {
      console.log('调用projectService.createProject，参数:', data)
      const response = await projectService.createProject(data)
      console.log('projectService.createProject响应:', response)
      
      if (response.success && response.data) {
        runInAction(() => {
          this.projects.unshift(response.data!)
        })
        message.success('项目创建成功！')
        return response.data
      } else {
        // 如果响应不成功或没有数据，抛出错误
        const errorMsg = response.message || '项目创建失败：服务器未返回有效数据'
        console.error(errorMsg, response)
        message.error(errorMsg)
        throw new Error(errorMsg)
      }
    } catch (error: any) {
      console.error('创建项目异常:', error)
      message.error(error.message || '创建项目失败')
      throw error
    }
  }

  /**
   * 更新项目
   */
  async updateProject(id: string, data: UpdateProjectData) {
    try {
      const response = await projectService.updateProject(id, data)
      
      if (response.success && response.data) {
        runInAction(() => {
          const index = this.projects.findIndex(p => p.id === id)
          if (index !== -1) {
            this.projects[index] = response.data!
          }
          if (this.currentProject?.id === id) {
            this.currentProject = response.data!
          }
        })
        return response.data
      }
    } catch (error: any) {
      // 409版本冲突错误由调用方处理,不在这里显示错误提示
      if (error.response?.status !== 409) {
        message.error(error.message || '更新项目失败')
      }
      throw error
    }
  }

  /**
   * 删除项目
   */
  async deleteProject(id: string) {
    try {
      const response = await projectService.deleteProject(id)
      
      if (response.success) {
        runInAction(() => {
          this.projects = this.projects.filter(p => p.id !== id)
          if (this.currentProject?.id === id) {
            this.currentProject = null
          }
        })
        message.success('项目删除成功')
      }
    } catch (error: any) {
      message.error(error.message || '删除项目失败')
      throw error
    }
  }

  /**
   * 切换收藏状态
   */
  async toggleFavorite(id: string, isFavorite: boolean) {
    try {
      const response = await projectService.toggleFavorite(id, isFavorite)
      
      if (response.success && response.data) {
        runInAction(() => {
          const index = this.projects.findIndex(p => p.id === id)
          if (index !== -1) {
            this.projects[index] = response.data!
          }
        })
        message.success(isFavorite ? '已收藏' : '已取消收藏')
      }
    } catch (error: any) {
      message.error(error.message || '操作失败')
      throw error
    }
  }

  /**
   * 更新搜索参数
   */
  setSearchParams(params: Partial<ProjectListParams>) {
    this.searchParams = { ...this.searchParams, ...params }
  }

  /**
   * 清空搜索参数
   */
  clearSearchParams() {
    this.searchParams = {
      sortBy: 'updatedAt',
      sortOrder: 'DESC'
    }
  }

  /**
   * 获取收藏的项目
   */
  get favoriteProjects() {
    return this.projects.filter(p => p.isFavorite)
  }

  /**
   * 获取最近访问的项目
   */
  get recentProjects() {
    return this.projects
      .filter(p => p.lastAccessedAt)
      .sort((a, b) => {
        const dateA = new Date(a.lastAccessedAt!).getTime()
        const dateB = new Date(b.lastAccessedAt!).getTime()
        return dateB - dateA
      })
      .slice(0, 5)
  }
}

export const projectStore = new ProjectStore()
