import React from 'react'
import { Button, Tooltip, Modal, Avatar, Space } from 'antd'
import { ArrowLeftOutlined, SaveOutlined, EditOutlined, EyeOutlined, ExclamationCircleOutlined, InfoCircleOutlined, UserOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useDesignSpace } from '../../contexts/DesignSpaceContext'
import { Project } from '@/types/project'
import styles from './index.module.css'

interface OnlineUser {
  userId: number
  username: string
  nickname?: string
  avatar_url?: string
}

interface WorkSpaceHeaderProps {
  onSave?: () => void
  isEditMode?: boolean
  onEditModeToggle?: () => void
  onPreview?: () => void
  currentProject?: Project | null
  onProjectInfoClick?: () => void
  onlineUsers?: OnlineUser[]
  currentUserId?: number
}

const WorkSpaceHeader: React.FC<WorkSpaceHeaderProps> = ({
  onSave,
  isEditMode,
  onEditModeToggle,
  onPreview,
  currentProject,
  onProjectInfoClick,
  onlineUsers = [],
  currentUserId
}) => {
  const navigate = useNavigate()
  const { mode, setIsInWorkMode, syncStylesToHTML, hasUnsavedChanges } = useDesignSpace()

  const handleBack = () => {
    // 检查是否有未保存的变更
    if (hasUnsavedChanges()) {
      Modal.confirm({
        title: '有未保存的样式修改',
        icon: <ExclamationCircleOutlined />,
        content: '您有未保存的样式修改，是否要先保存再离开？',
        okText: '保存并离开',
        cancelText: '直接离开',
        onOk: async () => {
          // 保存样式并离开
          await syncStylesToHTML()
          setIsInWorkMode(false)
          navigate('/')
        },
        onCancel: () => {
          // 直接离开，不保存
          setIsInWorkMode(false)
          navigate('/')
        }
      })
    } else {
      // 没有未保存的变更，直接离开
      setIsInWorkMode(false)
      navigate('/')
    }
  }

  const handleSave = async () => {
    // 保存前先同步样式到HTML
    await syncStylesToHTML()
    
    if (onSave) {
      onSave()
    }
  }

  return (
    <div className={styles.header}>
      <div className={styles.leftSection}>
        <Tooltip title="返回首页">
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={handleBack}
          >
            返回
          </Button>
        </Tooltip>
        
        {currentProject && (
          <Tooltip title={currentProject.name}>
            <Button 
              icon={<InfoCircleOutlined />} 
              onClick={onProjectInfoClick}
              className={styles.projectButton}
            >
              {currentProject.name}
            </Button>
          </Tooltip>
        )}
        
        <Tooltip title="保存项目">
          <Button 
            type="primary"
            icon={<SaveOutlined />} 
            onClick={handleSave}
          >
            保存
          </Button>
        </Tooltip>
        
        {/* 在线协作用户显示 */}
        {onlineUsers.length > 0 && (
          <div className={styles.onlineUsers}>
            <span className={styles.onlineLabel}>在线协作：</span>
            <Space size={4}>
              {onlineUsers.map(user => {
                const isCurrentUser = user.userId === currentUserId
                const displayName = user.nickname || user.username
                
                return (
                  <Tooltip
                    key={user.userId}
                    title={
                      <div>
                        <div>{displayName}</div>
                        {isCurrentUser && <div style={{ fontSize: 12, color: '#95de64' }}>(我)</div>}
                      </div>
                    }
                  >
                    <Avatar
                      src={user.avatar_url}
                      icon={<UserOutlined />}
                      size="small"
                      style={{
                        border: isCurrentUser ? '2px solid #1890ff' : '1px solid #d9d9d9',
                        cursor: 'pointer',
                      }}
                    />
                  </Tooltip>
                )
              })}
            </Space>
          </div>
        )}
      </div>
      
      <div className={styles.centerSection}>
        {/* 只在可视化模式时显示编辑和预览按钮 */}
        {mode === 'design' && (
          <>
            <Tooltip 
              title={isEditMode ? '编辑中' : '编辑'}
              placement="bottom"
              mouseEnterDelay={0.5}
            >
              <Button
                type={isEditMode ? 'primary' : 'default'}
                icon={<EditOutlined />}
                onClick={onEditModeToggle}
                className={`${styles.navButton} ${isEditMode ? styles.active : ''}`}
              >
              </Button>
            </Tooltip>
            
            <Tooltip 
              title="预览"
              placement="bottom"
              mouseEnterDelay={0.5}
            >
              <Button
                type="default"
                icon={<EyeOutlined />}
                onClick={onPreview}
                className={styles.navButton}
              >
              </Button>
            </Tooltip>
          </>
        )}
      </div>
      
      <div className={styles.rightSection}>
        {/* 右侧可以放置其他操作按钮 */}
      </div>
    </div>
  )
}

export default WorkSpaceHeader