import React, { useState, useEffect, useMemo } from 'react'
import { List, Avatar, Button, Input, Spin } from 'antd'
import { SendOutlined, RobotOutlined, UserOutlined, ArrowLeftOutlined, CopyOutlined, CheckOutlined } from '@ant-design/icons'
import { callAIWithText, AIMode, detectIntent } from '../../services/aiService'
import { ChatService, ChatMessage } from '../../services/chatService'
import { aiApi } from '../../services/api'
import { useDesignSpace } from '../../contexts/DesignSpaceContext'
import { SelectedElementInfo } from '../Preview'
import styles from './index.module.css'

const { TextArea } = Input

// 解析消息内容，识别JSON代码块
const parseMessageContent = (content: string) => {
  const parts: Array<{ type: 'text' | 'json'; content: string }> = []
  
  // 匹配 ```json ... ``` 代码块
  const jsonBlockRegex = /```json\s*([\s\S]*?)```/g
  let lastIndex = 0
  let match
  
  while ((match = jsonBlockRegex.exec(content)) !== null) {
    // 添加代码块之前的文本
    if (match.index > lastIndex) {
      const textBefore = content.slice(lastIndex, match.index).trim()
      if (textBefore) {
        parts.push({ type: 'text', content: textBefore })
      }
    }
    
    // 添加JSON代码块
    parts.push({ type: 'json', content: match[1].trim() })
    lastIndex = match.index + match[0].length
  }
  
  // 添加最后剩余的文本
  if (lastIndex < content.length) {
    const remainingText = content.slice(lastIndex).trim()
    if (remainingText) {
      parts.push({ type: 'text', content: remainingText })
    }
  }
  
  // 如果没有找到任何代码块，返回原始内容
  if (parts.length === 0) {
    parts.push({ type: 'text', content })
  }
  
  return parts
}

// JSON代码块组件
const JsonCodeBlock: React.FC<{ content: string }> = ({ content }) => {
  const [copied, setCopied] = useState(false)
  
  // 尝试解析并格式化JSON
  const formattedJson = useMemo(() => {
    try {
      const parsed = JSON.parse(content)
      return JSON.stringify(parsed, null, 2)
    } catch {
      return content
    }
  }, [content])
  
  // 尝试解析JSON对象以分别展示html/css/js
  const parsedCode = useMemo(() => {
    try {
      const parsed = JSON.parse(content)
      if (parsed && typeof parsed === 'object' && ('html' in parsed || 'css' in parsed || 'js' in parsed)) {
        return parsed as { html?: string; css?: string; js?: string }
      }
    } catch {
      // 解析失败，返回null
    }
    return null
  }, [content])
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('复制失败:', err)
    }
  }
  
  // 如果是代码对象，分别展示各部分
  if (parsedCode) {
    return (
      <div className={styles.codeBlockContainer}>
        <div className={styles.codeBlockHeader}>
          <span className={styles.codeBlockTitle}>代码</span>
          <Button
            type="text"
            size="small"
            icon={copied ? <CheckOutlined /> : <CopyOutlined />}
            onClick={handleCopy}
            className={styles.copyButton}
          >
            {copied ? '已复制' : '复制'}
          </Button>
        </div>
        <div className={styles.codeBlockContent}>
          {parsedCode.html && (
            <div className={styles.codeSection}>
              <div className={styles.codeSectionHeader}>HTML</div>
              <pre className={styles.codeText}>{parsedCode.html}</pre>
            </div>
          )}
          {parsedCode.css && (
            <div className={styles.codeSection}>
              <div className={styles.codeSectionHeader}>CSS</div>
              <pre className={styles.codeText}>{parsedCode.css}</pre>
            </div>
          )}
          {parsedCode.js && (
            <div className={styles.codeSection}>
              <div className={styles.codeSectionHeader}>JavaScript</div>
              <pre className={styles.codeText}>{parsedCode.js}</pre>
            </div>
          )}
        </div>
      </div>
    )
  }
  
  // 普通JSON展示
  return (
    <div className={styles.codeBlockContainer}>
      <div className={styles.codeBlockHeader}>
        <span className={styles.codeBlockTitle}>JSON</span>
        <Button
          type="text"
          size="small"
          icon={copied ? <CheckOutlined /> : <CopyOutlined />}
          onClick={handleCopy}
          className={styles.copyButton}
        >
          {copied ? '已复制' : '复制'}
        </Button>
      </div>
      <pre className={styles.jsonCode}>{formattedJson}</pre>
    </div>
  )
}

// 消息内容渲染组件
const MessageContent: React.FC<{ content: string }> = ({ content }) => {
  const parts = useMemo(() => parseMessageContent(content), [content])
  
  return (
    <>
      {parts.map((part, index) => (
        part.type === 'json' 
          ? <JsonCodeBlock key={index} content={part.content} />
          : <span key={index} className={styles.textContent}>{part.content}</span>
      ))}
    </>
  )
}

interface AIChatProps {
  sessionId?: number
  onBackToHistory?: () => void
  className?: string
  style?: React.CSSProperties
  selectedElement?: SelectedElementInfo | null
}

/**
 * AI对话组件
 * 功能：支持数据库存储的AI对话，包含返回按钮
 */
const AIChat: React.FC<AIChatProps> = ({ sessionId, onBackToHistory, className, style, selectedElement }) => {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [messagesLoading, setMessagesLoading] = useState(false)
  
  // 获取refreshCode方法用于刷新Preview
  const { refreshCode } = useDesignSpace()

  // 加载会话消息
  useEffect(() => {
    const loadMessages = async () => {
      if (!sessionId) return
      
      try {
        setMessagesLoading(true)
        const messages = await ChatService.getSessionMessages(sessionId)
        setChatMessages(messages)
      } catch (error) {
        console.error('加载消息失败:', error)
      } finally {
        setMessagesLoading(false)
      }
    }

    loadMessages()
  }, [sessionId])

  // AI对话处理函数
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !sessionId) return

    const userMessageContent = inputMessage.trim()
    setInputMessage('')
    setIsLoading(true)

    try {
      const intent = await detectIntent(userMessageContent)
      let actualContent = userMessageContent

      if (selectedElement) {
        const elementInfo = {
          path: selectedElement.elementPath,
          tagName: selectedElement.tagName,
          id: selectedElement.id || undefined,
          className: selectedElement.className || undefined,
          currentStyles: selectedElement.computedStyles
        }
        actualContent = `${userMessageContent}\n\n当前选中的元素信息：\n${JSON.stringify(elementInfo, null, 2)}\n\n请仅修改该选中元素的样式，不要修改其他元素。`
      }

      const userMessage = await ChatService.sendMessage(sessionId, 'user', userMessageContent)
      setChatMessages(prev => [...prev, userMessage])

      const tempAiMessageId = Date.now()
      let streamingContent = ''
      setChatMessages(prev => [...prev, {
        id: tempAiMessageId,
        sessionId: sessionId,
        type: 'assistant' as const,
        content: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }])

      let aiResponse = ''
      const currentProjectId = localStorage.getItem('currentProjectId') || undefined

      if (intent === 'ask') {
        try {
          const projectId = currentProjectId || ''
          const response: any = await aiApi.chat(userMessageContent, {
            rag: 'on',
            intent: 'ask',
            projectId,
            sessionId,
          })
          const askReply = response?.data?.reply || response?.reply || ''
          aiResponse = await callAIWithText(userMessageContent, (chunk) => {
            streamingContent += chunk
            setChatMessages(prev => prev.map(msg =>
              msg.id === tempAiMessageId
                ? { ...msg, content: streamingContent }
                : msg
            ))
          }, false, AIMode.GENERATE, '', {
            question: userMessageContent,
            retrievedInfo: askReply,
          })
        } catch (error) {
          console.warn('查询接口调用失败，使用兜底文案:', error)
          aiResponse = `抱歉，当前无法获取回答：${userMessageContent}`
          streamingContent = aiResponse
          setChatMessages(prev => prev.map(msg =>
            msg.id === tempAiMessageId ? { ...msg, content: streamingContent } : msg
          ))
        }
      } else if (intent === 'modify') {
        let projectCode = ''
        if (currentProjectId) {
          try {
            const contextRes: any = await aiApi.getProjectContext(currentProjectId)
            projectCode = contextRes?.data?.projectCode || contextRes?.projectCode || ''
          } catch (error) {
            console.warn('获取项目上下文失败，使用空上下文继续:', error)
          }
        }

        aiResponse = await callAIWithText(actualContent, (chunk) => {
          streamingContent += chunk
          setChatMessages(prev => prev.map(msg =>
            msg.id === tempAiMessageId
              ? { ...msg, content: streamingContent }
              : msg
          ))
        }, true, AIMode.OPTIMIZE, projectCode)
      } else {
        aiResponse = await callAIWithText(actualContent, (chunk) => {
          streamingContent += chunk
          setChatMessages(prev => prev.map(msg =>
            msg.id === tempAiMessageId
              ? { ...msg, content: streamingContent }
              : msg
          ))
        }, true, AIMode.GENERATE)
      }

      const aiMessage = await ChatService.sendMessage(sessionId, 'assistant', aiResponse)
      setChatMessages(prev => prev.map(msg => 
        msg.id === tempAiMessageId ? aiMessage : msg
      ))

      refreshCode()
    } catch (error) {
      console.error('发送消息失败:', error)
      const errorMessage: ChatMessage = {
        id: Date.now(),
        sessionId: sessionId,
        type: 'assistant',
        content: '抱歉，AI服务暂时不可用，请稍后重试。',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      setChatMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  // 处理Enter键发送消息
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className={`${styles.agentContent} ${className || ''}`} style={style}>
      {/* 头部返回按钮 */}
      {onBackToHistory && (
        <div className={styles.chatHeader}>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={onBackToHistory}
            className={styles.backButton}
          >
            返回
          </Button>
        </div>
      )}
      
      <div className={styles.chatContainer}>
        <div className={styles.chatMessages}>
          {messagesLoading ? (
            <div className={styles.loadingContainer}>
              <Spin size="large" />
              <div className={styles.loadingText}>正在加载对话...</div>
            </div>
          ) : chatMessages.length === 0 ? (
            <div className={styles.welcomeMessage}>
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <RobotOutlined style={{ fontSize: '48px', color: '#1890ff', marginBottom: '16px' }} />
                <h3>AI 助手</h3>
                <p style={{ color: '#666', marginBottom: '16px' }}>
                  我可以帮您通过自然语言描述来修改页面样式和布局
                </p>
                <p style={{ fontSize: '12px', color: '#999' }}>
                  例如：「把标题改成红色」「增加按钮的圆角」「调整页面布局」
                </p>
              </div>
            </div>
          ) : (
            <List
              dataSource={chatMessages}
              renderItem={(message) => (
                <List.Item style={{ border: 'none', padding: '8px 0', display: 'block' }}>
                  <div className={`${styles.messageItem} ${message.type === 'user' ? styles.userMessage : styles.assistantMessage}`}>
                    <div className={styles.messageAvatar}>
                      {message.type === 'user' ? (
                        <Avatar size="small" icon={<UserOutlined />} />
                      ) : (
                        <Avatar size="small" icon={<RobotOutlined />} style={{ backgroundColor: '#1890ff' }} />
                      )}
                    </div>
                    <div className={styles.messageContent}>
                      <div className={styles.messageBubble}>
                        {message.content ? (
                          message.type === 'assistant' 
                            ? <MessageContent content={message.content} />
                            : message.content
                        ) : (
                          message.type === 'assistant' && (
                            <div className={styles.typingIndicator}>
                              <span></span>
                              <span></span>
                              <span></span>
                            </div>
                          )
                        )}
                      </div>
                      <div className={styles.messageTime}>
                        {new Date(message.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                </List.Item>
              )}
            />
          )}
        </div>
        <div className={styles.chatInput}>
          <TextArea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="描述您想要的修改..."
            autoSize={{ minRows: 3, maxRows: 3 }}
            style={{ marginBottom: '12px' }}
          />
          <div className={styles.inputControls}>
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className={styles.sendButton}
            >
              发送
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AIChat

