import api from './api'
import { 
  Template, 
  TemplateListParams, 
  CreateTemplateData,
  ApiResponse 
} from '../types/template'

/**
 * 模板管理服务
 */
export const templateService = {
  /**
   * 获取模板列表
   */
  async getTemplates(params?: TemplateListParams): Promise<ApiResponse<Template[]>> {
    return await api.get('/templates', { params })
  },

  /**
   * 获取模板详情
   */
  async getTemplate(id: string): Promise<ApiResponse<Template>> {
    return await api.get(`/templates/${id}`)
  },

  /**
   * 创建模板
   */
  async createTemplate(data: CreateTemplateData): Promise<ApiResponse<Template>> {
    return await api.post('/templates', data)
  },

  /**
   * 更新模板
   */
  async updateTemplate(id: string, data: Partial<Template>): Promise<ApiResponse<Template>> {
    return await api.put(`/templates/${id}`, data)
  },

  /**
   * 导入模板 - 基于模板创建新项目
   */
  async importTemplate(templateId: string, projectName: string): Promise<ApiResponse<{ id: string; name: string }>> {
    return await api.post(`/templates/${templateId}/import`, { projectName })
  },

  /**
   * 获取当前用户发布的模板列表
   */
  async getMyTemplates(): Promise<ApiResponse<Template[]>> {
    return await api.get('/templates/mine')
  },

  /**
   * 删除模板（仅作者可操作）
   */
  async deleteTemplate(id: string): Promise<ApiResponse<null>> {
    return await api.delete(`/templates/${id}`)
  }
}
