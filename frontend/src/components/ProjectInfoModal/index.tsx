import React, { useEffect } from 'react'
import { Modal, Form, Input, Select } from 'antd'
import { Project } from '@/types/project'

interface ProjectInfoModalProps {
  visible: boolean
  project: Project | null
  onClose: () => void
  onSave: (values: any) => Promise<void>
}

const ProjectInfoModal: React.FC<ProjectInfoModalProps> = ({
  visible,
  project,
  onClose,
  onSave
}) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = React.useState(false)

  useEffect(() => {
    if (visible && project) {
      form.setFieldsValue({
        name: project.name,
        description: project.description,
        tags: project.tags ? project.tags.split(',').filter(t => t.trim()) : [],
        status: project.status
      })
    }
  }, [visible, project, form])

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setLoading(true)
      await onSave({
        name: values.name,
        description: values.description,
        tags: values.tags?.join(',') || '',
        status: values.status
      })
      onClose()
    } catch (error) {
      console.error('保存失败:', error)
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
      title="项目信息"
      open={visible}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={loading}
      okText="保存"
      cancelText="取消"
      width={500}
    >
      <Form
        form={form}
        layout="vertical"
        autoComplete="off"
      >
        <Form.Item
          name="name"
          label="项目名称"
          rules={[
            { required: true, message: '请输入项目名称' },
            { max: 50, message: '项目名称不能超过50个字符' }
          ]}
        >
          <Input
            placeholder="输入项目名称"
            maxLength={50}
            showCount
          />
        </Form.Item>

        <Form.Item
          name="description"
          label="项目描述"
          rules={[
            { max: 200, message: '项目描述不能超过200个字符' }
          ]}
        >
          <Input.TextArea
            rows={3}
            placeholder="简单描述项目用途（可选）"
            maxLength={200}
            showCount
          />
        </Form.Item>

        <Form.Item
          name="status"
          label="项目状态"
        >
          <Select>
            <Select.Option value="draft">草稿</Select.Option>
            <Select.Option value="published">已发布</Select.Option>
            <Select.Option value="archived">已归档</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="tags"
          label="标签"
        >
          <Select
            mode="tags"
            placeholder="添加标签（可选）"
            style={{ width: '100%' }}
            maxTagCount={5}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default ProjectInfoModal
