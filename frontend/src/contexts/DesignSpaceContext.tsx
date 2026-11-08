import React, { createContext, useContext, useState, ReactNode } from 'react'

// 样式变更追踪的数据类型
export type StyleChangesMap = Map<string, Record<string, string>>

// 代码数据类型
export interface CodeData {
  html: string
  css: string
  js: string
}

interface DesignSpaceContextType {
  mode: 'design' | 'code'
  setMode: (mode: 'design' | 'code') => Promise<void>
  isInWorkMode: boolean
  setIsInWorkMode: (isInWorkMode: boolean) => void
  // 代码状态管理
  code: CodeData
  setCode: (code: CodeData) => void
  refreshCode: () => void
  // 样式变更追踪相关
  styleChanges: StyleChangesMap
  addStyleChange: (elementPath: string, property: string, value: string, originalValue?: string) => void
  removeStyleChange: (elementPath: string, property: string) => void
  clearStyleChanges: () => void
  hasUnsavedChanges: () => boolean
  syncStylesToHTML: () => Promise<void>
  updateElementContent: (elementPath: string, type: 'text' | 'image', value: string) => Promise<void>
  replaceElementWithImg: (elementPath: string, src: string) => Promise<boolean>
}

const DesignSpaceContext = createContext<DesignSpaceContextType | undefined>(undefined)

interface DesignSpaceProviderProps {
  children: ReactNode
}

export const DesignSpaceProvider: React.FC<DesignSpaceProviderProps> = ({ children }) => {
  const [mode, setMode] = useState<'design' | 'code'>('design')
  const [isInWorkMode, setIsInWorkMode] = useState(false)
  const [styleChanges, setStyleChanges] = useState<StyleChangesMap>(new Map())
  const [code, setCodeState] = useState<CodeData>({ html: '', css: '', js: '' })

  // 从localStorage加载代码
  const loadCodeFromStorage = () => {
    const savedCode = localStorage.getItem('code')
    if (savedCode) {
      try {
        const parsedCode = JSON.parse(savedCode)
        setCodeState(parsedCode)
        return parsedCode
      } catch (error) {
        console.error('解析保存的代码失败:', error)
      }
    }
    return null
  }

  // 设置代码并保存到localStorage
  const setCode = (newCode: CodeData) => {
    setCodeState(newCode)
    localStorage.setItem('code', JSON.stringify(newCode))
  }

  // 刷新代码（从localStorage重新读取）
  const refreshCode = () => {
    console.log('刷新代码状态...')
    loadCodeFromStorage()
  }

  // 添加样式变更
  const addStyleChange = (elementPath: string, property: string, value: string, originalValue?: string) => {
    setStyleChanges(prev => {
      const newMap = new Map(prev)
      const elementStyles = newMap.get(elementPath) || {}
      
      // 如果新值与原始值相同，则移除该属性的变更记录
      if (originalValue && value === originalValue) {
        delete elementStyles[property]
        // 如果该元素没有任何样式变更了，移除整个元素的记录
        if (Object.keys(elementStyles).length === 0) {
          newMap.delete(elementPath)
        } else {
          newMap.set(elementPath, elementStyles)
        }
      } else {
        // 记录样式变更
        elementStyles[property] = value
        newMap.set(elementPath, elementStyles)
      }
      
      return newMap
    })
  }

  // 移除特定样式变更
  const removeStyleChange = (elementPath: string, property: string) => {
    setStyleChanges(prev => {
      const newMap = new Map(prev)
      const elementStyles = newMap.get(elementPath)
      
      if (elementStyles) {
        delete elementStyles[property]
        // 如果该元素没有任何样式变更了，移除整个元素的记录
        if (Object.keys(elementStyles).length === 0) {
          newMap.delete(elementPath)
        } else {
          newMap.set(elementPath, elementStyles)
        }
      }
      
      return newMap
    })
  }

  // 清空所有样式变更
  const clearStyleChanges = () => {
    setStyleChanges(new Map())
  }

  // 检查是否有未保存的变更
  const hasUnsavedChanges = () => {
    return styleChanges.size > 0
  }

  // 将样式变更同步到localStorage中的HTML代码
  const syncStylesToHTML = async () => {
    console.log('开始同步样式，当前样式变更数量:', styleChanges.size)
    console.log('样式变更详情:', Array.from(styleChanges.entries()))
    
    if (styleChanges.size === 0) {
      console.log('没有样式变更，跳过同步')
      return
    }

    try {
      // 获取当前的代码
      const savedCode = localStorage.getItem('code')
      if (!savedCode) {
        console.log('localStorage中没有找到code数据')
        return
      }

      const codeData = JSON.parse(savedCode)
      let htmlContent = codeData.html

      // 解析HTML并应用样式变更
      const parser = new DOMParser()
      const doc = parser.parseFromString(htmlContent, 'text/html')

      console.log('解析HTML文档成功')

      // 遍历所有样式变更
      for (const [elementPath, styles] of styleChanges) {
        console.log(`处理元素路径: ${elementPath}`)
        console.log(`样式变更:`, styles)
        
        try {
          // 根据路径查找元素
          const element = findElementByPath(doc, elementPath)
          console.log(`找到元素:`, element?.tagName, element?.className, element?.id)
          
          if (element && element instanceof HTMLElement) {
            console.log(`应用样式到元素: ${element.tagName}`)
            // 应用样式变更
            Object.entries(styles).forEach(([property, value]) => {
              console.log(`设置样式: ${property} = ${value}`)
              element.style.setProperty(property, value)
            })
            console.log(`元素最终style属性:`, element.getAttribute('style'))
          } else {
            console.warn(`未找到元素或元素不是HTMLElement: ${elementPath}`)
          }
        } catch (error) {
          console.warn(`无法找到元素路径: ${elementPath}`, error)
        }
      }

      // 将修改后的HTML保存回localStorage
      const updatedCode = {
        ...codeData,
        html: doc.documentElement.outerHTML
      }
      
      console.log('更新后的HTML长度:', updatedCode.html.length)
      localStorage.setItem('code', JSON.stringify(updatedCode))

      // 清空样式变更记录
      clearStyleChanges()

      console.log('样式已同步到HTML代码')
    } catch (error) {
      console.error('同步样式到HTML时出错:', error)
    }
  }

  // 根据元素路径查找DOM元素的辅助函数
  const findElementByPath = (doc: Document, path: string): Element | null => {
    try {
      // 解析路径，例如: "html > body > div > div:nth-child(1)"
      const selectors = path.split(' > ').map(s => s.trim())
      let currentElement: Element | null = doc.documentElement

      for (let i = 1; i < selectors.length; i++) { // 跳过html，从body开始
        if (!currentElement) return null

        const selector = selectors[i]
        
        // 处理nth-child选择器
        if (selector.includes(':nth-child(')) {
          const [selectorPart, nthPart] = selector.split(':nth-child(')
          const nthIndex = parseInt(nthPart.replace(')', '')) // CSS nth-child是1-based
          
          // 从选择器部分提取标签名（去掉类名和ID）
          let tagName = selectorPart
          if (tagName.includes('.')) {
            tagName = tagName.split('.')[0]
          }
          if (tagName.includes('#')) {
            tagName = tagName.split('#')[0]
          }
          
          console.log(`解析nth-child选择器: ${selector} -> 标签名: ${tagName}, 索引: ${nthIndex}`)
          
          const children: Element[] = Array.from(currentElement.children).filter((child: Element) => 
            child.tagName.toLowerCase() === tagName.toLowerCase()
          )
          
          // CSS nth-child是1-based，所以需要减1来访问数组
          currentElement = children[nthIndex - 1] || null
          console.log(`nth-child查找: ${tagName}:nth-child(${nthIndex}), 找到${children.length}个同类元素, 选择索引${nthIndex-1}:`, currentElement?.tagName)
          
          // 如果找到了元素，还需要验证类名和ID是否匹配
          if (currentElement && selectorPart.includes('.')) {
            const expectedClass = selectorPart.split('.')[1].split('#')[0] // 处理可能的ID
            const elementClasses = currentElement.className.split(' ')
            if (!elementClasses.includes(expectedClass)) {
              console.log(`类名不匹配，期望: ${expectedClass}, 实际: ${currentElement.className}`)
              currentElement = null
            }
          }
          
          if (currentElement && selectorPart.includes('#')) {
            const expectedId = selectorPart.split('#')[1]
            if (currentElement.id !== expectedId) {
              console.log(`ID不匹配，期望: ${expectedId}, 实际: ${currentElement.id}`)
              currentElement = null
            }
          }
        } else if (selector.includes('#')) {
          // 处理ID选择器
          const id = selector.split('#')[1]
          currentElement = currentElement.querySelector(`#${id}`)
        } else if (selector.includes('.')) {
          // 处理类选择器
          const className = selector.split('.')[1]
          currentElement = currentElement.querySelector(`.${className}`)
        } else {
          // 处理标签选择器
          currentElement = currentElement.querySelector(selector)
        }
      }

      return currentElement
    } catch (error) {
      console.error('解析元素路径时出错:', error)
      return null
    }
  }

  // 将元素替换为<img>，保留class/id/style属性
  const replaceElementWithImg = async (elementPath: string, src: string): Promise<boolean> => {
    try {
      const savedCode = localStorage.getItem('code')
      if (!savedCode) return false

      const codeData = JSON.parse(savedCode)
      const parser = new DOMParser()
      const doc = parser.parseFromString(codeData.html, 'text/html')

      const element = findElementByPath(doc, elementPath)
      if (!element) {
        console.warn('replaceElementWithImg: 未找到元素', elementPath)
        return false
      }

      const img = doc.createElement('img')
      img.setAttribute('src', src)
      if (element.id) img.id = element.id
      if (element.className) img.className = element.className
      const inlineStyle = (element as HTMLElement).getAttribute('style')
      if (inlineStyle) img.setAttribute('style', inlineStyle)
      const previewId = element.getAttribute('data-preview-element-id')
      if (previewId) img.setAttribute('data-preview-element-id', previewId)
      img.style.maxWidth = '100%'

      element.parentNode?.replaceChild(img, element)

      const updatedCode = { ...codeData, html: doc.documentElement.outerHTML }
      localStorage.setItem('code', JSON.stringify(updatedCode))
      setCode(updatedCode)
      return true
    } catch (error) {
      console.error('替换元素为img时出错:', error)
      return false
    }
  }

  // 更新元素内容（文字或图片src）并同步到localStorage
  const updateElementContent = async (elementPath: string, type: 'text' | 'image', value: string) => {
    try {
      const savedCode = localStorage.getItem('code')
      if (!savedCode) return

      const codeData = JSON.parse(savedCode)
      const parser = new DOMParser()
      const doc = parser.parseFromString(codeData.html, 'text/html')

      const element = findElementByPath(doc, elementPath)
      if (!element) {
        console.warn('updateElementContent: 未找到元素', elementPath)
        return
      }

      if (type === 'text') {
        element.textContent = value
      } else if (type === 'image' && element.tagName.toUpperCase() === 'IMG') {
        element.setAttribute('src', value)
      }

      const updatedCode = { ...codeData, html: doc.documentElement.outerHTML }
      localStorage.setItem('code', JSON.stringify(updatedCode))
      setCode(updatedCode)
    } catch (error) {
      console.error('更新元素内容时出错:', error)
    }
  }

  // 包装setMode函数，在切换到代码模式时先同步样式
  const handleModeChange = async (newMode: 'design' | 'code') => {
    if (newMode === 'code' && mode === 'design') {
      // 从可视化模式切换到代码模式时，先同步样式
      await syncStylesToHTML()
    }
    setMode(newMode)
  }

  return (
    <DesignSpaceContext.Provider value={{ 
      mode, 
      setMode: handleModeChange, 
      isInWorkMode, 
      setIsInWorkMode,
      code,
      setCode,
      refreshCode,
      styleChanges,
      addStyleChange,
      removeStyleChange,
      clearStyleChanges,
      hasUnsavedChanges,
      syncStylesToHTML,
      updateElementContent,
      replaceElementWithImg
    }}>
      {children}
    </DesignSpaceContext.Provider>
  )
}

export const useDesignSpace = () => {
  const context = useContext(DesignSpaceContext)
  if (context === undefined) {
    throw new Error('useDesignSpace must be used within a DesignSpaceProvider')
  }
  return context
}

export default DesignSpaceContext
