import React, { useState } from 'react'
import { Modal, Form, Input, Select, message } from 'antd'
import { projectStore } from '@/store/projectStore'

interface CreateProjectModalProps {
  visible: boolean
  onClose: () => void
  onSuccess: () => void
}

const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  visible,
  onClose,
  onSuccess
}) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setLoading(true)
      
      await projectStore.createProject({
        name: values.name,
        description: values.description,
        content: JSON.stringify({ html: '', css: '', js: '' }),
        status: 'draft',
        tags: values.tags?.join(',') || ''
      })
      
      form.resetFields()
      onClose()
      onSuccess()
    } catch (error: any) {
      if (error.errorFields) {
        // 表单验证错误，不显示消息
        return
      }
      message.error(error.message || '创建失败')
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
      title="创建新项目"
      open={visible}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={loading}
      okText="创建"
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

export default CreateProjectModal
