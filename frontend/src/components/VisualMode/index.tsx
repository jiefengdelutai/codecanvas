import React, { useState, useRef, useEffect } from 'react'
import Preview, { SelectedElementInfo, PreviewRef } from '../Preview'
import StyleDrawer from '../StyleDrawer'
import { useDesignSpace } from '../../contexts/DesignSpaceContext'
import styles from './index.module.css'

interface VisualModeProps {
  code: {
    html: string
    css: string
    js: string
  }
  isEditMode: boolean
}

const VisualMode: React.FC<VisualModeProps> = ({ code, isEditMode }) => {
  const [selectedElement, setSelectedElement] = useState<SelectedElementInfo | null>(null)
  const [drawerVisible, setDrawerVisible] = useState(true) // 默认展开抽屉
  const previewRef = useRef<PreviewRef>(null)
  
  // 获取样式同步功能
  const { syncStylesToHTML } = useDesignSpace()

  // 监听编辑模式变化
  useEffect(() => {
    if (isEditMode) {
      // 进入编辑模式时，展开抽屉
      setDrawerVisible(true)
    } else {
      // 退出编辑模式时，同步样式到HTML
      syncStylesToHTML()
      
      setDrawerVisible(false)
      setSelectedElement(null)
      // 清除选中元素的高亮
      if (previewRef.current) {
        previewRef.current.clearSelectedHighlight()
      }
    }
  }, [isEditMode, syncStylesToHTML])

  const handleElementSelect = (elementInfo: SelectedElementInfo) => {
    if (isEditMode) {
      setSelectedElement(elementInfo)
      setDrawerVisible(true)
    }
  }

  const handleDrawerClose = () => {
    setDrawerVisible(false)
    setSelectedElement(null)
    // 清除选中元素的高亮
    if (previewRef.current) {
      previewRef.current.clearSelectedHighlight()
    }
  }

  const handleStyleChange = (styles: Record<string, string>) => {
    console.log('样式变更:', styles)
    // 通过Preview组件的ref调用updateElementStyle方法
    if (selectedElement && previewRef.current) {
      previewRef.current.updateElementStyle(selectedElement.elementId, styles)
    }
  }

  const handleContentChange = (contentType: 'text' | 'src', value: string) => {
    if (selectedElement && previewRef.current) {
      previewRef.current.updateElementContent(selectedElement.elementId, contentType, value)
    }
  }

  return (
    <div className={styles.visualMode}>
      <div className={`${styles.content} ${drawerVisible ? styles.drawerOpen : ''}`}>
        <Preview
          ref={previewRef}
          code={code}
          isEditMode={isEditMode}
          onElementSelect={handleElementSelect}
          drawerVisible={drawerVisible}
        />
      </div>
      
      <StyleDrawer
        visible={drawerVisible}
        onClose={handleDrawerClose}
        selectedElement={selectedElement}
        onStyleChange={handleStyleChange}
        onContentChange={handleContentChange}
      />
    </div>
  )
}

export default VisualMode
