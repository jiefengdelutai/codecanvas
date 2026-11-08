import React, { useState, useEffect } from 'react'
import { List, Button, Modal, Input, Popconfirm, Typography, Empty, Spin } from 'antd'
import { 
  PlusOutlined, 
  DeleteOutlined, 
  EditOutlined, 
  MessageOutlined,
  ClockCircleOutlined 
} from '@ant-design/icons'
import { ChatService, ChatSession } from '../../services/chatService'
import styles from './index.module.css'

const { Title, Text } = Typography

interface ChatHistoryProps {
  onSelectSession: (session: ChatSession) => void
  className?: string
  style?: React.CSSProperties
}

/**
 * 聊天历史管理组件
 * 功能：查看历史对话、新建对话、删除对话、编辑标题
 */
const ChatHistory: React.FC<ChatHistoryProps> = ({ onSelectSession, className, style }) => {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [loading, setLoading] = useState(false)
  const [editingSession, setEditingSession] = useState<ChatSession | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [isEditModalVisible, setIsEditModalVisible] = useState(false)

  // 加载会话列表
  const loadSessions = async () => {
    setLoading(true)
    try {
      const sessionList = await ChatService.getUserSessions()
      setSessions(sessionList)
    } catch (error) {
      console.error('加载会话列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 组件挂载时加载数据
  useEffect(() => {
    loadSessions()
  }, [])

  // 创建新对话
  const handleCreateSession = async () => {
    try {
      const newSession = await ChatService.createSession('新对话')
      await loadSessions() // 重新加载列表
      onSelectSession(newSession) // 直接进入新对话
    } catch (error) {
      console.error('创建新对话失败:', error)
    }
  }

  // 选择对话
  const handleSelectSession = async (session: ChatSession) => {
    try {
      // 设置为活跃会话
      await ChatService.setActiveSession(session.id)
      onSelectSession(session)
    } catch (error) {
      console.error('选择对话失败:', error)
    }
  }

  // 删除对话
  const handleDeleteSession = async (sessionId: number) => {
    try {
      await ChatService.deleteSession(sessionId)
      await loadSessions() // 重新加载列表
    } catch (error) {
      console.error('删除对话失败:', error)
    }
  }

  // 开始编辑标题
  const handleStartEdit = (session: ChatSession) => {
    setEditingSession(session)
    setEditTitle(session.title)
    setIsEditModalVisible(true)
  }

  // 保存编辑的标题
  const handleSaveEdit = async () => {
    if (!editingSession || !editTitle.trim()) return

    try {
      await ChatService.updateSessionTitle(editingSession.id, editTitle.trim())
      setIsEditModalVisible(false)
      setEditingSession(null)
      setEditTitle('')
      await loadSessions() // 重新加载列表
    } catch (error) {
      console.error('更新标题失败:', error)
    }
  }

  // 取消编辑
  const handleCancelEdit = () => {
    setIsEditModalVisible(false)
    setEditingSession(null)
    setEditTitle('')
  }

  // 格式化时间
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    } else if (diffDays === 1) {
      return '昨天'
    } else if (diffDays < 7) {
      return `${diffDays}天前`
    } else {
      return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
    }
  }

  return (
    <div className={`${styles.chatHistory} ${className || ''}`} style={style}>
      {/* 头部 */}
      <div className={styles.header}>
        <Title level={4} style={{ margin: 0 }}>
          <MessageOutlined style={{ marginRight: 8 }} />
          对话历史
        </Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleCreateSession}
          className={styles.newButton}
        >
          新建对话
        </Button>
      </div>

      {/* 会话列表 */}
      <div className={styles.sessionList}>
        <Spin spinning={loading}>
          {sessions.length === 0 ? (
            <Empty
              description="暂无对话记录"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              style={{ marginTop: 60 }}
            >
              <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateSession}>
                创建第一个对话
              </Button>
            </Empty>
          ) : (
            <List
              dataSource={sessions}
              renderItem={(session) => (
                <List.Item className={styles.sessionItem}>
                  <div 
                    className={styles.sessionContent}
                    onClick={() => handleSelectSession(session)}
                  >
                    <div className={styles.sessionMain}>
                      <div className={styles.sessionTitle}>
                        {session.title}
                        {session.isActive && (
                          <span className={styles.activeTag}>当前</span>
                        )}
                      </div>
                      <div className={styles.sessionTime}>
                        <ClockCircleOutlined style={{ marginRight: 4 }} />
                        {formatTime(session.updatedAt)}
                      </div>
                    </div>
                    
                    {/* 最后一条消息预览 */}
                    {session.messages && session.messages.length > 0 && (
                      <div className={styles.lastMessage}>
                        <Text type="secondary" ellipsis>
                          {session.messages[0].content}
                        </Text>
                      </div>
                    )}
                  </div>

                  {/* 操作按钮 */}
                  <div className={styles.sessionActions}>
                    <Button
                      type="text"
                      size="small"
                      icon={<EditOutlined />}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleStartEdit(session)
                      }}
                      title="编辑标题"
                    />
                    <Popconfirm
                      title="确定要删除这个对话吗？"
                      description="删除后将无法恢复"
                      onConfirm={(e) => {
                        e?.stopPropagation()
                        handleDeleteSession(session.id)
                      }}
                      okText="删除"
                      cancelText="取消"
                      okType="danger"
                    >
                      <Button
                        type="text"
                        size="small"
                        icon={<DeleteOutlined />}
                        danger
                        onClick={(e) => e.stopPropagation()}
                        title="删除对话"
                      />
                    </Popconfirm>
                  </div>
                </List.Item>
              )}
            />
          )}
        </Spin>
      </div>

      {/* 编辑标题弹窗 */}
      <Modal
        title="编辑对话标题"
        open={isEditModalVisible}
        onOk={handleSaveEdit}
        onCancel={handleCancelEdit}
        okText="保存"
        cancelText="取消"
        width={400}
      >
        <Input
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          placeholder="请输入对话标题"
          maxLength={50}
          showCount
          onPressEnter={handleSaveEdit}
        />
      </Modal>
    </div>
  )
}

export default ChatHistory
