import React, { useEffect, useRef } from 'react'
import { Card, Tag, Button, Space, Typography, Checkbox } from 'antd'
import { 
  EditOutlined, 
  EyeOutlined,
  DeleteOutlined,
  CopyOutlined,
  StarOutlined,
  StarFilled,
  AppstoreAddOutlined,
  TeamOutlined
} from '@ant-design/icons'
import { Project } from '@/types/project'
import styles from './ProjectItem.module.css'

const { Text, Paragraph } = Typography

interface ProjectItemProps {
  project: Project
  isBatchMode: boolean
  selected: boolean
  onSelect: (checked: boolean) => void
  onEdit: (project: Project) => void
  onPreview: (project: Project) => void
  onDelete: (project: Project) => void
  onCopy: (project: Project) => void
  onToggleFavorite: (project: Project) => void
  onPublishTemplate?: (project: Project) => void
  onManageCollaborators?: (project: Project) => void
}

const ProjectItem: React.FC<ProjectItemProps> = ({
  project,
  isBatchMode,
  selected,
  onSelect,
  onEdit,
  onPreview,
  onDelete,
  onCopy,
  onToggleFavorite,
  onPublishTemplate,
  onManageCollaborators
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // 渲染缩略图预览
  useEffect(() => {
    if (iframeRef.current && project.content) {
      try {
        const content = JSON.parse(project.content)
        const previewHtml = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                * { box-sizing: border-box; }
                html { 
                  zoom: 0.16;
                  overflow: hidden;
                }
                body { 
                  margin: 0; 
                  padding: 0; 
                  width: 1000px;
                  min-height: 750px;
                  overflow: hidden;
                }
                /* 隐藏所有滚动条 */
                ::-webkit-scrollbar {
                  display: none;
                }
                * {
                  scrollbar-width: none;
                  -ms-overflow-style: none;
                }
                ${content.css || ''}
              </style>
            </head>
            <body>
              ${content.html || ''}
            </body>
          </html>
        `
        const doc = iframeRef.current.contentDocument
        if (doc) {
          doc.open()
          doc.write(previewHtml)
          doc.close()
        }
      } catch (error) {
        console.error('渲染缩略图失败:', error)
      }
    }
  }, [project.content])
  // 不再使用下拉菜单，所有按钮直接显示
  
  const getStatusTag = (status: string) => {
    const statusMap = {
      draft: { color: 'default', text: '草稿' },
      published: { color: 'success', text: '已发布' },
      archived: { color: 'warning', text: '已归档' }
    }
    const config = statusMap[status as keyof typeof statusMap]
    return <Tag color={config.color}>{config.text}</Tag>
  }
  
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
  }
  
  return (
    <Card className={styles.projectItem} hoverable>
      <div className={styles.content}>
        {/* 批量模式下显示复选框 */}
        {isBatchMode && (
          <div className={styles.checkbox}>
            <Checkbox 
              checked={selected}
              onChange={(e) => onSelect(e.target.checked)}
            />
          </div>
        )}
        
        {/* 缩略图 */}
        <div className={styles.thumbnail}>
          <iframe
            ref={iframeRef}
            className={styles.thumbnailIframe}
            sandbox="allow-same-origin allow-scripts"
            title={`Preview of ${project.name}`}
          />
          <div className={styles.thumbnailOverlay} />
        </div>
        
        {/* 项目信息 */}
        <div className={styles.info}>
          <div className={styles.header}>
            <div className={styles.titleRow}>
              <Typography.Title level={5} className={styles.name}>
                {project.name}
              </Typography.Title>
              <Space size="small">
                <Button
                  type="text"
                  size="small"
                  icon={project.isFavorite ? <StarFilled /> : <StarOutlined />}
                  onClick={() => onToggleFavorite(project)}
                  style={{ color: project.isFavorite ? '#faad14' : undefined }}
                />
                {getStatusTag(project.status)}
              </Space>
            </div>
          </div>
          
          {project.description && (
            <Paragraph 
              ellipsis={{ rows: 2 }} 
              className={styles.description}
            >
              {project.description}
            </Paragraph>
          )}
          
          <div className={styles.meta}>
            <Space split="|" size="small">
              <Text type="secondary">
                📅 创建: {formatDate(project.createdAt)}
              </Text>
              <Text type="secondary">
                📝 更新: {formatDate(project.updatedAt)}
              </Text>
              <Text type="secondary">👁 访问量: {project.viewCount}</Text>
              <Text type="secondary">💾 页面大小: {formatSize(project.size)}</Text>
            </Space>
          </div>
          
          {project.tags && (
            <div className={styles.tags}>
              {project.tags.split(',').filter(tag => tag.trim()).map(tag => (
                <Tag key={tag}>{tag}</Tag>
              ))}
            </div>
          )}
        </div>
        
        {/* 操作按钮 */}
        <div className={styles.actions}>
          <Button 
            icon={<EditOutlined />}
            onClick={() => onEdit(project)}
          >
            编辑
          </Button>
          <Button 
            icon={<EyeOutlined />}
            onClick={() => onPreview(project)}
          >
            预览
          </Button>
          <Button 
            icon={<CopyOutlined />}
            onClick={() => onCopy(project)}
          >
            复制
          </Button>
          <Button 
            icon={<TeamOutlined />}
            onClick={() => onManageCollaborators?.(project)}
          >
            权限管理
          </Button>
          <Button 
            icon={<AppstoreAddOutlined />}
            onClick={() => onPublishTemplate?.(project)}
          >
            发布为模板
          </Button>
          <Button 
            danger
            icon={<DeleteOutlined />}
            onClick={() => onDelete(project)}
          >
            删除
          </Button>
        </div>
      </div>
    </Card>
  )
}

export default ProjectItem
