import React, { useState } from 'react'
import { Typography, Button, Upload, message, Input, Image } from 'antd'
import { InboxOutlined, DeleteOutlined } from '@ant-design/icons'
import { observer } from 'mobx-react-lite'
import { useNavigate } from 'react-router-dom'
import { useDesignSpace } from '@/contexts/DesignSpaceContext'
import { projectStore } from '@/store/projectStore'
import { welcomeTemplate, blankTemplate } from '../../constants/defaultTemplates'
import styles from './index.module.css'
import { callAIWithText, callAIWithImageAndText, validateAPIConfig, AIMode, getCodeFromLocalStorage } from '../../services/aiService'

const { Title } = Typography
const { TextArea } = Input
const { Dragger } = Upload

const Home: React.FC = observer(() => {
  const navigate = useNavigate()
  const { setIsInWorkMode } = useDesignSpace()
  const [selectedStyles, setSelectedStyles] = useState<string[]>([])
  const [pageDescription, setPageDescription] = useState('')
  const [uploadedImage, setUploadedImage] = useState<{
    file: File | null
    preview: string | null
    base64: string | null
  }>({
    file: null,
    preview: null,
    base64: null
  })
  
  // AI生成相关状态
  const [isGenerating, setIsGenerating] = useState(false)
  const [, setGenerationProgress] = useState('')
  
  // 页面快捷选择选项分类
  const quickOptions = {
    pageStyle: {
      title: '页面风格',
      options: [
        { label: '科技现代', value: 'tech-modern', desc: '现代化并带有一定科技感' },
        { label: '简洁整体', value: 'clean-minimal', desc: '简洁明了，布局整齐统一' },
        { label: '商务专业', value: 'business-professional', desc: '商务风格，专业正式' },
        { label: '创意艺术', value: 'creative-artistic', desc: '富有创意，艺术感强' },
        { label: '温馨家居', value: 'warm-home', desc: '温馨舒适的家居风格' },
        { label: '时尚潮流', value: 'fashion-trendy', desc: '时尚前卫，紧跟潮流' }
      ]
    },
    deviceAdaptation: {
      title: '设备适配',
      options: [
        { label: '移动端适配', value: 'mobile-adaptive', desc: '专为移动设备优化' },
        { label: 'PC端适配', value: 'pc-adaptive', desc: '专为桌面端优化' },
        { label: '响应式布局', value: 'responsive-layout', desc: '自适应各种屏幕尺寸' },
        { label: '平板适配', value: 'tablet-adaptive', desc: '专为平板设备优化' }
      ]
    },
    pageType: {
      title: '页面类型',
      options: [
        { label: '管理后台', value: 'admin-dashboard', desc: '后台管理系统界面' },
        { label: '展示页面', value: 'showcase-page', desc: '产品或服务展示页面' },
        { label: '表单页面', value: 'form-page', desc: '数据录入和表单页面' },
        { label: '数据看板', value: 'data-dashboard', desc: '数据可视化看板' },
        { label: '电商页面', value: 'ecommerce-page', desc: '电子商务相关页面' },
        { label: '博客文章', value: 'blog-article', desc: '博客或文章阅读页面' }
      ]
    },
    interactionEffects: {
      title: '交互特效',
      options: [
        { label: '动画效果', value: 'animation-effects', desc: '丰富的动画和过渡效果' },
        { label: '悬停特效', value: 'hover-effects', desc: '鼠标悬停时的交互效果' },
        { label: '滚动视差', value: 'parallax-scroll', desc: '滚动时的视差效果' },
        { label: '渐变过渡', value: 'gradient-transition', desc: '平滑的渐变过渡效果' },
        { label: '阴影效果', value: 'shadow-effects', desc: '立体感的阴影效果' }
      ]
    },
    layoutStructure: {
      title: '布局结构',
      options: [
        { label: '单栏布局', value: 'single-column', desc: '简单的单栏垂直布局' },
        { label: '双栏布局', value: 'two-column', desc: '左右两栏的布局结构' },
        { label: '三栏布局', value: 'three-column', desc: '三栏的复杂布局结构' },
        { label: '网格布局', value: 'grid-layout', desc: '灵活的网格布局系统' },
        { label: '瀑布流布局', value: 'masonry-layout', desc: '不规则的瀑布流布局' }
      ]
    },
    colorTheme: {
      title: '色彩主题',
      options: [
        { label: '深色主题', value: 'dark-theme', desc: '深色背景的主题风格' },
        { label: '浅色主题', value: 'light-theme', desc: '浅色背景的主题风格' },
        { label: '蓝色系', value: 'blue-theme', desc: '以蓝色为主的配色方案' },
        { label: '绿色系', value: 'green-theme', desc: '以绿色为主的配色方案' },
        { label: '暖色调', value: 'warm-colors', desc: '温暖的暖色调配色' },
        { label: '冷色调', value: 'cool-colors', desc: '清爽的冷色调配色' }
      ]
    }
  }
  
  // 获取分类前缀
  const getCategoryPrefix = (value: string) => {
    for (const [categoryKey, category] of Object.entries(quickOptions)) {
      if (category.options.some(opt => opt.value === value)) {
        switch (categoryKey) {
          case 'pageStyle': return '页面风格'
          case 'deviceAdaptation': return '设备适配'
          case 'pageType': return '页面类型'
          case 'interactionEffects': return '交互特效'
          case 'layoutStructure': return '布局结构'
          case 'colorTheme': return '色彩主题'
          default: return '页面要求'
        }
      }
    }
    return '页面要求'
  }

  // 处理快捷按钮点击
  const handleQuickOptionClick = (value: string, desc: string) => {
    const isSelected = selectedStyles.includes(value)
    const prefix = getCategoryPrefix(value)
    const fullText = `${prefix}：${desc}`
    
    // 更新选中状态
    setSelectedStyles(prev => 
      isSelected 
        ? prev.filter(item => item !== value)
        : [...prev, value]
    )
    
    // 更新文本域内容
    const currentText = pageDescription
    
    if (isSelected) {
      // 取消选中：删除对应的文本
      const lines = currentText.split('\n')
      const filteredLines = lines.filter(line => line.trim() !== fullText)
      setPageDescription(filteredLines.join('\n').trim())
    } else {
      // 选中：添加文本
      const newText = currentText.trim() 
        ? `${currentText}\n${fullText}`
        : fullText
      setPageDescription(newText)
    }
  }
  
  // 处理图片上传
  const handleUpload = (info: any) => {
    const { file } = info
    
    // 只处理原始文件，不依赖服务器上传状态
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      
      // 读取文件为base64
      reader.onload = (e) => {
        const base64 = e.target?.result as string
        setUploadedImage({
          file: file,
          preview: URL.createObjectURL(file), // 创建预览URL
          base64: base64
        })
        message.success(`${file.name} 图片加载成功`)
      }
      
      reader.onerror = () => {
        message.error('图片读取失败')
      }
      
      reader.readAsDataURL(file)
    } else if (file && !file.type.startsWith('image/')) {
      message.error('请上传图片文件')
    }
  }
  
  // 清除上传的图片
  const handleRemoveImage = () => {
    if (uploadedImage.preview) {
      URL.revokeObjectURL(uploadedImage.preview) // 释放内存
    }
    setUploadedImage({
      file: null,
      preview: null,
      base64: null
    })
  }
  

  // 处理开始生成页面
  const handleGeneratePage = async () => {
    // 验证API配置
    if (!validateAPIConfig()) {
      return
    }

    // 验证用户输入
    if (!pageDescription.trim()) {
      message.warning('请输入页面描述')
      return
    }

    try {
      setIsGenerating(true)
      setGenerationProgress('正在准备请求...')
      
      const userRequirements = pageDescription.trim()

      // 进度回调函数
      const onProgress = (chunk: string) => {
        setGenerationProgress(prev => prev + chunk)
      }

      if (uploadedImage.base64) {
        // 有图片：使用多模态请求（图生码场景）
        setGenerationProgress('正在发送图片和文本到AI...')
        const mimeType = uploadedImage.file?.type || 'image/jpeg'
        await callAIWithImageAndText(
          userRequirements,
          uploadedImage.base64,
          mimeType,
          onProgress
        )
      } else {
        // 无图片：使用纯文本请求（页面生成模式）
        setGenerationProgress('正在发送文本到AI...')
        await callAIWithText(userRequirements, onProgress, true, AIMode.GENERATE)
      }

      // AI已将生成的HTML代码保存到localStorage，读取后创建数据库项目记录
      const generatedCode = getCodeFromLocalStorage()
      const namePreview = pageDescription.trim().slice(0, 20)
      const projectName = `AI生成 - ${namePreview}${pageDescription.trim().length > 20 ? '...' : ''}`

      try {
        const project = await projectStore.createProject({
          name: projectName,
          description: uploadedImage.base64 ? '通过图生码生成的项目' : '通过文字描述生成的项目',
          content: generatedCode ? JSON.stringify(generatedCode) : JSON.stringify({ html: '', css: '', js: '' }),
          status: 'draft',
          tags: 'AI生成'
        })

        if (project && project.id) {
          localStorage.setItem('currentProjectId', project.id)
        } else {
          localStorage.removeItem('currentProjectId')
        }
      } catch {
        // 项目创建失败时降级：清除旧ID，仍可在DesignSpace中使用
        localStorage.removeItem('currentProjectId')
      }

      // 设置工作模式并跳转到DesignSpace
      setIsInWorkMode(true)
      navigate('/design-space')

      message.success('页面生成完成！正在跳转到编辑器...')
      
    } catch (error) {
      console.error('生成页面失败:', error)
      message.error('生成页面失败，请重试')
    } finally {
      setIsGenerating(false)
      setGenerationProgress('')
    }
  }

  // 处理试用按钮点击
  const handleTryOut = async () => {
    try {
      console.log('开始创建试用项目...')
      // 先在数据库中创建项目
      const project = await projectStore.createProject({
        name: '试用项目',
        description: '这是一个试用项目，包含CodeCanvas的欢迎页面',
        content: JSON.stringify(welcomeTemplate),
        status: 'draft',
        tags: '试用'
      })
      
      console.log('创建项目结果:', project)
      
      if (project && project.id) {
        // 保存项目ID和代码到localStorage
        localStorage.setItem('currentProjectId', project.id)
        localStorage.setItem('code', JSON.stringify(welcomeTemplate))
        setIsInWorkMode(true)
        navigate('/design-space')
      } else {
        // 项目创建返回了但没有ID，降级为临时模式
        console.warn('项目创建成功但未返回ID，使用临时模式')
        localStorage.setItem('code', JSON.stringify(welcomeTemplate))
        localStorage.removeItem('currentProjectId')
        setIsInWorkMode(true)
        navigate('/design-space')
        message.warning('试用模式：项目未保存到数据库')
      }
    } catch (error) {
      console.error('创建试用项目失败:', error)
      // 如果创建失败，仍然允许试用，但不保存到数据库
      localStorage.setItem('code', JSON.stringify(welcomeTemplate))
      localStorage.removeItem('currentProjectId')
      setIsInWorkMode(true)
      navigate('/design-space')
      message.warning('试用模式：项目未保存到数据库')
    }
  }

  // 处理创建空白项目按钮点击
  const handleCreateBlankProject = async () => {
    try {
      console.log('开始创建空白项目...')
      // 先在数据库中创建项目
      const project = await projectStore.createProject({
        name: '未命名项目',
        description: '一个空白项目',
        content: JSON.stringify(blankTemplate),
        status: 'draft',
        tags: ''
      })
      
      console.log('创建项目结果:', project)
      
      if (project && project.id) {
        // 保存项目ID和代码到localStorage
        localStorage.setItem('currentProjectId', project.id)
        localStorage.setItem('code', JSON.stringify(blankTemplate))
        setIsInWorkMode(true)
        navigate('/design-space')
      } else {
        // 项目创建返回了但没有ID，降级为临时模式
        console.warn('项目创建成功但未返回ID，使用临时模式')
        localStorage.setItem('code', JSON.stringify(blankTemplate))
        localStorage.removeItem('currentProjectId')
        setIsInWorkMode(true)
        navigate('/design-space')
        message.warning('临时模式：项目未保存到数据库')
      }
    } catch (error) {
      console.error('创建空白项目失败:', error)
      // 降级为临时模式，仍然允许用户使用
      localStorage.setItem('code', JSON.stringify(blankTemplate))
      localStorage.removeItem('currentProjectId')
      setIsInWorkMode(true)
      navigate('/design-space')
      message.warning('临时模式：项目未保存到数据库')
    }
  }
  
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <Title level={2} className={styles.title}>
          欢迎使用本平台！
        </Title>
        
        <div className={styles.buttonGroup}>
          <Button type="primary" size="large" onClick={handleTryOut}>
            我想先试用一下🤔
          </Button>
          <Button size="large" onClick={handleCreateBlankProject}>
            创建一个空白项目😉
          </Button>
        </div>
        <div className={styles.message}>
          <div className={styles.workSpace}>
            <div className={styles.msgButtons}>
              <div className={styles.quickOptionsContainer}>
                {Object.entries(quickOptions).map(([categoryKey, category]) => (
                  <div key={categoryKey} className={`${styles.categoryGroup} ${styles[categoryKey]}`}>
                    <div className={styles.categoryTitle}>{category.title}</div>
                    <div className={styles.categoryButtons}>
                      {category.options.map(option => (
                        <Button
                          key={option.value}
                          type={selectedStyles.includes(option.value) ? 'primary' : 'default'}
                          size="small"
                          onClick={() => handleQuickOptionClick(option.value, option.desc)}
                          className={styles.quickButton}
                          title={option.desc}
                        >
                          {option.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className={styles.uploadImage}>
              
              {uploadedImage.preview ? (
                // 显示预览图片
                <div className={styles.imagePreview}>
                  <Image
                    src={uploadedImage.preview}
                    alt="预览图片"
                    style={{ maxWidth: '100%', maxHeight: '200px' }}
                    preview={{
                      mask: '预览'
                    }}
                  />
                  <div className={styles.imageActions}>
                    <span className={styles.fileName}>
                      {uploadedImage.file?.name}
                    </span>
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={handleRemoveImage}
                      size="small"
                    >
                      删除
                    </Button>
                  </div>
                </div>
              ) : (
                // 显示上传区域
                <Dragger
                  name="file"
                  multiple={false}
                  beforeUpload={() => false} // 阻止自动上传
                  onChange={handleUpload}
                  accept="image/*"
                  className={styles.uploader}
                  showUploadList={false}
                >
                  <p className="ant-upload-drag-icon">
                    <InboxOutlined />
                  </p>
                  <p className="ant-upload-text">点击或拖拽图片到此区域上传</p>
                  <p className="ant-upload-hint">
                    支持单个文件上传，支持 JPG、PNG、GIF 等格式
                  </p>
                </Dragger>
              )}
            </div>
          </div>
          
          <div className={styles.projectsDescription}>
            <TextArea
              value={pageDescription}
              onChange={(e) => setPageDescription(e.target.value)}
              placeholder="请详细描述您想要创建的页面内容、布局、功能等..."
              rows={8}
              className={styles.textArea}
            />
            <div className={styles.descriptionFooter}>
              <span className={styles.charCount}>
                {pageDescription.length}/1000
              </span>
              <Button 
                type="primary" 
                size="large" 
                className={styles.generateButton}
                onClick={handleGeneratePage}
                loading={isGenerating}
                disabled={!pageDescription.trim()}
              >
                {isGenerating ? '正在生成中...' : '开始生成页面 🚀'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})

export default Home
