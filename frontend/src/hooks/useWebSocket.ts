import { useEffect, useState, useCallback, useRef } from 'react'
import { io, Socket } from 'socket.io-client'

interface OnlineUser {
  userId: number
  username: string
  nickname?: string
  avatar_url?: string
}

interface UseWebSocketOptions {
  projectId: string | null
  enabled?: boolean
}

export const useWebSocket = ({ projectId, enabled = true }: UseWebSocketOptions) => {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([])
  const socketRef = useRef<Socket | null>(null)

  // 连接WebSocket
  useEffect(() => {
    if (!enabled || !projectId) {
      return
    }

    const token = localStorage.getItem('token')
    if (!token) {
      console.warn('未找到认证令牌，无法连接WebSocket')
      return
    }

    // 创建Socket连接
    const newSocket = io('http://localhost:5000', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    })

    socketRef.current = newSocket
    setSocket(newSocket)

    // 连接成功
    newSocket.on('connect', () => {
      console.log('✅ WebSocket已连接')
      setIsConnected(true)
      
      // 加入项目房间
      newSocket.emit('join-project', { projectId, token })
    })

    // 断开连接
    newSocket.on('disconnect', () => {
      console.log('❌ WebSocket已断开')
      setIsConnected(false)
    })

    // 接收在线用户列表
    newSocket.on('online-users', (data: { users: OnlineUser[] }) => {
      console.log('📋 在线用户列表:', data.users)
      setOnlineUsers(data.users)
    })

    // 用户加入
    newSocket.on('user-joined', (data: { user: OnlineUser }) => {
      console.log('👤 用户加入:', data.user.username)
      setOnlineUsers(prev => {
        // 检查用户是否已存在
        const exists = prev.some(u => u.userId === data.user.userId)
        if (exists) return prev
        return [...prev, data.user]
      })
    })

    // 用户离开
    newSocket.on('user-left', (data: { userId: number; username: string }) => {
      console.log('👤 用户离开:', data.username)
      setOnlineUsers(prev => prev.filter(u => u.userId !== data.userId))
    })

    // 错误处理
    newSocket.on('error', (data: { message: string }) => {
      console.error('WebSocket错误:', data.message)
    })

    // 清理函数
    return () => {
      if (newSocket) {
        newSocket.emit('leave-project', { projectId })
        newSocket.disconnect()
      }
      socketRef.current = null
      setSocket(null)
      setIsConnected(false)
      setOnlineUsers([])
    }
  }, [projectId, enabled])

  // 发送正在编辑事件
  const sendEditingEvent = useCallback(() => {
    if (socket && isConnected && projectId) {
      socket.emit('editing', { projectId })
    }
  }, [socket, isConnected, projectId])

  return {
    socket,
    isConnected,
    onlineUsers,
    sendEditingEvent,
  }
}
