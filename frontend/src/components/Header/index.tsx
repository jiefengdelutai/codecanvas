import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Layout, Typography, Dropdown, Avatar, Space, Tabs, Segmented } from 'antd'
import { UserOutlined, LogoutOutlined, SettingOutlined, ProjectOutlined, AppstoreOutlined, EditOutlined } from '@ant-design/icons'
import type { MenuProps } from 'antd'
import { observer } from 'mobx-react-lite'
import { userStore } from '@/store'
import { useDesignSpace } from '@/contexts/DesignSpaceContext'

const { Header: AntHeader } = Layout
const { Title, Text } = Typography

interface HeaderProps {
  mode?: 'design' | 'code'
  onModeChange?: (mode: 'design' | 'code') => void
}

const Header: React.FC<HeaderProps> = observer(({ mode, onModeChange }) => {
  const navigate = useNavigate()
  const location = useLocation()
  
  // 检查是否在DesignSpace页面
  const isDesignSpacePage = location.pathname === '/design-space'
  
  // 获取工作模式状态和样式同步功能（在所有页面都可以获取）
  const { isInWorkMode, hasUnsavedChanges, syncStylesToHTML } = useDesignSpace()
  
  // 获取当前激活的tab
  const getActiveTab = () => {
    if (location.pathname === '/' || location.pathname === '/design-space') return 'project-design'
    if (location.pathname === '/my-projects') return 'my-projects'
    if (location.pathname === '/template-market') return 'template-market'
    return ''
  }
  
  // 处理tab切换
  const handleTabChange = async (key: string) => {
    // 如果当前在DesignSpace页面且有未保存的变更，先同步样式
    if (isDesignSpacePage && isInWorkMode) {
      if (hasUnsavedChanges()) {
        console.log('检测到未保存的样式变更，正在同步...')
        await syncStylesToHTML()
      }
    }
    
    if (key === 'project-design') {
      // 根据工作模式状态决定跳转到Home还是DesignSpace
      if (isInWorkMode) {
        navigate('/design-space')
      } else {
        navigate('/')
      }
    } else if (key === 'my-projects') {
      navigate('/my-projects')
    } else if (key === 'template-market') {
      navigate('/template-market')
    }
  }
  
  // Tabs配置
  const tabItems = [
    {
      key: 'project-design',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <EditOutlined />
          项目设计
        </span>
      )
    },
    {
      key: 'my-projects',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ProjectOutlined />
          我的项目
        </span>
      )
    },
    {
      key: 'template-market',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AppstoreOutlined />
          模板市场
        </span>
      )
    }
  ]
  
  // 处理用户菜单点击事件
  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    switch (key) {
      case 'profile':
        navigate('/profile')
        break
      case 'logout':
        userStore.logout()
        navigate('/login')
        break
      default:
        break
    }
  }

  // 处理logo点击事件
  const handleLogoClick = async () => {
    // 如果当前在DesignSpace页面且有未保存的变更，先同步样式
    if (isDesignSpacePage && isInWorkMode) {
      if (hasUnsavedChanges()) {
        console.log('Logo点击：检测到未保存的样式变更，正在同步...')
        await syncStylesToHTML()
      }
    }
    
    if (userStore.isLoggedIn) {
      // 如果处于工作模式，跳转到DesignSpace，否则跳转到首页
      if (isInWorkMode) {
        navigate('/design-space')
      } else {
        navigate('/')
      }
    } else {
      navigate('/login')
    }
  }

  // 下拉菜单配置 - 根据登录状态动态生成
  const getMenuItems = (): MenuProps['items'] => {
    if (!userStore.isLoggedIn) {
      return []
    }

    return [
      {
        key: 'user-info',
        label: (
          <div style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
            <Space>
              <Avatar size={40} icon={<UserOutlined />} />
              <Text strong>{userStore.user?.nickname || userStore.user?.username || '用户'}</Text>
            </Space>
          </div>
        ),
        disabled: true,
      },
      {
        key: 'profile',
        label: '个人中心',
        icon: <SettingOutlined />,
      },
      {
        key: 'logout',
        label: '退出',
        icon: <LogoutOutlined />,
        danger: true,
      },
    ]
  }

  return (
    <AntHeader 
      style={{ 
        background: '#ffffffff', 
        padding: '0 24px 0 24px', 
        paddingRight: '34px',
        display: 'flex', 
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}
    >
      <div 
        onClick={handleLogoClick}
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px',
          cursor: 'pointer',
          transition: 'opacity 0.2s'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = '0.8'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '1'
        }}
      >
        <Title level={3} style={{ color: 'black', margin: 0 }}>
          可视化快速开发平台
        </Title>
      </div>
      
      {/* 中央区域：在DesignSpace页面显示模式切换器 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
        {isDesignSpacePage && mode && onModeChange && (
          <Segmented
            value={mode}
            onChange={(value) => onModeChange(value as 'design' | 'code')}
            options={[
              {
                label: '可视化',
                value: 'design',
              },
              {
                label: '代码',
                value: 'code',
              },
            ]}
            size="large"
            style={{
              backgroundColor: '#f5f5f5',
              padding: '2px',
              borderRadius: '8px'
            }}
          />
        )}
      </div>
      
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '32px', height: '100%' }}>
        {/* 只有登录后才显示导航选项 */}
        {userStore.isLoggedIn && (
          <Tabs
            activeKey={getActiveTab()}
            onChange={handleTabChange}
            items={tabItems}
            size="large"
            style={{
              marginBottom: 0,
              minHeight: 'auto',
              height: '100%'
            }}
            tabBarStyle={{
              marginBottom: 0,
              border: 'none',
              height: '100%',
              display: 'flex',
              alignItems: 'flex-end'
            }}
          />
        )}
        
        {/* 只有登录后才显示头像下拉菜单 */}
        {userStore.isLoggedIn && (
          <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
            <Dropdown 
              menu={{ items: getMenuItems(), onClick: handleMenuClick }}
              placement="bottomRight"
              trigger={['hover']}
            >
              <Avatar 
                size={32} 
                icon={<UserOutlined />} 
                style={{ cursor: 'pointer' }}
              />
            </Dropdown>
          </div>
        )}
      </div>
    </AntHeader>
  )
})

export default Header
