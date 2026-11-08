import React, { useCallback, useRef } from 'react'
import { Modal, Button, Tag, Space, Typography, Divider } from 'antd'
import {
  DownloadOutlined,
  UserOutlined,
  CalendarOutlined,
  AppstoreOutlined,
  ImportOutlined,
  TagsOutlined,
} from '@ant-design/icons'
import { Template } from '@/types/template'
import { CATEGORY_LABEL_MAP } from '@/constants/templateCategories'
import styles from './index.module.css'

const { Title, Text, Paragraph } = Typography

interface TemplatePreviewModalProps {
  template: Template | null
  visible: boolean
  onClose: () => void
  onImport: (template: Template) => void
}

const TemplatePreviewModal: React.FC<TemplatePreviewModalProps> = ({
  template,
  visible,
  onClose,
  onImport,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const writeIframe = useCallback(() => {
    if (!template?.content || !iframeRef.current) return
    try {
      const content = JSON.parse(template.content)
      const previewHtml = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      * { box-sizing: border-box; }
      body { margin: 0; padding: 0; }
      ${content.css || ''}
    </style>
  </head>
  <body>
    ${content.html || ''}
    <script>${content.js || ''}</script>
  </body>
</html>`
      const doc = iframeRef.current.contentDocument
      if (doc) {
        doc.open()
        doc.write(previewHtml)
        doc.close()
      }
    } catch {
      // 内容解析失败时不渲染
    }
  }, [template])

  if (!template) return null

  const tags = template.tags ? template.tags.split(',').filter(Boolean) : []
  const categoryLabel = CATEGORY_LABEL_MAP[template.category] || template.category
  const createdDate = new Date(template.createdAt).toLocaleDateString('zh-CN')

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      width="90vw"
      style={{ top: 20, maxWidth: 1400 }}
      styles={{ body: { padding: 0 } }}
      footer={null}
      title={null}
      destroyOnClose
      afterOpenChange={(open) => { if (open) writeIframe() }}
    >
      <div className={styles.container}>
        {/* 左侧：iframe 预览 */}
        <div className={styles.previewPane}>
          <iframe
            ref={iframeRef}
            className={styles.previewIframe}
            sandbox="allow-same-origin allow-scripts"
            title={`Preview: ${template.name}`}
          />
        </div>

        {/* 右侧：模板信息 */}
        <div className={styles.infoPane}>
          <div className={styles.infoScroll}>
            <Title level={4} className={styles.title}>{template.name}</Title>

            {template.description && (
              <Paragraph className={styles.description}>
                {template.description}
              </Paragraph>
            )}

            <Divider style={{ margin: '16px 0' }} />

            <div className={styles.metaList}>
              <div className={styles.metaItem}>
                <UserOutlined className={styles.metaIcon} />
                <Text type="secondary">作者</Text>
                <Text strong>{template.authorName || '匿名'}</Text>
              </div>
              <div className={styles.metaItem}>
                <AppstoreOutlined className={styles.metaIcon} />
                <Text type="secondary">分类</Text>
                <Tag color="blue" className={styles.itemTag}>{categoryLabel}</Tag>
              </div>
              <div className={styles.metaItem}>
                <DownloadOutlined className={styles.metaIcon} />
                <Text type="secondary">使用次数</Text>
                <Text strong>{template.downloads}</Text>
              </div>
              <div className={styles.metaItem}>
                <CalendarOutlined className={styles.metaIcon} />
                <Text type="secondary">发布日期</Text>
                <Text>{createdDate}</Text>
              </div>
            </div>

            {tags.length > 0 && (
              <>
                <Divider style={{ margin: '16px 0' }} />
                <div className={styles.tagsSection}>
                  <Space size={4} align="start">
                    <TagsOutlined style={{ color: '#8c8c8c', marginTop: 3 }} />
                    <div className={styles.tags}>
                      {tags.map(tag => (
                        <Tag key={tag}>{tag.trim()}</Tag>
                      ))}
                    </div>
                  </Space>
                </div>
              </>
            )}
          </div>

          <div className={styles.actions}>
            <Button
              type="primary"
              size="large"
              icon={<ImportOutlined />}
              block
              onClick={() => onImport(template)}
            >
              导入到项目
            </Button>
            <Button size="large" block onClick={onClose}>
              关闭
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default TemplatePreviewModal
