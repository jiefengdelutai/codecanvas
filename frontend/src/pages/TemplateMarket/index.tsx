import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Spin, Empty, Modal, message, Tabs } from 'antd'
import { AppstoreOutlined, UserOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { observer } from 'mobx-react-lite'
import { Template, TemplateListParams } from '@/types/template'
import { templateService } from '@/services/templateService'
import TemplateToolbar from './components/TemplateToolbar'
import TemplateCard from './components/TemplateCard'
import TemplatePreviewModal from './components/TemplatePreviewModal'
import TemplateImportModal from './components/TemplateImportModal'
import MyTemplatesPanel from './components/MyTemplatesPanel'
import styles from './index.module.css'

const TemplateMarket: React.FC = observer(() => {
  // 纯代码开关：
  // - 'on'  启用推荐排序（A组）
  // - 'off' 关闭推荐排序，使用原始基线排序（B组）
  const RECOMMEND_FLAG: 'on' | 'off' = 'off'

  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(false)
  const [category, setCategory] = useState('all')
  const [keyword, setKeyword] = useState('')
  const [sortBy, setSortBy] = useState<'downloads' | 'createdAt'>('downloads')
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null)
  const [importTemplate, setImportTemplate] = useState<Template | null>(null)
  const [activeTab, setActiveTab] = useState<'market' | 'mine'>('market')
  const navigate = useNavigate()

  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const loadTemplates = useCallback(async (cat: string, kw: string, sort: string) => {
    setLoading(true)
    try {
      const currentProjectId = localStorage.getItem('currentProjectId') || undefined

      const params: TemplateListParams = {
        recommend: RECOMMEND_FLAG,
        projectId: currentProjectId,
      }
      if (cat !== 'all') params.category = cat
      if (kw.trim()) params.keyword = kw.trim()

      const response = await templateService.getTemplates(params)
      if (response.success && response.data) {
        let data = [...response.data]
        if (sort === 'createdAt') {
          data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        }
        setTemplates(data)
      } else {
        setTemplates([])
      }
    } catch {
      message.error('获取模板列表失败，请刷新重试')
      setTemplates([])
    } finally {
      setLoading(false)
    }
  }, [])

  // 分类/排序变化时立即请求
  useEffect(() => {
    loadTemplates(category, keyword, sortBy)
  }, [category, sortBy])

  // 搜索防抖 300ms
  const handleSearch = (kw: string) => {
    setKeyword(kw)
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    searchTimerRef.current = setTimeout(() => {
      loadTemplates(category, kw, sortBy)
    }, 300)
  }

  const handlePreview = (template: Template) => {
    setPreviewTemplate(template)
  }

  const handleImport = (template: Template) => {
    setImportTemplate(template)
  }

  const handleImportSuccess = (_projectId: string, projectName: string) => {
    setImportTemplate(null)
    Modal.confirm({
      title: '导入成功',
      content: `项目「${projectName}」已创建，是否前往「我的项目」查看？`,
      okText: '前往查看',
      cancelText: '继续浏览',
      onOk: () => navigate('/my-projects'),
    })
  }

  const tabItems = [
    {
      key: 'market',
      label: (
        <span><AppstoreOutlined /> 模板市场</span>
      ),
    },
    {
      key: 'mine',
      label: (
        <span><UserOutlined /> 我的模板</span>
      ),
    },
  ]

  return (
    <div className={styles.page}>
      <Tabs
        activeKey={activeTab}
        items={tabItems}
        onChange={(key) => setActiveTab(key as 'market' | 'mine')}
        className={styles.tabs}
      />

      {activeTab === 'market' && (
        <>
          <TemplateToolbar
            keyword={keyword}
            category={category}
            sortBy={sortBy}
            totalCount={templates.length}
            onSearch={handleSearch}
            onCategoryChange={(cat) => setCategory(cat)}
            onSortChange={(sort) => setSortBy(sort as 'downloads' | 'createdAt')}
          />

          <Spin spinning={loading} tip="加载中...">
            {!loading && templates.length === 0 ? (
              <Empty
                className={styles.empty}
                description={keyword ? `未找到与 "${keyword}" 相关的模板` : '暂无模板'}
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ) : (
              <div className={styles.grid}>
                {templates.map(template => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onPreview={handlePreview}
                    onImport={handleImport}
                  />
                ))}
              </div>
            )}
          </Spin>
        </>
      )}

      {activeTab === 'mine' && (
        <MyTemplatesPanel
          onPreview={handlePreview}
          onImport={handleImport}
          onDelete={() => loadTemplates(category, keyword, sortBy)}
        />
      )}
      <TemplatePreviewModal
        template={previewTemplate}
        visible={previewTemplate !== null}
        onClose={() => setPreviewTemplate(null)}
        onImport={(t) => {
          setPreviewTemplate(null)
          handleImport(t)
        }}
      />

      <TemplateImportModal
        template={importTemplate}
        visible={importTemplate !== null}
        onClose={() => setImportTemplate(null)}
        onSuccess={handleImportSuccess}
      />
    </div>
  )
})

export default TemplateMarket
