import api from './api'

export interface Collaborator {
  id: string
  projectId: string
  userId: number
  role: 'owner' | 'editor'
  addedBy: number
  createdAt: string
  user: {
    id: number
    username: string
    email: string
    nickname?: string
    avatar_url?: string
  } | null
}

export interface UserSearchResult {
  id: number
  username: string
  email: string
  nickname?: string
  avatar_url?: string
}

export const collaboratorService = {
  /**
   * 获取项目的所有协作者
   */
  async getCollaborators(projectId: string): Promise<any> {
    return await api.get(`/collaborators/${projectId}`)
  },

  /**
   * 添加协作者
   */
  async addCollaborator(projectId: string, userId: number, role: 'owner' | 'editor' = 'editor'): Promise<any> {
    return await api.post(`/collaborators/${projectId}`, { userId, role })
  },

  /**
   * 删除协作者
   */
  async removeCollaborator(projectId: string, userId: number): Promise<any> {
    return await api.delete(`/collaborators/${projectId}/${userId}`)
  },

  /**
   * 转让项目所有权
   */
  async transferOwnership(projectId: string, newOwnerId: number): Promise<any> {
    return await api.put(`/collaborators/${projectId}/transfer`, { newOwnerId })
  },

  /**
   * 搜索用户
   */
  async searchUsers(projectId: string, keyword: string): Promise<any> {
    return await api.get(`/collaborators/${projectId}/search`, {
      params: { keyword }
    })
  },

  /**
   * 检查用户权限
   */
  async checkPermission(projectId: string): Promise<any> {
    return await api.get(`/collaborators/${projectId}/check`)
  }
}
