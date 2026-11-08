import React, { useState, useEffect, useRef } from 'react'
import { Drawer, Tabs, Form, Input, Select, ColorPicker, Space, Button, Divider, InputNumber, message, Alert } from 'antd'
import { RobotOutlined, EditOutlined } from '@ant-design/icons'
import { useDesignSpace } from '../../contexts/DesignSpaceContext'
import { SelectedElementInfo } from '../Preview'
import ChatManager from '../ChatManager'
import styles from './index.module.css'

const { Option } = Select

interface StyleDrawerProps {
  visible: boolean
  onClose: () => void
  selectedElement?: SelectedElementInfo | null
  onStyleChange?: (styles: Record<string, string>) => void
  onContentChange?: (contentType: 'text' | 'src', value: string) => void
  width?: number
}

const StyleDrawer: React.FC<StyleDrawerProps> = ({
  visible,
  onClose,
  selectedElement,
  onStyleChange,
  onContentChange,
  width = 400
}) => {
  const [styleForm] = Form.useForm()
  const [currentStyles, setCurrentStyles] = useState<Record<string, string>>({})
  const [activeTab, setActiveTab] = useState<'style' | 'agent'>('style')
  const prevTabRef = useRef<'style' | 'agent'>('style')
  const [contentText, setContentText] = useState('')
  const [contentImageUrl, setContentImageUrl] = useState('')
  const [divToImgUrl, setDivToImgUrl] = useState('')
  const [isReplacing, setIsReplacing] = useState(false)

  // 获取样式变更追踪功能
  const { addStyleChange, syncStylesToHTML, updateElementContent, replaceElementWithImg } = useDesignSpace()

  // 监听tab切换，任何切换都同步样式
  useEffect(() => {
    // 只有当tab真正发生变化时才同步
    if (prevTabRef.current !== activeTab) {
      console.log(`Tab切换: ${prevTabRef.current} -> ${activeTab}，触发样式同步`)
      syncStylesToHTML()
      prevTabRef.current = activeTab
    }
  }, [activeTab, syncStylesToHTML])

  // 切换选中元素时初始化内容编辑状态
  useEffect(() => {
    if (selectedElement) {
      setContentText(selectedElement.textContent ?? '')
      setContentImageUrl(selectedElement.imageSrc ?? '')
      setDivToImgUrl('')
    } else {
      setContentText('')
      setContentImageUrl('')
      setDivToImgUrl('')
    }
  }, [selectedElement])

  // 当选中元素变化时，填充表单
  useEffect(() => {
    if (selectedElement && selectedElement.computedStyles) {
      const { computedStyles } = selectedElement

      // 设置表单初始值
      const formValues = {
        // 布局属性
        display: computedStyles.display || 'block',
        position: computedStyles.position || 'static',
        float: computedStyles.float || 'none',
        clear: computedStyles.clear || 'none',
        'box-sizing': computedStyles['box-sizing'] || 'content-box',

        // 盒模型属性
        width: computedStyles.width || 'auto',
        height: computedStyles.height || 'auto',
        'margin-top': computedStyles['margin-top'] || '0px',
        'margin-right': computedStyles['margin-right'] || '0px',
        'margin-bottom': computedStyles['margin-bottom'] || '0px',
        'margin-left': computedStyles['margin-left'] || '0px',
        'padding-top': computedStyles['padding-top'] || '0px',
        'padding-right': computedStyles['padding-right'] || '0px',
        'padding-bottom': computedStyles['padding-bottom'] || '0px',
        'padding-left': computedStyles['padding-left'] || '0px',

        // 文本属性
        color: computedStyles.color || '#000000',
        'font-family': computedStyles['font-family'] || 'inherit',
        'font-size': computedStyles['font-size'] || '14px',
        'font-weight': computedStyles['font-weight'] || 'normal',
        'font-style': computedStyles['font-style'] || 'normal',
        'text-align': computedStyles['text-align'] || 'left',
        'text-decoration': computedStyles['text-decoration'] || 'none',
        'text-transform': computedStyles['text-transform'] || 'none',
        'line-height': computedStyles['line-height'] || 'normal',
        'letter-spacing': computedStyles['letter-spacing'] || 'normal',
        'word-spacing': computedStyles['word-spacing'] || 'normal',
        'vertical-align': computedStyles['vertical-align'] || 'baseline',
        'white-space': computedStyles['white-space'] || 'normal',

        // 背景属性
        'background-color': computedStyles['background-color'] || 'transparent',
        'background-image': computedStyles['background-image'] || 'none',
        'background-repeat': computedStyles['background-repeat'] || 'repeat',
        'background-position': computedStyles['background-position'] || '0% 0%',
        'background-size': computedStyles['background-size'] || 'auto',
        'background-attachment': computedStyles['background-attachment'] || 'scroll',

        // 边框属性
        'border-width': computedStyles['border-width'] || '0px',
        'border-style': computedStyles['border-style'] || 'none',
        'border-color': computedStyles['border-color'] || '#000000',
        'border-radius': computedStyles['border-radius'] || '0px',

        // 可见性和透明度
        visibility: computedStyles.visibility || 'visible',
        opacity: computedStyles.opacity || '1',
        overflow: computedStyles.overflow || 'visible',
        'overflow-x': computedStyles['overflow-x'] || 'visible',
        'overflow-y': computedStyles['overflow-y'] || 'visible',

        // Flexbox属性
        'flex-direction': computedStyles['flex-direction'] || 'row',
        'flex-wrap': computedStyles['flex-wrap'] || 'nowrap',
        'justify-content': computedStyles['justify-content'] || 'flex-start',
        'align-items': computedStyles['align-items'] || 'stretch',
        'align-content': computedStyles['align-content'] || 'stretch',
        flex: computedStyles.flex || '0 1 auto',

        // Grid属性
        'grid-template-columns': computedStyles['grid-template-columns'] || 'none',
        'grid-template-rows': computedStyles['grid-template-rows'] || 'none',
        'grid-gap': computedStyles['grid-gap'] || '0',
        gap: computedStyles.gap || '0',
        'grid-column': computedStyles['grid-column'] || 'auto',
        'grid-row': computedStyles['grid-row'] || 'auto',

        // 变换和动画
        transform: computedStyles.transform || 'none',
        transition: computedStyles.transition || 'none',
        animation: computedStyles.animation || 'none',

        // 其他属性
        cursor: computedStyles.cursor || 'auto',
        'z-index': computedStyles['z-index'] || 'auto',
        'list-style': computedStyles['list-style'] || 'disc outside none'
      }

      styleForm.setFieldsValue(formValues)
      setCurrentStyles(computedStyles)
    } else {
      styleForm.resetFields()
      setCurrentStyles({})
    }
  }, [selectedElement, styleForm])

  // 监听关键属性值变化，用于条件显示
  const displayValue = Form.useWatch('display', styleForm);
  const positionValue = Form.useWatch('position', styleForm);
  const floatValue = Form.useWatch('float', styleForm);

  const handleStyleChange = (property: string, value: string) => {
    console.log('StyleDrawer - 样式变更:', { property, value, selectedElement: selectedElement?.elementPath })

    const newStyles = { ...currentStyles, [property]: value }
    setCurrentStyles(newStyles)
    onStyleChange?.(newStyles)

    // 追踪样式变更
    if (selectedElement && selectedElement.elementPath) {
      const originalValue = selectedElement.computedStyles[property]
      console.log('StyleDrawer - 记录样式变更:', {
        elementPath: selectedElement.elementPath,
        property,
        value,
        originalValue
      })
      addStyleChange(selectedElement.elementPath, property, value, originalValue)
    } else {
      console.warn('StyleDrawer - 无法记录样式变更，缺少selectedElement或elementPath')
    }
  }

  // 重置表单到初始状态
  const handleReset = () => {
    if (selectedElement && selectedElement.computedStyles) {
      const { computedStyles } = selectedElement

      // 重新设置表单初始值
      const formValues = {
        // 布局属性
        display: computedStyles.display || 'block',
        position: computedStyles.position || 'static',
        float: computedStyles.float || 'none',
        clear: computedStyles.clear || 'none',
        'box-sizing': computedStyles['box-sizing'] || 'content-box',

        // 盒模型属性
        width: computedStyles.width || 'auto',
        height: computedStyles.height || 'auto',
        'margin-top': computedStyles['margin-top'] || '0px',
        'margin-right': computedStyles['margin-right'] || '0px',
        'margin-bottom': computedStyles['margin-bottom'] || '0px',
        'margin-left': computedStyles['margin-left'] || '0px',
        'padding-top': computedStyles['padding-top'] || '0px',
        'padding-right': computedStyles['padding-right'] || '0px',
        'padding-bottom': computedStyles['padding-bottom'] || '0px',
        'padding-left': computedStyles['padding-left'] || '0px',

        // 文本属性
        color: computedStyles.color || '#000000',
        'font-family': computedStyles['font-family'] || 'inherit',
        'font-size': computedStyles['font-size'] || '14px',
        'font-weight': computedStyles['font-weight'] || 'normal',
        'font-style': computedStyles['font-style'] || 'normal',
        'text-align': computedStyles['text-align'] || 'left',
        'text-decoration': computedStyles['text-decoration'] || 'none',
        'text-transform': computedStyles['text-transform'] || 'none',
        'line-height': computedStyles['line-height'] || 'normal',
        'letter-spacing': computedStyles['letter-spacing'] || 'normal',
        'word-spacing': computedStyles['word-spacing'] || 'normal',
        'vertical-align': computedStyles['vertical-align'] || 'baseline',
        'white-space': computedStyles['white-space'] || 'normal',

        // 背景属性
        'background-color': computedStyles['background-color'] || 'transparent',
        'background-image': computedStyles['background-image'] || 'none',
        'background-repeat': computedStyles['background-repeat'] || 'repeat',
        'background-position': computedStyles['background-position'] || '0% 0%',
        'background-size': computedStyles['background-size'] || 'auto',
        'background-attachment': computedStyles['background-attachment'] || 'scroll',

        // 边框属性
        'border-width': computedStyles['border-width'] || '0px',
        'border-style': computedStyles['border-style'] || 'none',
        'border-color': computedStyles['border-color'] || '#000000',
        'border-radius': computedStyles['border-radius'] || '0px',

        // 可见性和透明度
        visibility: computedStyles.visibility || 'visible',
        opacity: computedStyles.opacity || '1',
        overflow: computedStyles.overflow || 'visible',
        'overflow-x': computedStyles['overflow-x'] || 'visible',
        'overflow-y': computedStyles['overflow-y'] || 'visible',

        // Flexbox属性
        'flex-direction': computedStyles['flex-direction'] || 'row',
        'flex-wrap': computedStyles['flex-wrap'] || 'nowrap',
        'justify-content': computedStyles['justify-content'] || 'flex-start',
        'align-items': computedStyles['align-items'] || 'stretch',
        'align-content': computedStyles['align-content'] || 'stretch',
        flex: computedStyles.flex || '0 1 auto',

        // Grid属性
        'grid-template-columns': computedStyles['grid-template-columns'] || 'none',
        'grid-template-rows': computedStyles['grid-template-rows'] || 'none',
        'grid-gap': computedStyles['grid-gap'] || '0',
        gap: computedStyles.gap || '0',
        'grid-column': computedStyles['grid-column'] || 'auto',
        'grid-row': computedStyles['grid-row'] || 'auto',

        // 变换和动画
        transform: computedStyles.transform || 'none',
        transition: computedStyles.transition || 'none',
        animation: computedStyles.animation || 'none',

        // 其他属性
        cursor: computedStyles.cursor || 'auto',
        'z-index': computedStyles['z-index'] || 'auto',
        'list-style': computedStyles['list-style'] || 'disc outside none'
      }

      styleForm.setFieldsValue(formValues)
      setCurrentStyles(computedStyles)
      onStyleChange?.(computedStyles)
    }
  }

  // 取消操作，关闭抽屉
  const handleCancel = () => {
    onClose()
  }

  const renderContentSection = (): React.ReactNode => {
    if (!selectedElement) return null
    const tag = selectedElement.tagName.toUpperCase()
    const TEXT_TAGS = ['P','H1','H2','H3','H4','H5','H6','SPAN','A','BUTTON','LI','TD','TH','LABEL','STRONG','EM','B','I','SMALL','DT','DD','CAPTION']
    const CONTAINER_TAGS = ['DIV','SECTION','ARTICLE','HEADER','FOOTER','MAIN','ASIDE','NAV']

    if (tag === 'IMG') {
      return (
        <>
          <Divider orientation="left">元素内容</Divider>
          <img
            src={contentImageUrl}
            alt="预览"
            style={{ width: '100%', maxHeight: 100, objectFit: 'contain', background: '#f5f5f5', borderRadius: 4, marginBottom: 8 }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            onLoad={(e) => { (e.target as HTMLImageElement).style.display = '' }}
          />
          <Form.Item label="图片地址">
            <Input
              value={contentImageUrl}
              onChange={(e) => { setContentImageUrl(e.target.value); onContentChange?.('src', e.target.value) }}
              onBlur={async () => { if (selectedElement?.elementPath) await updateElementContent(selectedElement.elementPath, 'image', contentImageUrl) }}
              placeholder="输入图片URL"
              allowClear
            />
          </Form.Item>
        </>
      )
    }
    if (TEXT_TAGS.includes(tag)) {
      return (
        <>
          <Divider orientation="left">元素内容</Divider>
          <Form.Item>
            <Input.TextArea
              value={contentText}
              onChange={(e) => { setContentText(e.target.value); onContentChange?.('text', e.target.value) }}
              onBlur={async () => { if (selectedElement?.elementPath) await updateElementContent(selectedElement.elementPath, 'text', contentText) }}
              rows={3}
              placeholder="输入新的文字内容"
            />
          </Form.Item>
        </>
      )
    }
    if (CONTAINER_TAGS.includes(tag)) {
      const hasChildren = (selectedElement.textContent ?? '').trim().length > 0
      return (
        <>
          {hasChildren && (
            <>
              <Divider orientation="left">元素内容</Divider>
              <Form.Item>
                <Input.TextArea
                  value={contentText}
                  onChange={(e) => { setContentText(e.target.value); onContentChange?.('text', e.target.value) }}
                  onBlur={async () => { if (selectedElement?.elementPath) await updateElementContent(selectedElement.elementPath, 'text', contentText) }}
                  rows={3}
                  placeholder="输入新的文字内容"
                />
              </Form.Item>
            </>
          )}
          <Divider orientation="left">替换为图片</Divider>
          {hasChildren && (
            <Alert message="替换后子内容将被清除" type="warning" showIcon style={{ marginBottom: 8 }} />
          )}
          <Form.Item>
            <Space.Compact style={{ width: '100%' }}>
              <Input
                value={divToImgUrl}
                onChange={(e) => setDivToImgUrl(e.target.value)}
                placeholder="输入图片URL，如 https://example.com/img.png"
              />
              <Button
                type="primary"
                loading={isReplacing}
                onClick={async () => {
                  if (!divToImgUrl.trim() || !selectedElement?.elementPath) return
                  setIsReplacing(true)
                  const ok = await replaceElementWithImg(selectedElement.elementPath, divToImgUrl)
                  setIsReplacing(false)
                  if (ok) { message.success('已替换为图片') } else { message.error('替换失败') }
                }}
              >
                替换
              </Button>
            </Space.Compact>
          </Form.Item>
        </>
      )
    }
    return null
  }

  return (
    <Drawer
      title={
        <div className={styles.drawerTitle}>
          <Tabs
            activeKey={activeTab}
            onChange={(key) => setActiveTab(key as 'style' | 'agent')}
            size="small"
            style={{ marginBottom: 0, width: '100%', margin: 0 }}
            tabBarStyle={{ margin: 0, marginBottom: 0, padding: 0 }}
            items={[
              {
                key: 'style',
                label: (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <EditOutlined />
                    样式编辑
                  </span>
                )
              },
              {
                key: 'agent',
                label: (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <RobotOutlined />
                    Agent
                  </span>
                )
              }
            ]}
          />
        </div>
      }
      placement="right"
      width={width}
      open={visible}
      onClose={onClose}
      closeIcon={false}
      mask={false}
      getContainer={false}
      footer={
        activeTab === 'style' && selectedElement ? (
          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={handleCancel}>
                取消
              </Button>
              <Button type="primary" onClick={handleReset}>
                重置
              </Button>
            </Space>
          </div>
        ) : null
      }
      rootStyle={{
        position: 'absolute',
        height: '100%',
        top: 0,
        right: 0
      }}
      styles={{
        body: {
          height: activeTab === 'style' && selectedElement ? 'calc(100% - 110px)' : 'calc(100% - 60px)',
          overflowY: activeTab === 'agent' ? 'hidden' : 'auto',
          padding: activeTab === 'agent' ? '0' : '16px 24px'
        },
        footer: {
          padding: '12px 24px',
          borderTop: '1px solid #f0f0f0',
          background: '#fff'
        }
      }}
    >
      {activeTab === 'style' ? (
        selectedElement ? (
          <div className={styles.drawerContent}>
            <Form form={styleForm} layout="vertical" size="small">
              {renderContentSection()}

              {/* 布局属性 */}
              <Divider orientation="left">布局属性</Divider>

              <Form.Item label="显示方式" name="display">
                <Select
                  placeholder="选择显示方式"
                  onChange={(value) => handleStyleChange('display', value)}
                >
                  <Option value="block">block</Option>
                  <Option value="inline">inline</Option>
                  <Option value="inline-block">inline-block</Option>
                  <Option value="flex">flex</Option>
                  <Option value="grid">grid</Option>
                  <Option value="none">none</Option>
                  <Option value="table">table</Option>
                  <Option value="table-cell">table-cell</Option>
                  <Option value="list-item">list-item</Option>
                </Select>
              </Form.Item>

              <Form.Item label="定位方式" name="position">
                <Select
                  placeholder="选择定位方式"
                  onChange={(value) => handleStyleChange('position', value)}
                >
                  <Option value="static">static</Option>
                  <Option value="relative">relative</Option>
                  <Option value="absolute">absolute</Option>
                  <Option value="fixed">fixed</Option>
                  <Option value="sticky">sticky</Option>
                </Select>
              </Form.Item>

              <Form.Item label="浮动" name="float">
                <Select
                  placeholder="选择浮动方式"
                  onChange={(value) => handleStyleChange('float', value)}
                >
                  <Option value="none">无浮动</Option>
                  <Option value="left">左浮动</Option>
                  <Option value="right">右浮动</Option>
                </Select>
              </Form.Item>

              {floatValue && floatValue !== 'none' && (
                <Form.Item label="清除浮动" name="clear">
                  <Select
                    placeholder="选择清除方式"
                    onChange={(value) => handleStyleChange('clear', value)}
                  >
                    <Option value="none">不清除</Option>
                    <Option value="left">清除左浮动</Option>
                    <Option value="right">清除右浮动</Option>
                    <Option value="both">清除两侧浮动</Option>
                  </Select>
                </Form.Item>
              )}

              <Form.Item label="盒模型" name="box-sizing">
                <Select
                  placeholder="选择盒模型"
                  onChange={(value) => handleStyleChange('box-sizing', value)}
                >
                  <Option value="content-box">content-box</Option>
                  <Option value="border-box">border-box</Option>
                </Select>
              </Form.Item>

              {/* 盒模型属性 */}
              <Divider orientation="left">盒模型属性</Divider>

              <Form.Item label="宽度" name="width">
                <Input
                  placeholder="如: 100px, 50%, auto"
                  onChange={(e) => handleStyleChange('width', e.target.value)}
                />
              </Form.Item>

              <Form.Item label="高度" name="height">
                <Input
                  placeholder="如: 100px, 50%, auto"
                  onChange={(e) => handleStyleChange('height', e.target.value)}
                />
              </Form.Item>

              <Form.Item label="外边距">
                <Space.Compact>
                  <Input
                    placeholder="上"
                    onChange={(e) => handleStyleChange('margin-top', e.target.value)}
                  />
                  <Input
                    placeholder="右"
                    onChange={(e) => handleStyleChange('margin-right', e.target.value)}
                  />
                  <Input
                    placeholder="下"
                    onChange={(e) => handleStyleChange('margin-bottom', e.target.value)}
                  />
                  <Input
                    placeholder="左"
                    onChange={(e) => handleStyleChange('margin-left', e.target.value)}
                  />
                </Space.Compact>
              </Form.Item>

              <Form.Item label="内边距">
                <Space.Compact>
                  <Input
                    placeholder="上"
                    onChange={(e) => handleStyleChange('padding-top', e.target.value)}
                  />
                  <Input
                    placeholder="右"
                    onChange={(e) => handleStyleChange('padding-right', e.target.value)}
                  />
                  <Input
                    placeholder="下"
                    onChange={(e) => handleStyleChange('padding-bottom', e.target.value)}
                  />
                  <Input
                    placeholder="左"
                    onChange={(e) => handleStyleChange('padding-left', e.target.value)}
                  />
                </Space.Compact>
              </Form.Item>

              {/* 文本属性 */}
              <Divider orientation="left">文本属性</Divider>

              <Form.Item label="文字颜色" name="color">
                <ColorPicker
                  onChange={(color) => handleStyleChange('color', color.toHexString())}
                />
              </Form.Item>

              <Form.Item label="字体族" name="font-family">
                <Select
                  placeholder="选择字体族"
                  onChange={(value) => handleStyleChange('font-family', value)}
                >
                  <Option value="inherit">继承</Option>
                  <Option value="serif">衬线字体</Option>
                  <Option value="sans-serif">无衬线字体</Option>
                  <Option value="monospace">等宽字体</Option>
                  <Option value="cursive">草书字体</Option>
                  <Option value="fantasy">装饰字体</Option>
                  <Option value="Arial, sans-serif">Arial</Option>
                  <Option value="'Times New Roman', serif">Times New Roman</Option>
                  <Option value="'Courier New', monospace">Courier New</Option>
                </Select>
              </Form.Item>

              <Form.Item label="字体大小" name="font-size">
                <Input
                  placeholder="如: 14px, 1.2em, large"
                  onChange={(e) => handleStyleChange('font-size', e.target.value)}
                />
              </Form.Item>

              <Form.Item label="字体粗细" name="font-weight">
                <Select
                  placeholder="选择字体粗细"
                  onChange={(value) => handleStyleChange('font-weight', value)}
                >
                  <Option value="normal">正常</Option>
                  <Option value="bold">粗体</Option>
                  <Option value="bolder">更粗</Option>
                  <Option value="lighter">更细</Option>
                  <Option value="100">100</Option>
                  <Option value="200">200</Option>
                  <Option value="300">300</Option>
                  <Option value="400">400</Option>
                  <Option value="500">500</Option>
                  <Option value="600">600</Option>
                  <Option value="700">700</Option>
                  <Option value="800">800</Option>
                  <Option value="900">900</Option>
                </Select>
              </Form.Item>

              <Form.Item label="字体样式" name="font-style">
                <Select
                  placeholder="选择字体样式"
                  onChange={(value) => handleStyleChange('font-style', value)}
                >
                  <Option value="normal">正常</Option>
                  <Option value="italic">斜体</Option>
                  <Option value="oblique">倾斜</Option>
                </Select>
              </Form.Item>

              <Form.Item label="文字对齐" name="text-align">
                <Select
                  placeholder="选择对齐方式"
                  onChange={(value) => handleStyleChange('text-align', value)}
                >
                  <Option value="left">左对齐</Option>
                  <Option value="center">居中</Option>
                  <Option value="right">右对齐</Option>
                  <Option value="justify">两端对齐</Option>
                  <Option value="start">起始对齐</Option>
                  <Option value="end">结束对齐</Option>
                </Select>
              </Form.Item>

              <Form.Item label="文字装饰" name="text-decoration">
                <Select
                  placeholder="选择文字装饰"
                  onChange={(value) => handleStyleChange('text-decoration', value)}
                >
                  <Option value="none">无装饰</Option>
                  <Option value="underline">下划线</Option>
                  <Option value="overline">上划线</Option>
                  <Option value="line-through">删除线</Option>
                </Select>
              </Form.Item>

              <Form.Item label="文字转换" name="text-transform">
                <Select
                  placeholder="选择文字转换"
                  onChange={(value) => handleStyleChange('text-transform', value)}
                >
                  <Option value="none">无转换</Option>
                  <Option value="capitalize">首字母大写</Option>
                  <Option value="uppercase">全部大写</Option>
                  <Option value="lowercase">全部小写</Option>
                </Select>
              </Form.Item>

              <Form.Item label="行高" name="line-height">
                <Input
                  placeholder="如: normal, 1.5, 24px"
                  onChange={(e) => handleStyleChange('line-height', e.target.value)}
                />
              </Form.Item>

              <Form.Item label="字符间距" name="letter-spacing">
                <Input
                  placeholder="如: normal, 2px"
                  onChange={(e) => handleStyleChange('letter-spacing', e.target.value)}
                />
              </Form.Item>

              <Form.Item label="单词间距" name="word-spacing">
                <Input
                  placeholder="如: normal, 4px"
                  onChange={(e) => handleStyleChange('word-spacing', e.target.value)}
                />
              </Form.Item>

              <Form.Item label="垂直对齐" name="vertical-align">
                <Select
                  placeholder="选择垂直对齐"
                  onChange={(value) => handleStyleChange('vertical-align', value)}
                >
                  <Option value="baseline">基线</Option>
                  <Option value="sub">下标</Option>
                  <Option value="super">上标</Option>
                  <Option value="top">顶部</Option>
                  <Option value="text-top">文本顶部</Option>
                  <Option value="middle">中间</Option>
                  <Option value="bottom">底部</Option>
                  <Option value="text-bottom">文本底部</Option>
                </Select>
              </Form.Item>

              <Form.Item label="空白处理" name="white-space">
                <Select
                  placeholder="选择空白处理方式"
                  onChange={(value) => handleStyleChange('white-space', value)}
                >
                  <Option value="normal">正常</Option>
                  <Option value="nowrap">不换行</Option>
                  <Option value="pre">保留空白</Option>
                  <Option value="pre-wrap">保留空白并换行</Option>
                  <Option value="pre-line">保留换行</Option>
                </Select>
              </Form.Item>

              {/* 背景属性 */}
              <Divider orientation="left">背景属性</Divider>

              <Form.Item label="背景颜色" name="background-color">
                <ColorPicker
                  onChange={(color) => handleStyleChange('background-color', color.toHexString())}
                />
              </Form.Item>

              <Form.Item label="背景图片" name="background-image">
                <Input
                  placeholder="如: url('image.jpg'), none"
                  onChange={(e) => handleStyleChange('background-image', e.target.value)}
                />
              </Form.Item>

              <Form.Item label="背景重复" name="background-repeat">
                <Select
                  placeholder="选择背景重复方式"
                  onChange={(value) => handleStyleChange('background-repeat', value)}
                >
                  <Option value="repeat">重复</Option>
                  <Option value="repeat-x">水平重复</Option>
                  <Option value="repeat-y">垂直重复</Option>
                  <Option value="no-repeat">不重复</Option>
                  <Option value="space">间隔重复</Option>
                  <Option value="round">缩放重复</Option>
                </Select>
              </Form.Item>

              <Form.Item label="背景位置" name="background-position">
                <Input
                  placeholder="如: center, 50% 50%, left top"
                  onChange={(e) => handleStyleChange('background-position', e.target.value)}
                />
              </Form.Item>

              <Form.Item label="背景大小" name="background-size">
                <Select
                  placeholder="选择背景大小"
                  onChange={(value) => handleStyleChange('background-size', value)}
                >
                  <Option value="auto">自动</Option>
                  <Option value="cover">覆盖</Option>
                  <Option value="contain">包含</Option>
                </Select>
              </Form.Item>

              <Form.Item label="背景附着" name="background-attachment">
                <Select
                  placeholder="选择背景附着方式"
                  onChange={(value) => handleStyleChange('background-attachment', value)}
                >
                  <Option value="scroll">滚动</Option>
                  <Option value="fixed">固定</Option>
                  <Option value="local">局部</Option>
                </Select>
              </Form.Item>

              {/* 边框属性 */}
              <Divider orientation="left">边框属性</Divider>

              <Form.Item label="边框宽度" name="border-width">
                <Input
                  placeholder="如: 1px, 2px"
                  onChange={(e) => handleStyleChange('border-width', e.target.value)}
                />
              </Form.Item>

              <Form.Item label="边框样式" name="border-style">
                <Select
                  placeholder="选择边框样式"
                  onChange={(value) => handleStyleChange('border-style', value)}
                >
                  <Option value="none">无边框</Option>
                  <Option value="solid">实线</Option>
                  <Option value="dashed">虚线</Option>
                  <Option value="dotted">点线</Option>
                  <Option value="double">双线</Option>
                  <Option value="groove">凹槽</Option>
                  <Option value="ridge">凸起</Option>
                  <Option value="inset">内嵌</Option>
                  <Option value="outset">外凸</Option>
                </Select>
              </Form.Item>

              <Form.Item label="边框颜色" name="border-color">
                <ColorPicker
                  onChange={(color) => handleStyleChange('border-color', color.toHexString())}
                />
              </Form.Item>

              <Form.Item label="圆角" name="border-radius">
                <Input
                  placeholder="如: 4px, 50%"
                  onChange={(e) => handleStyleChange('border-radius', e.target.value)}
                />
              </Form.Item>

              {/* 可见性和透明度 */}
              <Divider orientation="left">可见性和透明度</Divider>

              <Form.Item label="可见性" name="visibility">
                <Select
                  placeholder="选择可见性"
                  onChange={(value) => handleStyleChange('visibility', value)}
                >
                  <Option value="visible">可见</Option>
                  <Option value="hidden">隐藏</Option>
                  <Option value="collapse">折叠</Option>
                </Select>
              </Form.Item>

              <Form.Item label="透明度" name="opacity">
                <InputNumber
                  min={0}
                  max={1}
                  step={0.1}
                  placeholder="0-1之间"
                  onChange={(value) => handleStyleChange('opacity', String(value))}
                  style={{ width: '100%' }}
                />
              </Form.Item>

              <Form.Item label="溢出处理" name="overflow">
                <Select
                  placeholder="选择溢出处理方式"
                  onChange={(value) => handleStyleChange('overflow', value)}
                >
                  <Option value="visible">可见</Option>
                  <Option value="hidden">隐藏</Option>
                  <Option value="scroll">滚动</Option>
                  <Option value="auto">自动</Option>
                </Select>
              </Form.Item>

              <Form.Item label="水平溢出" name="overflow-x">
                <Select
                  placeholder="选择水平溢出处理"
                  onChange={(value) => handleStyleChange('overflow-x', value)}
                >
                  <Option value="visible">可见</Option>
                  <Option value="hidden">隐藏</Option>
                  <Option value="scroll">滚动</Option>
                  <Option value="auto">自动</Option>
                </Select>
              </Form.Item>

              <Form.Item label="垂直溢出" name="overflow-y">
                <Select
                  placeholder="选择垂直溢出处理"
                  onChange={(value) => handleStyleChange('overflow-y', value)}
                >
                  <Option value="visible">可见</Option>
                  <Option value="hidden">隐藏</Option>
                  <Option value="scroll">滚动</Option>
                  <Option value="auto">自动</Option>
                </Select>
              </Form.Item>

              {/* Flexbox属性 - 条件显示 */}
              {displayValue === 'flex' && (
                <>
                  <Divider orientation="left">Flexbox属性</Divider>

                  <Form.Item label="主轴方向" name="flex-direction">
                    <Select
                      placeholder="选择主轴方向"
                      onChange={(value) => handleStyleChange('flex-direction', value)}
                    >
                      <Option value="row">水平（左到右）</Option>
                      <Option value="row-reverse">水平（右到左）</Option>
                      <Option value="column">垂直（上到下）</Option>
                      <Option value="column-reverse">垂直（下到上）</Option>
                    </Select>
                  </Form.Item>

                  <Form.Item label="换行方式" name="flex-wrap">
                    <Select
                      placeholder="选择换行方式"
                      onChange={(value) => handleStyleChange('flex-wrap', value)}
                    >
                      <Option value="nowrap">不换行</Option>
                      <Option value="wrap">换行</Option>
                      <Option value="wrap-reverse">反向换行</Option>
                    </Select>
                  </Form.Item>

                  <Form.Item label="主轴对齐" name="justify-content">
                    <Select
                      placeholder="选择主轴对齐方式"
                      onChange={(value) => handleStyleChange('justify-content', value)}
                    >
                      <Option value="flex-start">起始对齐</Option>
                      <Option value="flex-end">结束对齐</Option>
                      <Option value="center">居中对齐</Option>
                      <Option value="space-between">两端对齐</Option>
                      <Option value="space-around">环绕对齐</Option>
                      <Option value="space-evenly">均匀对齐</Option>
                    </Select>
                  </Form.Item>

                  <Form.Item label="交叉轴对齐" name="align-items">
                    <Select
                      placeholder="选择交叉轴对齐方式"
                      onChange={(value) => handleStyleChange('align-items', value)}
                    >
                      <Option value="stretch">拉伸</Option>
                      <Option value="flex-start">起始对齐</Option>
                      <Option value="flex-end">结束对齐</Option>
                      <Option value="center">居中对齐</Option>
                      <Option value="baseline">基线对齐</Option>
                    </Select>
                  </Form.Item>

                  <Form.Item label="多行对齐" name="align-content">
                    <Select
                      placeholder="选择多行对齐方式"
                      onChange={(value) => handleStyleChange('align-content', value)}
                    >
                      <Option value="stretch">拉伸</Option>
                      <Option value="flex-start">起始对齐</Option>
                      <Option value="flex-end">结束对齐</Option>
                      <Option value="center">居中对齐</Option>
                      <Option value="space-between">两端对齐</Option>
                      <Option value="space-around">环绕对齐</Option>
                    </Select>
                  </Form.Item>

                  <Form.Item label="弹性属性" name="flex">
                    <Input
                      placeholder="如: 1, 0 1 auto, 1 1 100px"
                      onChange={(e) => handleStyleChange('flex', e.target.value)}
                    />
                  </Form.Item>
                </>
              )}

              {/* Grid属性 - 条件显示 */}
              {displayValue === 'grid' && (
                <>
                  <Divider orientation="left">Grid属性</Divider>

                  <Form.Item label="网格列" name="grid-template-columns">
                    <Input
                      placeholder="如: 1fr 1fr, 100px 200px, repeat(3, 1fr)"
                      onChange={(e) => handleStyleChange('grid-template-columns', e.target.value)}
                    />
                  </Form.Item>

                  <Form.Item label="网格行" name="grid-template-rows">
                    <Input
                      placeholder="如: 1fr 1fr, 100px 200px, repeat(3, 1fr)"
                      onChange={(e) => handleStyleChange('grid-template-rows', e.target.value)}
                    />
                  </Form.Item>

                  <Form.Item label="网格间距" name="gap">
                    <Input
                      placeholder="如: 10px, 10px 20px"
                      onChange={(e) => handleStyleChange('gap', e.target.value)}
                    />
                  </Form.Item>

                  <Form.Item label="列位置" name="grid-column">
                    <Input
                      placeholder="如: 1 / 3, span 2"
                      onChange={(e) => handleStyleChange('grid-column', e.target.value)}
                    />
                  </Form.Item>

                  <Form.Item label="行位置" name="grid-row">
                    <Input
                      placeholder="如: 1 / 3, span 2"
                      onChange={(e) => handleStyleChange('grid-row', e.target.value)}
                    />
                  </Form.Item>
                </>
              )}

              {/* 变换和动画 */}
              <Divider orientation="left">变换和动画</Divider>

              <Form.Item label="变换" name="transform">
                <Input
                  placeholder="如: rotate(45deg), scale(1.2), translate(10px, 20px)"
                  onChange={(e) => handleStyleChange('transform', e.target.value)}
                />
              </Form.Item>

              <Form.Item label="过渡" name="transition">
                <Input
                  placeholder="如: all 0.3s ease, width 1s linear"
                  onChange={(e) => handleStyleChange('transition', e.target.value)}
                />
              </Form.Item>

              <Form.Item label="动画" name="animation">
                <Input
                  placeholder="如: slideIn 1s ease-in-out"
                  onChange={(e) => handleStyleChange('animation', e.target.value)}
                />
              </Form.Item>

              {/* 其他属性 */}
              <Divider orientation="left">其他属性</Divider>

              <Form.Item label="鼠标样式" name="cursor">
                <Select
                  placeholder="选择鼠标样式"
                  onChange={(value) => handleStyleChange('cursor', value)}
                >
                  <Option value="auto">自动</Option>
                  <Option value="pointer">手型</Option>
                  <Option value="crosshair">十字</Option>
                  <Option value="text">文本</Option>
                  <Option value="move">移动</Option>
                  <Option value="help">帮助</Option>
                  <Option value="not-allowed">禁止</Option>
                  <Option value="grab">抓取</Option>
                  <Option value="grabbing">抓取中</Option>
                </Select>
              </Form.Item>

              {positionValue && positionValue !== 'static' && (
                <Form.Item label="层级" name="z-index">
                  <InputNumber
                    placeholder="如: 1, 999"
                    onChange={(value) => handleStyleChange('z-index', String(value))}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              )}

              <Form.Item label="列表样式" name="list-style">
                <Input
                  placeholder="如: disc, none, decimal inside"
                  onChange={(e) => handleStyleChange('list-style', e.target.value)}
                />
              </Form.Item>
            </Form>
            {/* 为footer添加视觉间距 */}
            <div style={{ height: '16px', width: '100%' }}></div>
          </div>
        ) : (
          <div className={styles.emptyState}>
            <div>
              <p>🎨 样式编辑器</p>
              <p>请在预览区域点击选择要编辑的元素</p>
              <p style={{ fontSize: '12px', opacity: 0.7 }}>空白项目可以通过Agent生成项目哦</p>
            </div>
          </div>
        )
      ) : (
        <ChatManager selectedElement={selectedElement} />
      )}
    </Drawer>
  )
}

export default StyleDrawer