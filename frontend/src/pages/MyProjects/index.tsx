import React, { useEffect, useState } from 'react'
import { Spin, Empty, Modal, Button, message, Pagination } from 'antd'
import { observer } from 'mobx-react-lite'
import { useNavigate } from 'react-router-dom'
import { PlusOutlined, AppstoreOutlined } from '@ant-design/icons'
import { projectStore } from '@/store/projectStore'
import { templateService } from '@/services/templateService'
import { useDesignSpace } from '@/contexts/DesignSpaceContext'
import ProjectToolbar from './components/ProjectToolbar'
import ProjectItem from './components/ProjectItem'
import CreateProjectModal from './components/CreateProjectModal'
import PublishTemplateModal from '@/components/PublishTemplateModal'
import CollaboratorModal from './components/CollaboratorModal'
import { Project } from '@/types/project'
import { CreateTemplateData } from '@/types/template'
import { userStore } from '@/store/userStore'
import styles from './index.module.css'

const MyProjects: React.FC = observer(() => {
  const navigate = useNavigate()
  const { setIsInWorkMode } = useDesignSpace()
  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [sortValue, setSortValue] = useState('updatedAt-DESC')
  const [filterValue, setFilterValue] = useState<string | undefined>(undefined)
  const [isBatchMode, setIsBatchMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [publishTemplateModalVisible, setPublishTemplateModalVisible] = useState(false)
  const [currentPublishProject, setCurrentPublishProject] = useState<Project | null>(null)
  const [favoriteFilter, setFavoriteFilter] = useState<boolean | undefined>(undefined)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 4 })
  const [collaboratorModalVisible, setCollaboratorModalVisible] = useState(false)
  const [currentCollaboratorProject, setCurrentCollaboratorProject] = useState<Project | null>(null)

  useEffect(() => {
    // 页面加载时获取项目列表
    loadProjects()
  }, [])

  const loadProjects = async () => {
    try {
      await projectStore.fetchProjects()
    } catch (error: any) {
      message.error('加载项目失败')
    }
  }

  // 搜索
  const handleSearch = (keyword: string) => {
    projectStore.setSearchParams({ keyword })
    loadProjects()
  }

  // 排序
  const handleSort = (sortBy: string, order: string) => {
    const newSortValue = `${sortBy}-${order}`
    setSortValue(newSortValue)
    projectStore.setSearchParams({ 
      sortBy: sortBy as any, 
      sortOrder: order as any 
    })
    loadProjects()
  }

  // 筛选
  const handleFilter = (status?: string) => {
    setFilterValue(status)
    projectStore.setSearchParams({ 
      status: status as any 
    })
    loadProjects()
  }

  // 收藏筛选
  const handleFilterFavorite = (isFavorite?: boolean) => {
    setFavoriteFilter(isFavorite)
    // 收藏筛选在前端进行
    setPagination({ ...pagination, current: 1 })
  }

  // 编辑项目
  const handleEdit = (project: Project) => {
    // 保存项目内容到localStorage
    localStorage.setItem('currentProjectId', project.id)
    localStorage.setItem('code', project.content)
    // 设置工作模式
    setIsInWorkMode(true)
    // 跳转到DesignSpace
    navigate('/design-space')
  }

  // 预览项目
  const handlePreview = (project: Project) => {
    try {
      const content = JSON.parse(project.content)
      const previewHtml = `
        <!DOCTYPE html>
        <html lang="zh-CN">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${project.name}</title>
            <style>${content.css || ''}</style>
          </head>
          <body>
            ${content.html || ''}
            <script>${content.js || ''}</script>
          </body>
        </html>
      `
      const blob = new Blob([previewHtml], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank')
      
      // 清理URL对象
      setTimeout(() => {
        URL.revokeObjectURL(url)
      }, 1000)
    } catch (error) {
      message.error('预览失败，项目内容格式错误')
    }
  }

  // 删除项目
  const handleDelete = (project: Project) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除项目"${project.name}"吗？此操作不可恢复。`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await projectStore.deleteProject(project.id)
        } catch (error) {
          // 错误已在store中处理
        }
      }
    })
  }

  // 复制项目
  const handleCopy = async (project: Project) => {
    try {
      await projectStore.createProject({
        name: `${project.name} (副本)`,
        description: project.description,
        content: project.content,
        tags: project.tags,
        status: 'draft'
      })
    } catch (error) {
      // 错误已在store中处理
    }
  }

  // 切换收藏
  const handleToggleFavorite = async (project: Project) => {
    try {
      await projectStore.toggleFavorite(project.id, !project.isFavorite)
    } catch (error) {
      // 错误已在store中处理
    }
  }

  // 切换批量操作模式
  const handleToggleBatchMode = () => {
    setIsBatchMode(true)
  }

  // 取消批量操作
  const handleCancelBatch = () => {
    setIsBatchMode(false)
    setSelectedIds([])
  }

  // 批量选择
  const handleSelectProject = (projectId: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, projectId])
    } else {
      setSelectedIds(selectedIds.filter(id => id !== projectId))
    }
  }

  // 批量删除
  const handleBatchDelete = () => {
    Modal.confirm({
      title: '批量删除',
      content: `确定要删除选中的 ${selectedIds.length} 个项目吗？此操作不可恢复。`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await Promise.all(
            selectedIds.map(id => projectStore.deleteProject(id))
          )
          message.success('批量删除成功')
          handleCancelBatch()
        } catch (error) {
          message.error('批量删除失败')
        }
      }
    })
  }

  // 模板导入 - 跳转到模板市场
  const handleImportTemplate = () => {
    const latestProjectId = projectStore.projects[0]?.id
    if (latestProjectId) {
      localStorage.setItem('currentProjectId', latestProjectId)
    }
    navigate('/template-market')
  }

  // 管理协作者
  const handleManageCollaborators = (project: Project) => {
    setCurrentCollaboratorProject(project)
    setCollaboratorModalVisible(true)
  }

  // 发布为模板
  const handlePublishTemplate = (project: Project) => {
    setCurrentPublishProject(project)
    setPublishTemplateModalVisible(true)
  }

  // 执行发布模板
  const handleDoPublishTemplate = async (templateData: CreateTemplateData) => {
    if (!currentPublishProject) return

    try {
      // 检查是否已发布过模板
      if (currentPublishProject.isPublishedAsTemplate && currentPublishProject.templateId) {
        // 重新发布 - 更新已有模板
        await templateService.updateTemplate(currentPublishProject.templateId, {
          ...templateData,
          authorId: userStore.user!.id,
          authorName: userStore.user!.nickname || userStore.user!.username
        })
        message.success('模板已更新！')
      } else {
        // 首次发布 - 创建新模板
        const response = await templateService.createTemplate({
          ...templateData,
          authorId: userStore.user!.id,
          authorName: userStore.user!.nickname || userStore.user!.username
        })

        if (response.success && response.data) {
          // 更新项目的模板关联信息
          await projectStore.updateProject(currentPublishProject.id, {
            isPublishedAsTemplate: true,
            templateId: response.data.id
          })
          message.success('模板发布成功！')
        }
      }

      // 刷新项目列表
      await loadProjects()
    } catch (error: any) {
      message.error(error.message || '发布模板失败')
      throw error
    }
  }

  if (projectStore.loading) {
    return (
      <div className={styles.loading}>
        <Spin size="large">
          <div style={{ paddingTop: 50 }}>加载中...</div>
        </Spin>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      {/* 工具栏 */}
      <ProjectToolbar
        onSearch={handleSearch}
        onSort={handleSort}
        onFilter={handleFilter}
        onFilterFavorite={handleFilterFavorite}
        onCreateProject={() => setCreateModalVisible(true)}
        onImportTemplate={handleImportTemplate}
        onToggleBatchMode={handleToggleBatchMode}
        onBatchDelete={handleBatchDelete}
        onCancelBatch={handleCancelBatch}
        totalCount={projectStore.projects.length}
        selectedCount={selectedIds.length}
        isBatchMode={isBatchMode}
        sortValue={sortValue}
        filterValue={filterValue}
        favoriteFilter={favoriteFilter}
      />

      {/* 项目列表 */}
      <div className={styles.content}>
        {projectStore.projects.length === 0 ? (
          <div className={styles.empty}>
            <Empty
              description="暂无项目"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
              <p style={{ marginTop: 16, color: '#8c8c8c' }}>
                创建你的第一个项目，开始设计之旅
              </p>
              <div style={{ marginTop: 16 }}>
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />}
                  onClick={() => setCreateModalVisible(true)}
                  size="large"
                >
                  创建第一个项目
                </Button>
                <Button 
                  icon={<AppstoreOutlined />}
                  style={{ marginLeft: 12 }}
                  size="large"
                  onClick={() => navigate('/template-market')}
                >
                  浏览模板市场
                </Button>
              </div>
            </Empty>
          </div>
        ) : (
          <div className={styles.projectList}>
            {/* 筛选和分页后的项目列表 */}
            {projectStore.projects
              .filter(project => {
                // 收藏筛选
                if (favoriteFilter !== undefined) {
                  return project.isFavorite === favoriteFilter
                }
                return true
              })
              .slice(
                (pagination.current - 1) * pagination.pageSize,
                pagination.current * pagination.pageSize
              )
              .map(project => (
                <ProjectItem
                  key={project.id}
                  project={project}
                  isBatchMode={isBatchMode}
                  selected={selectedIds.includes(project.id)}
                  onSelect={(checked: boolean) => handleSelectProject(project.id, checked)}
                  onEdit={handleEdit}
                  onPreview={handlePreview}
                  onDelete={handleDelete}
                  onCopy={handleCopy}
                  onToggleFavorite={handleToggleFavorite}
                  onPublishTemplate={handlePublishTemplate}
                  onManageCollaborators={handleManageCollaborators}
                />
              ))}
            
            {/* 分页组件 */}
            <div className={styles.pagination}>
              <Pagination
                current={pagination.current}
                pageSize={pagination.pageSize}
                total={projectStore.projects.filter(project => {
                  if (favoriteFilter !== undefined) {
                    return project.isFavorite === favoriteFilter
                  }
                  return true
                }).length}
                onChange={(page) => setPagination({ ...pagination, current: page })}
                showSizeChanger={false}
                showTotal={(total) => `共 ${total} 个项目`}
              />
            </div>
          </div>
        )}
      </div>

      {/* 创建项目弹窗 */}
      <CreateProjectModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
        onSuccess={loadProjects}
      />

      {/* 协作者管理弹窗 */}
      {currentCollaboratorProject && (
        <CollaboratorModal
          visible={collaboratorModalVisible}
          projectId={currentCollaboratorProject.id}
          projectName={currentCollaboratorProject.name}
          onClose={() => {
            setCollaboratorModalVisible(false)
            setCurrentCollaboratorProject(null)
          }}
        />
      )}

      {/* 发布模板弹窗 */}
      <PublishTemplateModal
        visible={publishTemplateModalVisible}
        project={currentPublishProject}
        onClose={() => {
          setPublishTemplateModalVisible(false)
          setCurrentPublishProject(null)
        }}
        onPublish={handleDoPublishTemplate}
      />
    </div>
  )
})

export default MyProjects
