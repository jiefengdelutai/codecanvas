import React, { useState, useEffect } from 'react'
import { Spin } from 'antd'
import AIChat from '../AIChat'
import ChatHistory from '../ChatHistory'
import { ChatService, ChatSession } from '../../services/chatService'
import { SelectedElementInfo } from '../Preview'
import styles from './index.module.css'

interface ChatManagerProps {
  className?: string
  style?: React.CSSProperties
  selectedElement?: SelectedElementInfo | null
}

/**
 * 聊天管理器组件
 * 功能：管理AIChat和ChatHistory之间的切换和状态
 */
const ChatManager: React.FC<ChatManagerProps> = ({ className, style, selectedElement }) => {
  const [currentView, setCurrentView] = useState<'chat' | 'history'>('chat')
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null)
  const [loading, setLoading] = useState(true)

  // 初始化：获取或创建活跃会话
  useEffect(() => {
    const initializeSession = async () => {
      try {
        setLoading(true)
        const activeSession = await ChatService.getActiveSession()
        setCurrentSession(activeSession)
      } catch (error) {
        console.error('初始化会话失败:', error)
      } finally {
        setLoading(false)
      }
    }

    initializeSession()
  }, [])

  // 处理返回到历史记录
  const handleBackToHistory = () => {
    setCurrentView('history')
  }

  // 处理选择会话
  const handleSelectSession = (session: ChatSession) => {
    setCurrentSession(session)
    setCurrentView('chat')
  }

  if (loading) {
    return (
      <div className={`${styles.chatManager} ${className || ''}`} style={style}>
        <div className={styles.loadingContainer}>
          <Spin size="large" />
          <div className={styles.loadingText}>正在加载对话...</div>
        </div>
      </div>
    )
  }

  return (
    <div className={`${styles.chatManager} ${className || ''}`} style={style}>
      {currentView === 'chat' ? (
        <AIChat
          sessionId={currentSession?.id}
          onBackToHistory={handleBackToHistory}
          selectedElement={selectedElement}
        />
      ) : (
        <ChatHistory
          onSelectSession={handleSelectSession}
        />
      )}
    </div>
  )
}

export default ChatManager
