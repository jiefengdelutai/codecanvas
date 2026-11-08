import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Spin, Empty, Modal, message, Tag, Tooltip } from 'antd'
import {
  DeleteOutlined,
  EyeOutlined,
  ImportOutlined,
  DownloadOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons'
import { Template } from '@/types/template'
import { templateService } from '@/services/templateService'
import styles from './index.module.css'

// ---- 缩略图子组件（每张卡片独立 ref + effect） ----
interface ThumbnailProps {
  content: string
  name: string
  onClick: () => void
}

const TemplateThumbnail: React.FC<ThumbnailProps> = ({ content, name, onClick }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    if (!iframeRef.current || !content) return
    try {
      const parsed = JSON.parse(content)
      const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <style>
      * { box-sizing: border-box; }
      html { zoom: 0.16; overflow: hidden; }
      body { margin: 0 auto; padding: 0; width: 1000px; min-height: 750px; overflow: hidden; }
      ::-webkit-scrollbar { display: none; }
      * { scrollbar-width: none; -ms-overflow-style: none; }
      ${parsed.css || ''}
    </style>
  </head>
  <body>${parsed.html || ''}</body>
</html>`
      const doc = iframeRef.current.contentDocument
      if (doc) { doc.open(); doc.write(html); doc.close() }
    } catch {
      // 解析失败时留空
    }
  }, [content])

  return (
    <div className={styles.thumbnail} onClick={onClick}>
      <iframe
        ref={iframeRef}
        className={styles.thumbnailIframe}
        sandbox="allow-same-origin allow-scripts"
        title={`Preview of ${name}`}
      />
      <div className={styles.overlay}>
        <EyeOutlined className={styles.overlayIcon} />
        <span>预览</span>
      </div>
    </div>
  )
}
// -------------------------------------------------------

interface MyTemplatesPanelProps {
  onPreview: (template: Template) => void
  onImport: (template: Template) => void
  onDelete?: () => void
}

const MyTemplatesPanel: React.FC<MyTemplatesPanelProps> = ({ onPreview, onImport, onDelete }) => {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const loadMyTemplates = useCallback(async () => {
    setLoading(true)
    try {
      const res = await templateService.getMyTemplates()
      if (res.success && res.data) {
        setTemplates(res.data)
      }
    } catch {
      message.error('加载我的模板失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadMyTemplates()
  }, [loadMyTemplates])

  const handleDelete = (template: Template) => {
    Modal.confirm({
      title: '确认删除',
      icon: <ExclamationCircleOutlined />,
      content: `确定要删除模板「${template.name}」吗？此操作不可撤销。`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        setDeletingId(template.id)
        try {
          const res = await templateService.deleteTemplate(template.id)
          if (res.success) {
            message.success('模板已删除')
            setTemplates(prev => prev.filter(t => t.id !== template.id))
            onDelete?.()
          } else {
            message.error(res.message || '删除失败')
          }
        } catch {
          message.error('删除失败，请重试')
        } finally {
          setDeletingId(null)
        }
      },
    })
  }

  if (loading) {
    return (
      <div className={styles.loading}>
        <Spin size="large" tip="加载中..." />
      </div>
    )
  }

  if (templates.length === 0) {
    return (
      <Empty
        className={styles.empty}
        description="你还没有发布过模板"
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    )
  }

  return (
    <div className={styles.grid}>
      {templates.map(template => (
        <div key={template.id} className={styles.card}>
          {/* 缩略图区域 */}
          <TemplateThumbnail
            content={template.content}
            name={template.name}
            onClick={() => onPreview(template)}
          />

          {/* 信息区域 */}
          <div className={styles.info}>
            <div className={styles.nameRow}>
              <Tooltip title={template.name}>
                <span className={styles.name}>{template.name}</span>
              </Tooltip>
              <Tag color="blue" className={styles.categoryTag}>
                {template.category}
              </Tag>
            </div>

            {template.description && (
              <p className={styles.desc}>{template.description}</p>
            )}

            <div className={styles.meta}>
              <span className={styles.downloads}>
                <DownloadOutlined /> {template.downloads}
              </span>
              <span className={styles.date}>
                {new Date(template.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className={styles.actions}>
            <button
              className={styles.btnImport}
              onClick={() => onImport(template)}
            >
              <ImportOutlined /> 导入
            </button>
            <button
              className={styles.btnDelete}
              onClick={() => handleDelete(template)}
              disabled={deletingId === template.id}
            >
              <DeleteOutlined /> 删除
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

export default MyTemplatesPanel
