import React, { useState, useRef, useCallback, useEffect } from 'react'
import Editor from '@monaco-editor/react'
import { 
  FileOutlined, 
  SettingOutlined,
  LeftOutlined,
  RightOutlined,
  Html5Outlined,
  FileTextOutlined
} from '@ant-design/icons'
import { Slider, Radio } from 'antd'
import styles from './index.module.css'

interface CodeModeProps {
  code: {
    html: string
    css: string
    js: string
  }
  onCodeChange: (code: { html: string; css: string; js: string }) => void
}

type ActivePanel = 'files' | 'settings'
type EditorTheme = 'vs' | 'vs-dark'

const CodeMode: React.FC<CodeModeProps> = ({ code, onCodeChange }) => {
  const [activeTab, setActiveTab] = useState<'html' | 'css' | 'js'>('html')
  const [activePanel, setActivePanel] = useState<ActivePanel>('files')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [editorTheme, setEditorTheme] = useState<EditorTheme>('vs')
  const [fontSize, setFontSize] = useState(14)
  const [previewKey, setPreviewKey] = useState(0) // 用于强制刷新iframe
  
  // 拖拽调整宽度相关状态
  const [editorWidth, setEditorWidth] = useState(70) // 编辑器宽度百分比
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // 处理拖拽开始
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  // 处理拖拽移动
  const handleDragMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return
    
    const container = containerRef.current
    const containerRect = container.getBoundingClientRect()
    // 计算侧边栏和活动栏的宽度
    const sidebarWidth = sidebarCollapsed ? 0 : 200
    const activityBarWidth = 48
    const availableWidth = containerRect.width - activityBarWidth - sidebarWidth
    
    // 计算鼠标相对于可用区域的位置
    const mouseX = e.clientX - containerRect.left - activityBarWidth - sidebarWidth
    const percentage = (mouseX / availableWidth) * 100
    
    // 限制范围在30%到85%之间
    const clampedPercentage = Math.max(30, Math.min(85, percentage))
    setEditorWidth(clampedPercentage)
  }, [isDragging, sidebarCollapsed])

  // 处理拖拽结束
  const handleDragEnd = useCallback(() => {
    setIsDragging(false)
  }, [])

  // 防抖处理代码变更
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout>>()
  
  const handleCodeChange = (type: 'html' | 'css' | 'js', value: string | undefined) => {
    const newCode = {
      ...code,
      [type]: value || ''
    }
    
    // 立即更新父组件状态
    onCodeChange(newCode)
    
    // 防抖更新预览
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }
    
    debounceTimeoutRef.current = setTimeout(() => {
      setPreviewKey(prev => prev + 1) // 强制刷新iframe
    }, 300) // 300ms防抖
  }
  
  // 清理防抖定时器
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [])

  const handlePanelClick = (panel: ActivePanel) => {
    if (sidebarCollapsed) {
      setSidebarCollapsed(false)
      setActivePanel(panel)
    } else if (activePanel === panel) {
      // 点击当前激活的面板，不做任何操作
    } else {
      setActivePanel(panel)
    }
  }

  const getLanguage = (tab: 'html' | 'css' | 'js') => {
    const languageMap = {
      html: 'html',
      css: 'css',
      js: 'javascript'
    }
    return languageMap[tab]
  }

  const getFileIcon = (type: 'html' | 'css' | 'js') => {
    switch (type) {
      case 'html':
        return <Html5Outlined style={{ color: '#e44d26' }} />
      case 'css':
        return <FileTextOutlined style={{ color: '#264de4' }} />
      case 'js':
        return <FileTextOutlined style={{ color: '#f7df1e' }} />
    }
  }

  const renderSidebarContent = () => {
    switch (activePanel) {
      case 'files':
        return (
          <div className={styles.panelContent}>
            <div className={styles.panelTitle}>文件管理</div>
            <div className={styles.fileList}>
              <div 
                className={`${styles.fileItem} ${activeTab === 'html' ? styles.activeFile : ''}`}
                onClick={() => setActiveTab('html')}
              >
                {getFileIcon('html')}
                <span>index.html</span>
              </div>
              <div 
                className={`${styles.fileItem} ${activeTab === 'css' ? styles.activeFile : ''}`}
                onClick={() => setActiveTab('css')}
              >
                {getFileIcon('css')}
                <span>style.css</span>
              </div>
              <div 
                className={`${styles.fileItem} ${activeTab === 'js' ? styles.activeFile : ''}`}
                onClick={() => setActiveTab('js')}
              >
                {getFileIcon('js')}
                <span>script.js</span>
              </div>
            </div>
          </div>
        )
      case 'settings':
        return (
          <div className={styles.panelContent}>
            <div className={styles.panelTitle}>设置</div>
            <div className={styles.settingItem}>
              <div className={styles.settingLabel}>编辑器主题</div>
              <Radio.Group 
                value={editorTheme} 
                onChange={(e) => setEditorTheme(e.target.value)}
                className={styles.themeRadio}
              >
                <Radio.Button value="vs">Light</Radio.Button>
                <Radio.Button value="vs-dark">Dark</Radio.Button>
              </Radio.Group>
            </div>
            <div className={styles.settingItem}>
              <div className={styles.settingLabel}>字体大小: {fontSize}px</div>
              <Slider
                min={12}
                max={24}
                value={fontSize}
                onChange={(value) => setFontSize(value)}
                className={styles.fontSlider}
              />
            </div>
          </div>
        )
    }
  }

  return (
    <div 
      ref={containerRef}
      className={`${styles.codeMode} ${editorTheme === 'vs-dark' ? styles.darkMode : ''} ${isDragging ? styles.dragging : ''}`}
      onMouseMove={handleDragMove}
      onMouseUp={handleDragEnd}
      onMouseLeave={handleDragEnd}
    >
      {/* 活动栏 */}
      <div className={styles.activityBar}>
        <div className={styles.activityIcons}>
          <div 
            className={`${styles.activityIcon} ${activePanel === 'files' && !sidebarCollapsed ? styles.activeIcon : ''}`}
            onClick={() => handlePanelClick('files')}
            title="文件管理"
          >
            <FileOutlined />
          </div>
          <div 
            className={`${styles.activityIcon} ${activePanel === 'settings' && !sidebarCollapsed ? styles.activeIcon : ''}`}
            onClick={() => handlePanelClick('settings')}
            title="设置"
          >
            <SettingOutlined />
          </div>
        </div>
        <div 
          className={styles.collapseBtn}
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          title={sidebarCollapsed ? '展开侧边栏' : '收起侧边栏'}
        >
          {sidebarCollapsed ? <RightOutlined /> : <LeftOutlined />}
        </div>
      </div>

      {/* 侧边栏 */}
      <div className={`${styles.sidebar} ${sidebarCollapsed ? styles.collapsed : ''}`}>
        {renderSidebarContent()}
      </div>

      {/* 编辑器区域 */}
      <div className={styles.editorArea} style={{ width: `${editorWidth}%` }}>
        <div className={styles.editorTabs}>
          <div 
            className={`${styles.tab} ${activeTab === 'html' ? styles.active : ''}`}
            onClick={() => setActiveTab('html')}
          >
            {getFileIcon('html')}
            <span>index.html</span>
          </div>
          <div 
            className={`${styles.tab} ${activeTab === 'css' ? styles.active : ''}`}
            onClick={() => setActiveTab('css')}
          >
            {getFileIcon('css')}
            <span>style.css</span>
          </div>
          <div 
            className={`${styles.tab} ${activeTab === 'js' ? styles.active : ''}`}
            onClick={() => setActiveTab('js')}
          >
            {getFileIcon('js')}
            <span>script.js</span>
          </div>
        </div>
        <div className={styles.editorContent}>
          <Editor
            height="100%"
            language={getLanguage(activeTab)}
            value={code[activeTab]}
            onChange={(value) => handleCodeChange(activeTab, value)}
            theme={editorTheme}
            options={{
              fontSize: fontSize,
              minimap: { enabled: true },
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              wordWrap: 'on',
              lineNumbers: 'on',
              folding: true,
              renderLineHighlight: 'all',
            }}
          />
        </div>
      </div>
      
      {/* 拖拽分隔条 */}
      <div 
        className={`${styles.resizer} ${isDragging ? styles.active : ''}`}
        onMouseDown={handleDragStart}
      />

      {/* 预览区域 */}
      <div className={styles.preview} style={{ width: `${100 - editorWidth}%` }}>
        <div className={styles.previewHeader}>
          <span>预览</span>
        </div>
        <div className={styles.previewContent}>
          <iframe
            key={previewKey} // 强制刷新iframe
            srcDoc={`
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>${code.css}</style>
              </head>
              <body>
                ${code.html}
                <script>
                  try {
                    ${code.js}
                  } catch (error) {
                    console.error('JavaScript执行错误:', error);
                  }
                <\/script>
              </body>
              </html>
            `}
            className={styles.previewFrame}
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      </div>
    </div>
  )
}

export default CodeMode
