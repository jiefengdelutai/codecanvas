import React, { useState, useEffect } from 'react'
import { Modal, Form, Input, Button, message, Typography } from 'antd'
import { ImportOutlined, FolderAddOutlined } from '@ant-design/icons'
import { Template } from '@/types/template'
import { templateService } from '@/services/templateService'
import styles from './index.module.css'

const { Text } = Typography

interface TemplateImportModalProps {
  template: Template | null
  visible: boolean
  onClose: () => void
  onSuccess: (projectId: string, projectName: string) => void
}

const TemplateImportModal: React.FC<TemplateImportModalProps> = ({
  template,
  visible,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (visible && template) {
      form.setFieldsValue({ projectName: template.name })
    }
  }, [visible, template, form])

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (!template) return

      setLoading(true)
      const response = await templateService.importTemplate(template.id, values.projectName)

      if (response.success && response.data) {
        form.resetFields()
        onSuccess(response.data.id, response.data.name)
      } else {
        message.error(response.message || '导入失败，请重试')
      }
    } catch (err: any) {
      if (err?.errorFields) return // 表单校验失败，不处理
      message.error('导入失败，请重试')
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
      open={visible}
      onCancel={handleCancel}
      title={
        <div className={styles.modalTitle}>
          <FolderAddOutlined className={styles.titleIcon} />
          <span>导入模板到项目</span>
        </div>
      }
      width={460}
      footer={null}
      destroyOnClose
    >
      {template && (
        <div className={styles.templateInfo}>
          <Text type="secondary">当前模板：</Text>
          <Text strong>{template.name}</Text>
          {template.description && (
            <Text type="secondary" className={styles.desc} ellipsis>
              {template.description}
            </Text>
          )}
        </div>
      )}

      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          label="项目名称"
          name="projectName"
          rules={[
            { required: true, message: '请输入项目名称' },
            { max: 100, message: '项目名称不能超过 100 个字符' },
            { whitespace: true, message: '项目名称不能为空' },
          ]}
        >
          <Input
            placeholder="为新项目起一个名字"
            size="large"
            autoFocus
            allowClear
          />
        </Form.Item>

        <div className={styles.footer}>
          <Button size="large" onClick={handleCancel} disabled={loading}>
            取消
          </Button>
          <Button
            type="primary"
            size="large"
            icon={<ImportOutlined />}
            loading={loading}
            htmlType="submit"
          >
            确认导入
          </Button>
        </div>
      </Form>
    </Modal>
  )
}

export default TemplateImportModal
