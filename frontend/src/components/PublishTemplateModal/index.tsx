import React, { useEffect, useState } from 'react'
import { Modal, Form, Input, Select, Switch } from 'antd'
import { Project } from '@/types/project'
import { CreateTemplateData } from '@/types/template'
import { TEMPLATE_CATEGORIES } from '@/constants/templateCategories'

interface PublishTemplateModalProps {
  visible: boolean
  project: Project | null
  onClose: () => void
  onPublish: (templateData: CreateTemplateData) => Promise<void>
}

const PublishTemplateModal: React.FC<PublishTemplateModalProps> = ({
  visible,
  project,
  onClose,
  onPublish
}) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (visible && project) {
      // 自动填充项目信息
      form.setFieldsValue({
        name: project.name,
        description: project.description || '',
        category: 'general',
        tags: project.tags ? project.tags.split(',').filter(t => t.trim()) : [],
        isPublic: true
      })
    }
  }, [visible, project, form])

  const handleSubmit = async () => {
    if (!project) return

    try {
      const values = await form.validateFields()
      setLoading(true)

      // 构建模板数据
      const templateData: CreateTemplateData = {
        name: values.name,
        description: values.description,
        category: values.category,
        tags: values.tags?.join(',') || '',
        isPublic: values.isPublic,
        content: project.content,
        sourceProjectId: project.id
      }

      // 调用父组件的发布回调
      await onPublish(templateData)
      
      form.resetFields()
      onClose()
    } catch (error: any) {
      if (error?.errorFields) {
        return
      }
      console.error('发布失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    form.resetFields()
    onClose()
  }

  return (
    <Modal
      title={project?.isPublishedAsTemplate ? '更新模板' : '发布为模板'}
      open={visible}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={loading}
      okText={project?.isPublishedAsTemplate ? '更新模板' : '发布'}
      cancelText="取消"
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
        autoComplete="off"
      >
        <Form.Item
          name="name"
          label="模板名称"
          rules={[
            { required: true, message: '请输入模板名称' },
            { max: 50, message: '模板名称不能超过50个字符' }
          ]}
        >
          <Input
            placeholder="输入模板名称"
            maxLength={50}
            showCount
          />
        </Form.Item>

        <Form.Item
          name="description"
          label="模板描述"
          rules={[
            { required: true, message: '请输入模板描述' },
            { max: 200, message: '模板描述不能超过200个字符' }
          ]}
        >
          <Input.TextArea
            rows={4}
            placeholder="详细描述模板的用途和特点"
            maxLength={200}
            showCount
          />
        </Form.Item>

        <Form.Item
          name="category"
          label="模板分类"
          rules={[{ required: true, message: '请选择模板分类' }]}
        >
          <Select placeholder="选择模板分类">
            {TEMPLATE_CATEGORIES.filter(c => c.key !== 'all').map(c => (
              <Select.Option key={c.key} value={c.key}>{c.label}</Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="tags"
          label="模板标签"
        >
          <Select
            mode="tags"
            placeholder="添加标签（可选）"
            style={{ width: '100%' }}
            maxTagCount={5}
          />
        </Form.Item>

        <Form.Item
          name="isPublic"
          label="公开设置"
          valuePropName="checked"
        >
          <Switch 
            checkedChildren="公开" 
            unCheckedChildren="私有"
          />
        </Form.Item>

        {project?.isPublishedAsTemplate && (
          <div style={{ 
            padding: '12px', 
            background: '#e6f7ff', 
            borderRadius: '4px',
            marginBottom: '16px'
          }}>
            <p style={{ margin: 0, color: '#1890ff' }}>
              提示：此项目已发布为模板，更新后将覆盖原模板内容
            </p>
          </div>
        )}
      </Form>
    </Modal>
  )
}

export default PublishTemplateModal
