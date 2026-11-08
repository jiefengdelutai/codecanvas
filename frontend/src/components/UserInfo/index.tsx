import React from 'react'
import { Card, Avatar, Tag, Progress, Button, Space, Descriptions } from 'antd'
import { UserOutlined, LogoutOutlined } from '@ant-design/icons'
import { observer } from 'mobx-react-lite'
import { useNavigate } from 'react-router-dom'
import { userStore } from '@/store'

const UserInfo: React.FC = observer(() => {
  const navigate = useNavigate()

  const handleLogout = async () => {
    await userStore.logout()
    navigate('/login')
  }

  if (!userStore.isLoggedIn || !userStore.user) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <p>请先登录</p>
          <Button type="primary" onClick={() => navigate('/login')}>
            去登录
          </Button>
        </div>
      </Card>
    )
  }

  const { user } = userStore
  const aiQuota = userStore.aiQuotaUsage
  const projectUsage = userStore.projectUsage

  return (
    <Card
      title="用户信息"
      extra={
        <Button 
          type="text" 
          icon={<LogoutOutlined />} 
          onClick={handleLogout}
          danger
        >
          退出登录
        </Button>
      }
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 基本信息 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Avatar 
            size={64} 
            icon={<UserOutlined />} 
            src={user.avatar_url}
          />
          <div>
            <h3 style={{ margin: 0 }}>{user.nickname || user.username}</h3>
            <p style={{ margin: '4px 0', color: '#666' }}>@{user.username}</p>
            <Space>
              <Tag color={user.role === 'admin' ? 'red' : user.role === 'premium' ? 'gold' : 'blue'}>
                {user.role === 'admin' ? '管理员' : user.role === 'premium' ? '高级用户' : '普通用户'}
              </Tag>
              <Tag color={user.status === 'active' ? 'green' : 'orange'}>
                {user.status === 'active' ? '正常' : '受限'}
              </Tag>
            </Space>
          </div>
        </div>

        {/* 详细信息 */}
        <Descriptions column={1} size="small">
          <Descriptions.Item label="邮箱">{user.email}</Descriptions.Item>
          <Descriptions.Item label="注册时间">
            {new Date(user.created_at).toLocaleDateString()}
          </Descriptions.Item>
          <Descriptions.Item label="最后更新">
            {new Date(user.updated_at).toLocaleDateString()}
          </Descriptions.Item>
        </Descriptions>

        {/* AI配额使用情况 */}
        <div>
          <h4>AI 调用配额</h4>
          <Progress 
            percent={Math.round(aiQuota.percentage)} 
            format={() => `${aiQuota.used} / ${aiQuota.limit}`}
            status={aiQuota.percentage > 90 ? 'exception' : 'normal'}
          />
        </div>

        {/* 项目数量使用情况 */}
        <div>
          <h4>项目数量</h4>
          <Progress 
            percent={Math.round(projectUsage.percentage)} 
            format={() => `${projectUsage.count} / ${projectUsage.limit}`}
            status={projectUsage.percentage > 90 ? 'exception' : 'normal'}
          />
        </div>
      </Space>
    </Card>
  )
})

export default UserInfo
