import api from './api'
import { 
  Project, 
  ProjectListParams, 
  CreateProjectData, 
  UpdateProjectData,
  ApiResponse 
} from '../types/project'

/**
 * 项目管理服务
 */
export const projectService = {
  /**
   * 获取项目列表
   */
  async getProjects(params?: ProjectListParams): Promise<ApiResponse<Project[]>> {
    // api拦截器已经返回response.data，所以这里直接返回
    return await api.get('/projects', { params })
  },

  /**
   * 获取项目详情
   */
  async getProject(id: string): Promise<ApiResponse<Project>> {
    return await api.get(`/projects/${id}`)
  },

  /**
   * 创建项目
   */
  async createProject(data: CreateProjectData): Promise<ApiResponse<Project>> {
    return await api.post('/projects', data)
  },

  /**
   * 更新项目
   */
  async updateProject(id: string, data: UpdateProjectData): Promise<ApiResponse<Project>> {
    return await api.put(`/projects/${id}`, data)
  },

  /**
   * 删除项目
   */
  async deleteProject(id: string): Promise<ApiResponse<void>> {
    return await api.delete(`/projects/${id}`)
  },

  /**
   * 切换收藏状态
   */
  async toggleFavorite(id: string, isFavorite: boolean): Promise<ApiResponse<Project>> {
    return this.updateProject(id, { isFavorite })
  },

  /**
   * 更新项目状态
   */
  async updateStatus(
    id: string, 
    status: 'draft' | 'published' | 'archived'
  ): Promise<ApiResponse<Project>> {
    return this.updateProject(id, { status })
  }
}
