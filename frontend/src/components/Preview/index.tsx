import { useRef, useEffect, useImperativeHandle, forwardRef } from 'react'
import styles from './index.module.css'

export interface SelectedElementInfo {
  tagName: string
  className: string
  id: string
  innerHTML: string
  computedStyles: Record<string, string>
  element: HTMLElement | null
  elementId: string
  elementPath: string
  textContent?: string
  imageSrc?: string | null
}

interface PreviewProps {
  code: {
    html: string
    css: string
    js: string
  }
  isEditMode?: boolean
  onElementSelect?: (elementInfo: SelectedElementInfo) => void
  onStyleUpdate?: (elementId: string, styles: Record<string, string>) => void
  drawerVisible?: boolean
}

export interface PreviewRef {
  updateElementStyle: (elementId: string, styles: Record<string, string>) => void
  clearSelectedHighlight: () => void
  updateElementContent: (elementId: string, contentType: 'text' | 'src', value: string) => void
}

const Preview = forwardRef<PreviewRef, PreviewProps>(({ code, isEditMode = false, onElementSelect, drawerVisible = false }, ref) => {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    if (iframeRef.current) {
      const iframe = iframeRef.current
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document

      if (iframeDoc) {
        // 获取AI生成的完整HTML
        let fullHtml = code.html.trim()
        
        // 检查是否是完整的HTML文档
        if (fullHtml.startsWith('<!DOCTYPE html>') || fullHtml.startsWith('<html')) {
          // 如果是完整的HTML文档，需要注入CSS和JS以及编辑模式功能
          
          // 准备要注入的CSS
          const additionalCSS = `
            /* 画布样式：保持页面原始布局 */
            html, body {
              margin: 0;
              padding: 0;
              background: transparent;
              min-height: 100%;
              box-sizing: border-box;
            }
            
            /* 用户的CSS样式 */
            ${code.css}
            
            ${isEditMode ? `
              * {
                cursor: pointer !important;
              }
              #preview-hover-overlay {
                position: fixed;
                pointer-events: none;
                z-index: 2147483646;
                border: 3px dashed rgba(255, 77, 79, 0.7);
                display: none;
                box-sizing: border-box;
              }
              #preview-selection-overlay {
                position: fixed;
                pointer-events: none;
                z-index: 2147483647;
                border: 3px solid #ff4d4f;
                box-shadow: 0 0 0 2px rgba(255, 77, 79, 0.2), inset 0 0 0 1px rgba(255, 77, 79, 0.1);
                display: none;
                box-sizing: border-box;
              }
            ` : ''}
          `
          
          // 准备要注入的JS
          const additionalJS = `
            ${code.js}
            
            ${isEditMode ? `
                // 为文档添加唯一标识符
                if (typeof window.elementIdCounter === 'undefined') {
                  window.elementIdCounter = 0;
                }
                
                // 生成元素路径的函数
                function getElementPath(element) {
                  const path = [];
                  let current = element;
                  
                  while (current && current !== document.body && current !== document.documentElement) {
                    let selector = current.tagName.toLowerCase();
                    
                    // 如果有id，使用id选择器（安全处理SVG元素）
                    let currentId = '';
                    if (current.id) {
                      if (typeof current.id === 'string') {
                        currentId = current.id;
                      } else if (current.id.baseVal !== undefined) {
                        currentId = current.id.baseVal;
                      } else {
                        currentId = current.id.toString();
                      }
                    }
                    if (currentId) {
                      selector += '#' + currentId;
                      path.unshift(selector);
                      break; // id是唯一的，可以停止
                    }
                    
                    // 如果有class，添加第一个非临时的class（安全处理SVG元素）
                    let currentClassName = '';
                    if (current.className) {
                      if (typeof current.className === 'string') {
                        currentClassName = current.className;
                      } else if (current.className.baseVal !== undefined) {
                        currentClassName = current.className.baseVal;
                      } else {
                        currentClassName = current.className.toString();
                      }
                    }
                    if (currentClassName) {
                      // 过滤掉临时的选中状态类名
                      const classes = currentClassName.split(' ').filter(cls => 
                        cls && cls !== 'preview-selected-element' && cls !== 'preview-hover-element'
                      );
                      if (classes.length > 0) {
                        selector += '.' + classes[0];
                      }
                    }
                    
                    // 计算同级元素中的位置
                    if (current.parentElement) {
                      const siblings = Array.from(current.parentElement.children);
                      const sameTagSiblings = siblings.filter(sibling => 
                        sibling.tagName.toLowerCase() === current.tagName.toLowerCase()
                      );
                      
                      if (sameTagSiblings.length > 1) {
                        const index = sameTagSiblings.indexOf(current) + 1;
                        selector += ':nth-child(' + index + ')';
                      }
                    }
                    
                    path.unshift(selector);
                    current = current.parentElement;
                  }
                  
                  // 添加body
                  if (current === document.body) {
                    path.unshift('body');
                  }
                  
                  // 添加html
                  path.unshift('html');
                  
                  return path.join(' > ');
                }
                
                // 移除之前的事件监听器（如果存在）
                if (window.previewClickHandler) {
                  document.removeEventListener('click', window.previewClickHandler, true);
                }
                
                // 创建悬停覆盖层
                if (!document.getElementById('preview-hover-overlay')) {
                  var hoverOverlay = document.createElement('div');
                  hoverOverlay.id = 'preview-hover-overlay';
                  document.body.appendChild(hoverOverlay);
                }
                
                // 创建选中覆盖层（最高层，不干扰元素交互）
                if (!document.getElementById('preview-selection-overlay')) {
                  var selOverlay = document.createElement('div');
                  selOverlay.id = 'preview-selection-overlay';
                  document.body.appendChild(selOverlay);
                }
                
                // 更新覆盖层位置的函数
                window.previewUpdateOverlay = function(element) {
                  var overlay = document.getElementById('preview-selection-overlay');
                  if (!overlay || !element) return;
                  var rect = element.getBoundingClientRect();
                  overlay.style.left = rect.left + 'px';
                  overlay.style.top = rect.top + 'px';
                  overlay.style.width = rect.width + 'px';
                  overlay.style.height = rect.height + 'px';
                  overlay.style.display = 'block';
                };
                
                // 悬停覆盖层跟随鼠标目标元素
                document.addEventListener('mouseover', function(e) {
                  var hov = document.getElementById('preview-hover-overlay');
                  if (!hov) return;
                  var target = e.target;
                  if (target && target !== document.documentElement && target !== document.body
                      && target.id !== 'preview-hover-overlay' && target.id !== 'preview-selection-overlay') {
                    var rect = target.getBoundingClientRect();
                    hov.style.left = rect.left + 'px';
                    hov.style.top = rect.top + 'px';
                    hov.style.width = rect.width + 'px';
                    hov.style.height = rect.height + 'px';
                    hov.style.display = 'block';
                  }
                }, true);
                
                document.addEventListener('mouseout', function(e) {
                  if (!e.relatedTarget || e.relatedTarget === document.documentElement) {
                    var hov = document.getElementById('preview-hover-overlay');
                    if (hov) hov.style.display = 'none';
                  }
                }, true);
                
                // 滚动时同步覆盖层位置
                document.addEventListener('scroll', function() {
                  if (window.previewCurrentSelected) {
                    window.previewUpdateOverlay(window.previewCurrentSelected);
                  }
                }, true);
                
                // 定义点击处理函数（使用捕获阶段，阻止所有原始事件）
                window.previewClickHandler = function(e) {
                  e.preventDefault();
                  e.stopPropagation();
                  e.stopImmediatePropagation();
                  
                  const target = e.target;
                  
                  // 记录当前选中元素并更新覆盖层
                  window.previewCurrentSelected = target;
                  window.previewUpdateOverlay(target);
                  
                  // 为元素添加唯一标识符（如果没有的话）
                  if (!target.dataset.previewElementId) {
                    target.dataset.previewElementId = 'preview-element-' + (++window.elementIdCounter);
                  }
                  
                  // 获取计算样式
                  const computedStyles = window.getComputedStyle(target);
                  const styleObj = {};
                  
                  // 获取常用的CSS属性
                  const importantProps = [
                    'display', 'position', 'width', 'height', 'margin', 'padding',
                    'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
                    'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
                    'background-color', 'color', 'font-size', 'font-weight', 'font-family',
                    'text-align', 'line-height', 'border-width', 'border-style', 'border-color',
                    'border-radius', 'opacity', 'z-index', 'top', 'right', 'bottom', 'left',
                    'flex-direction', 'justify-content', 'align-items', 'flex-wrap',
                    'text-decoration', 'text-transform', 'letter-spacing', 'word-spacing'
                  ];
                  
                  importantProps.forEach(prop => {
                    styleObj[prop] = computedStyles.getPropertyValue(prop);
                  });
                  
                  // 生成元素路径
                  const elementPath = getElementPath(target);
                  
                  // 安全地获取className，处理SVG元素的SVGAnimatedString
                  let className = '';
                  if (target.className) {
                    if (typeof target.className === 'string') {
                      className = target.className;
                    } else if (target.className.baseVal !== undefined) {
                      // SVG元素的className是SVGAnimatedString对象
                      className = target.className.baseVal;
                    } else {
                      className = target.className.toString();
                    }
                  }
                  
                  // 安全地获取id，处理SVG元素
                  let elementId = '';
                  if (target.id) {
                    if (typeof target.id === 'string') {
                      elementId = target.id;
                    } else if (target.id.baseVal !== undefined) {
                      // SVG元素的id可能也是SVGAnimatedString对象
                      elementId = target.id.baseVal;
                    } else {
                      elementId = target.id.toString();
                    }
                  }
                  
                  // 向父窗口发送选中的元素信息
                  window.parent.postMessage({
                    type: 'elementSelected',
                    elementInfo: {
                      tagName: target.tagName,
                      className: className,
                      id: elementId,
                      innerHTML: target.innerHTML,
                      computedStyles: styleObj,
                      elementId: target.dataset.previewElementId,
                      elementPath: elementPath,
                      textContent: target.textContent ? target.textContent.trim() : '',
                      imageSrc: target.tagName === 'IMG' ? target.getAttribute('src') : null
                    }
                  }, '*');
                };
                
                // 绑定点击事件监听器（捕获阶段，先于任何元素事件触发）
                document.addEventListener('click', window.previewClickHandler, true);
                
                // 移除之前的message监听器（如果存在）
                if (window.previewMessageHandler) {
                  window.removeEventListener('message', window.previewMessageHandler);
                }
                
                // 定义message处理函数
                window.previewMessageHandler = function(e) {
                  if (e.data.type === 'updateElementStyle') {
                    const { elementId, styles } = e.data;
                    const element = document.querySelector('[data-preview-element-id="' + elementId + '"]');
                    if (element) {
                      Object.keys(styles).forEach(property => {
                        element.style[property] = styles[property];
                      });
                      // 样式变化可能改变元素尺寸，重新定位覆盖层
                      setTimeout(function() {
                        if (window.previewCurrentSelected === element && window.previewUpdateOverlay) {
                          window.previewUpdateOverlay(element);
                        }
                      }, 10);
                    }
                  } else if (e.data.type === 'clearSelectedHighlight') {
                    var overlay = document.getElementById('preview-selection-overlay');
                    if (overlay) { overlay.style.display = 'none'; }
                    window.previewCurrentSelected = null;
                  } else if (e.data.type === 'updateContent') {
                    var el = document.querySelector('[data-preview-element-id="' + e.data.elementId + '"]');
                    if (el) {
                      if (e.data.contentType === 'text') {
                        el.textContent = e.data.value;
                      } else if (e.data.contentType === 'src') {
                        el.setAttribute('src', e.data.value);
                      }
                    }
                  }
                };
                
                // 绑定message事件监听器
                window.addEventListener('message', window.previewMessageHandler);
              ` : ''}
          `
          
          // 将CSS注入到HTML的<head>中
          if (fullHtml.includes('</head>')) {
            fullHtml = fullHtml.replace('</head>', `<style>${additionalCSS}</style></head>`)
          } else if (fullHtml.includes('<head>')) {
            fullHtml = fullHtml.replace('<head>', `<head><style>${additionalCSS}</style>`)
          }
          
          // 将JS注入到HTML的<body>结束前
          if (fullHtml.includes('</body>')) {
            fullHtml = fullHtml.replace('</body>', `<script>${additionalJS}</script></body>`)
          } else {
            fullHtml += `<script>${additionalJS}</script>`
          }
          
        } else {
          // 如果不是完整的HTML文档，使用原来的包装方式
          fullHtml = `
            <!DOCTYPE html>
            <html lang="zh-CN">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Preview</title>
              <style>
                /* 画布样式：保持页面原始布局 */
                html, body {
                  margin: 0;
                  padding: 0;
                  background: transparent;
                  min-height: 100%;
                  box-sizing: border-box;
                }
                
                /* 用户的CSS样式 */
                ${code.css}
                
                ${isEditMode ? `
                  * {
                    cursor: pointer !important;
                  }
                  #preview-hover-overlay {
                    position: fixed;
                    pointer-events: none;
                    z-index: 2147483646;
                    border: 3px dashed rgba(255, 77, 79, 0.7);
                    display: none;
                    box-sizing: border-box;
                  }
                  #preview-selection-overlay {
                    position: fixed;
                    pointer-events: none;
                    z-index: 2147483647;
                    border: 3px solid #ff4d4f;
                    box-shadow: 0 0 0 2px rgba(255, 77, 79, 0.2), inset 0 0 0 1px rgba(255, 77, 79, 0.1);
                    display: none;
                    box-sizing: border-box;
                  }
                ` : ''}
              </style>
            </head>
            <body>
              ${code.html}
              <script>
                ${code.js}
                
                ${isEditMode ? `
                  // 编辑模式脚本（与上面相同）
                ` : ''}
              </script>
            </body>
            </html>
          `
        }

        iframeDoc.open()
        iframeDoc.write(fullHtml)
        iframeDoc.close()
      }
    }
  }, [code, isEditMode])

  // 监听抽屉状态变化，通知iframe重新缩放
  useEffect(() => {
    if (iframeRef.current?.contentWindow) {
      // 延迟执行，等待CSS动画完成
      setTimeout(() => {
        iframeRef.current?.contentWindow?.dispatchEvent(new Event('resize'))
      }, 350) // 比CSS动画时间稍长
    }
  }, [drawerVisible])

  // 监听来自iframe的消息
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'elementSelected' && onElementSelect) {
        const { elementInfo } = event.data
        console.log('Element selected:', elementInfo)
        
        // 创建完整的SelectedElementInfo对象
        const selectedElementInfo: SelectedElementInfo = {
          tagName: elementInfo.tagName,
          className: elementInfo.className,
          id: elementInfo.id,
          innerHTML: elementInfo.innerHTML,
          computedStyles: elementInfo.computedStyles,
          element: null as any, // iframe中的元素无法直接传递，使用elementId标识
          elementId: elementInfo.elementId,
          elementPath: elementInfo.elementPath,
          textContent: elementInfo.textContent,
          imageSrc: elementInfo.imageSrc
        }
        
        onElementSelect(selectedElementInfo)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [onElementSelect])

  // 添加向iframe发送样式更新指令的方法
  const updateElementStyle = (elementId: string, styles: Record<string, string>) => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: 'updateElementStyle',
        elementId,
        styles
      }, '*')
    }
  }

  // 添加清除选中高亮的方法
  const clearSelectedHighlight = () => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: 'clearSelectedHighlight'
      }, '*')
    }
  }

  // 实时更新iframe内元素内容（不刷新iframe）
  const updateElementContent = (elementId: string, contentType: 'text' | 'src', value: string) => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: 'updateContent',
        elementId,
        contentType,
        value
      }, '*')
    }
  }

  // 使用useImperativeHandle暴露方法给父组件
  useImperativeHandle(ref, () => ({
    updateElementStyle,
    clearSelectedHighlight,
    updateElementContent
  }), [])

  return (
    <div className={styles.preview}>
      <div className={styles.previewContent}>
        <iframe
          ref={iframeRef}
          className={styles.iframe}
          title="Preview"
          sandbox="allow-scripts allow-same-origin"
        />
      </div>
    </div>
  )
})

Preview.displayName = 'Preview'

export default Preview