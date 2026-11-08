import React, { useEffect, useRef } from 'react'
import { Card, Tag, Button, Space, Typography, Tooltip } from 'antd'
import { EyeOutlined, ImportOutlined, DownloadOutlined, UserOutlined } from '@ant-design/icons'
import { Template } from '@/types/template'
import { CATEGORY_LABEL_MAP } from '@/constants/templateCategories'
import styles from './index.module.css'

const { Text, Paragraph } = Typography

interface TemplateCardProps {
  template: Template
  onPreview: (template: Template) => void
  onImport: (template: Template) => void
}

const TemplateCard: React.FC<TemplateCardProps> = ({ template, onPreview, onImport }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    if (!iframeRef.current || !template.content) return
    try {
      const content = JSON.parse(template.content)
      const previewHtml = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <style>
      * { box-sizing: border-box; }
      html { zoom: 0.16; overflow: hidden; }
      body { margin: 0 auto; padding: 0; width: 1000px; min-height: 750px; overflow: hidden; }
      ::-webkit-scrollbar { display: none; }
      * { scrollbar-width: none; -ms-overflow-style: none; }
      ${content.css || ''}
    </style>
  </head>
  <body>${content.html || ''}</body>
</html>`
      const doc = iframeRef.current.contentDocument
      if (doc) {
        doc.open()
        doc.write(previewHtml)
        doc.close()
      }
    } catch {
      // 内容解析失败时显示空白
    }
  }, [template.content])

  const tags = template.tags ? template.tags.split(',').filter(Boolean) : []
  const categoryLabel = CATEGORY_LABEL_MAP[template.category] || template.category

  return (
    <Card
      className={styles.card}
      hoverable
      styles={{ body: { padding: 0 } }}
      cover={
        <div className={styles.thumbnail}>
          <iframe
            ref={iframeRef}
            className={styles.thumbnailIframe}
            sandbox="allow-same-origin allow-scripts"
            title={`Preview of ${template.name}`}
          />
          <div className={styles.thumbnailOverlay}>
            <div className={styles.hoverActions}>
              <Button
                type="primary"
                icon={<EyeOutlined />}
                onClick={(e) => { e.stopPropagation(); onPreview(template) }}
              >
                预览
              </Button>
              <Button
                icon={<ImportOutlined />}
                onClick={(e) => { e.stopPropagation(); onImport(template) }}
                style={{ background: 'rgba(255,255,255,0.95)' }}
              >
                导入
              </Button>
            </div>
          </div>
        </div>
      }
    >
      <div className={styles.info}>
        <div className={styles.titleRow}>
          <Tooltip title={template.name}>
            <Text strong className={styles.name} ellipsis>
              {template.name}
            </Text>
          </Tooltip>
          <Tag color="blue" className={styles.categoryTag}>{categoryLabel}</Tag>
        </div>

        {template.description && (
          <Paragraph ellipsis={{ rows: 2 }} className={styles.description}>
            {template.description}
          </Paragraph>
        )}

        {tags.length > 0 && (
          <div className={styles.tags}>
            {tags.slice(0, 3).map(tag => (
              <Tag key={tag} className={styles.tag}>{tag.trim()}</Tag>
            ))}
            {tags.length > 3 && <Tag className={styles.tag}>+{tags.length - 3}</Tag>}
          </div>
        )}

        <div className={styles.footer}>
          <Space size={4}>
            <UserOutlined style={{ color: '#8c8c8c', fontSize: 12 }} />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {template.authorName || '匿名'}
            </Text>
          </Space>
          <Space size={4}>
            <DownloadOutlined style={{ color: '#8c8c8c', fontSize: 12 }} />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {template.downloads}
            </Text>
          </Space>
        </div>
      </div>
    </Card>
  )
}

export default TemplateCard
