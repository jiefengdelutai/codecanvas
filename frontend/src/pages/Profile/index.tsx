import React, { useEffect, useMemo, useState } from 'react'
import {
  Avatar,
  Button,
  Card,
  Col,
  Descriptions,
  Form,
  Input,
  Modal,
  Row,
  Space,
  Tag,
  Upload,
  message,
} from 'antd'
import {
  EditOutlined,
  MailOutlined,
  PhoneOutlined,
  UploadOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { observer } from 'mobx-react-lite'
import { useNavigate } from 'react-router-dom'
import { userStore } from '@/store'

const API_BASE_URL = 'http://localhost:5000'

const resolveAvatarSrc = (avatar: unknown, fallback?: string) => {
  if (typeof avatar === 'string' && avatar) {
    if (avatar.startsWith('data:')) return avatar
    if (avatar.startsWith('http://') || avatar.startsWith('https://')) return avatar
    if (avatar.startsWith('/')) return `${API_BASE_URL}${avatar}`
    return avatar
  }
  return fallback || ''
}

const Profile: React.FC = observer(() => {
  const navigate = useNavigate()

  const [emailForm] = Form.useForm()
  const [phoneForm] = Form.useForm()
  const [nicknameForm] = Form.useForm()
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [emailModalOpen, setEmailModalOpen] = useState(false)
  const [phoneModalOpen, setPhoneModalOpen] = useState(false)
  const [nicknameModalOpen, setNicknameModalOpen] = useState(false)
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  const [passwordForm] = Form.useForm()

  const user = userStore.user

  useEffect(() => {
    if (userStore.isLoggedIn && !userStore.user) {
      userStore.validateToken()
    }
  }, [])

  const avatarSrc = useMemo(() => avatarPreview || resolveAvatarSrc(user?.avatar_url, ''), [avatarPreview, user?.avatar_url])

  if (!userStore.isLoggedIn || !user) {
    return (
      <div style={{ padding: 24 }}>
        <Card>
          <div style={{ textAlign: 'center', padding: 24 }}>
            <p>请先登录后查看个人中心</p>
            <Button type="primary" onClick={() => navigate('/login')}>
              去登录
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  const handleAvatarUpload = async (options: any) => {
    const rawFile = (options.file as File) || options.file?.originFileObj
    if (!rawFile) {
      options.onError?.(new Error('未找到上传文件'))
      return
    }

    const preview = URL.createObjectURL(rawFile)
    setAvatarPreview(preview)
    const success = await userStore.updateProfile({ avatarFile: rawFile })
    if (success) {
      message.success('头像已更新')
      options.onSuccess?.({}, new XMLHttpRequest())
      URL.revokeObjectURL(preview)
    } else {
      setAvatarPreview(null)
      options.onError?.(new Error('头像上传失败'))
      URL.revokeObjectURL(preview)
    }
  }

  const handleEmailFinish = async (values: { email: string }) => {
    const success = await userStore.updateProfile({ email: values.email })
    if (success) {
      setEmailModalOpen(false)
      emailForm.resetFields()
      message.success('邮箱已更新，请重新验证')
    }
  }

  const handlePhoneFinish = async (values: { phone: string }) => {
    const success = await userStore.updateProfile({ phone: values.phone })
    if (success) {
      setPhoneModalOpen(false)
      phoneForm.resetFields()
      message.success('手机号已更新，请重新验证')
    }
  }

  const handleNicknameFinish = async (values: { nickname: string }) => {
    const success = await userStore.updateProfile({ nickname: values.nickname })
    if (success) {
      setNicknameModalOpen(false)
      nicknameForm.resetFields()
      message.success('昵称已更新')
    }
  }

  const handlePasswordFinish = async (values: { oldPassword: string; newPassword: string; confirmPassword: string }) => {
    if (values.newPassword !== values.confirmPassword) {
      message.error('两次输入的新密码不一致')
      return
    }
    const success = await userStore.changePassword({ oldPassword: values.oldPassword, newPassword: values.newPassword })
    if (success) {
      setPasswordModalOpen(false)
      passwordForm.resetFields()
    }
  }

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 64px)',
        padding: '24px 24px 24px',
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(180deg, #f7f9fc 0%, #eef4ff 100%)',
      }}
    >
      <div style={{ width: '100%', maxWidth: 1280 }}>
        <Row gutter={24} align="stretch" justify="center">
          <Col xs={24} md={8} lg={7}>
            <Card
              style={{ height: '100%', borderRadius: 20, boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)' }}
              styles={{ body: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 520 } }}
            >
              <Space direction="vertical" size="large" style={{ width: '100%', alignItems: 'center' }}>
                <Avatar
                  size={120}
                  src={avatarSrc || undefined}
                  icon={<UserOutlined />}
                  style={{ backgroundColor: '#1677ff' }}
                />
                <Space direction="vertical" size={8} style={{ width: '100%', textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 600 }}>{user.nickname || user.username}</div>
                  <div style={{ color: '#666' }}>@{user.username}</div>
                  <Tag color={user.role === 'admin' ? 'red' : user.role === 'premium' ? 'gold' : 'blue'}>
                    {user.role === 'admin' ? '管理员' : user.role === 'premium' ? '高级用户' : '普通用户'}
                  </Tag>
                </Space>

                <Upload
                  showUploadList={false}
                  customRequest={handleAvatarUpload}
                  accept="image/*"
                >
                  <Button icon={<UploadOutlined />} type="primary" block>
                    修改上传头像
                  </Button>
                </Upload>
                <Button icon={<EditOutlined />} block onClick={() => setPasswordModalOpen(true)}>
                  修改密码
                </Button>
              </Space>
            </Card>
          </Col>

          <Col xs={24} md={16} lg={17}>
            <Card
              title="用户信息"
              style={{ height: '100%', borderRadius: 20, boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)' }}
              styles={{ body: { height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' } }}
            >
              <Descriptions
                column={1}
                bordered
                size="middle"
                styles={{
                  label: { width: 110, background: '#f8fafc', fontWeight: 600 },
                  content: { background: '#fff' },
                }}
              >
              <Descriptions.Item label="用户名">{user.username}</Descriptions.Item>
              <Descriptions.Item label="昵称">
                <Space>
                  {user.nickname || '未设置'}
                  <Button type="link" icon={<EditOutlined />} onClick={() => setNicknameModalOpen(true)}>
                    修改昵称
                  </Button>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="邮箱">
                <Space>
                  {user.email}
                  <Tag color={user.email_verified ? 'green' : 'orange'}>
                    {user.email_verified ? '已验证' : '未验证'}
                  </Tag>
                  <Button type="link" icon={<MailOutlined />} onClick={() => setEmailModalOpen(true)}>
                    换绑邮箱
                  </Button>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="手机号">
                <Space>
                  {user.phone || '未绑定'}
                  <Tag color={user.phone_verified ? 'green' : 'orange'}>
                    {user.phone_verified ? '已验证' : '未验证'}
                  </Tag>
                  <Button type="link" icon={<PhoneOutlined />} onClick={() => setPhoneModalOpen(true)}>
                    换绑手机号
                  </Button>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="账号状态">
                <Tag color={user.status === 'active' ? 'green' : user.status === 'inactive' ? 'orange' : 'red'}>
                  {user.status === 'active' ? '正常' : user.status === 'inactive' ? '未激活' : '已封禁'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="注册时间">{new Date(user.created_at).toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="最后更新">{new Date(user.updated_at).toLocaleString()}</Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>
      </div>

      <Modal
        title="修改昵称"
        open={nicknameModalOpen}
        onCancel={() => setNicknameModalOpen(false)}
        onOk={() => nicknameForm.submit()}
        okText="保存"
      >
        <Form
          form={nicknameForm}
          layout="vertical"
          initialValues={{ nickname: user.nickname || user.username }}
          onFinish={handleNicknameFinish}
        >
          <Form.Item
            label="新的昵称"
            name="nickname"
            rules={[
              { required: true, message: '请输入昵称' },
              { min: 2, max: 20, message: '昵称长度需在2-20个字符之间' },
            ]}
          >
            <Input placeholder="请输入新的昵称" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="换绑邮箱"
        open={emailModalOpen}
        onCancel={() => setEmailModalOpen(false)}
        onOk={() => emailForm.submit()}
        okText="保存"
      >
        <Form form={emailForm} layout="vertical" initialValues={{ email: user.email }} onFinish={handleEmailFinish}>
          <Form.Item
            label="新的邮箱"
            name="email"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入正确的邮箱格式' },
            ]}
          >
            <Input placeholder="请输入新的邮箱" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="换绑手机号"
        open={phoneModalOpen}
        onCancel={() => setPhoneModalOpen(false)}
        onOk={() => phoneForm.submit()}
        okText="保存"
      >
        <Form form={phoneForm} layout="vertical" initialValues={{ phone: user.phone || '' }} onFinish={handlePhoneFinish}>
          <Form.Item
            label="新的手机号"
            name="phone"
            rules={[
              { required: true, message: '请输入手机号' },
              { pattern: /^1\d{10}$/, message: '请输入正确的手机号' },
            ]}
          >
            <Input placeholder="请输入新的手机号" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="修改密码"
        open={passwordModalOpen}
        onCancel={() => setPasswordModalOpen(false)}
        onOk={() => passwordForm.submit()}
        okText="保存"
      >
        <Form form={passwordForm} layout="vertical" onFinish={handlePasswordFinish}>
          <Form.Item
            label="旧密码"
            name="oldPassword"
            rules={[{ required: true, message: '请输入旧密码' }]}
          >
            <Input.Password placeholder="请输入旧密码" />
          </Form.Item>
          <Form.Item
            label="新密码"
            name="newPassword"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码长度不能少于6位' },
            ]}
          >
            <Input.Password placeholder="请输入新密码" />
          </Form.Item>
          <Form.Item
            label="确认新密码"
            name="confirmPassword"
            dependencies={["newPassword"]}
            rules={[
              { required: true, message: '请再次输入新密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve()
                  }
                  return Promise.reject(new Error('两次输入的新密码不一致'))
                },
              }),
            ]}
          >
            <Input.Password placeholder="请再次输入新密码" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
})

export default Profile
