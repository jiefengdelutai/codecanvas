import { Server as HTTPServer } from 'http'
import { Server, Socket } from 'socket.io'
import { UserService } from './userService'

interface OnlineUser {
  userId: number
  username: string
  nickname?: string
  avatar_url?: string
  socketId: string
}

interface ProjectRoom {
  projectId: string
  users: Map<number, OnlineUser>
}

class WebSocketService {
  private io: Server | null = null
  private projectRooms: Map<string, ProjectRoom> = new Map()

  /**
   * 初始化WebSocket服务器
   */
  initialize(httpServer: HTTPServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
        credentials: true,
      },
    })

    this.setupEventHandlers()
    console.log('✅ WebSocket服务器已启动')
  }

  /**
   * 设置事件处理器
   */
  private setupEventHandlers() {
    if (!this.io) return

    this.io.on('connection', (socket: Socket) => {
      console.log(`🔌 客户端连接: ${socket.id}`)

      // 用户加入项目房间
      socket.on('join-project', async (data: { projectId: string; token: string }) => {
        try {
          const { projectId, token } = data

          // 验证token并获取用户信息
          const decoded = UserService.verifyToken(token)
          if (!decoded) {
            socket.emit('error', { message: '无效的认证令牌' })
            return
          }

          const userResult = await UserService.getUserById(decoded.userId)
          if (!userResult.success || !userResult.data) {
            socket.emit('error', { message: '用户不存在' })
            return
          }

          const user = userResult.data

          // 加入Socket.IO房间
          socket.join(projectId)

          // 创建或获取项目房间
          if (!this.projectRooms.has(projectId)) {
            this.projectRooms.set(projectId, {
              projectId,
              users: new Map(),
            })
          }

          const room = this.projectRooms.get(projectId)!
          const onlineUser: OnlineUser = {
            userId: user.id,
            username: user.username,
            nickname: user.nickname,
            avatar_url: user.avatar_url,
            socketId: socket.id,
          }

          room.users.set(user.id, onlineUser)

          // 通知房间内其他用户
          socket.to(projectId).emit('user-joined', {
            user: {
              userId: user.id,
              username: user.username,
              nickname: user.nickname,
              avatar_url: user.avatar_url,
            },
          })

          // 发送当前在线用户列表给新加入的用户
          const onlineUsers = Array.from(room.users.values()).map(u => ({
            userId: u.userId,
            username: u.username,
            nickname: u.nickname,
            avatar_url: u.avatar_url,
          }))

          socket.emit('online-users', { users: onlineUsers })

          console.log(`👤 用户 ${user.username} 加入项目 ${projectId}`)
        } catch (error) {
          console.error('加入项目失败:', error)
          socket.emit('error', { message: '加入项目失败' })
        }
      })

      // 用户离开项目房间
      socket.on('leave-project', (data: { projectId: string }) => {
        this.handleUserLeave(socket, data.projectId)
      })

      // 用户正在编辑
      socket.on('editing', (data: { projectId: string }) => {
        const { projectId } = data
        socket.to(projectId).emit('user-editing', {
          socketId: socket.id,
        })
      })

      // 断开连接
      socket.on('disconnect', () => {
        console.log(`🔌 客户端断开: ${socket.id}`)
        this.handleDisconnect(socket)
      })
    })
  }

  /**
   * 处理用户离开项目
   */
  private handleUserLeave(socket: Socket, projectId: string) {
    const room = this.projectRooms.get(projectId)
    if (!room) return

    // 查找并移除用户
    let leftUser: OnlineUser | undefined
    for (const [userId, user] of room.users.entries()) {
      if (user.socketId === socket.id) {
        leftUser = user
        room.users.delete(userId)
        break
      }
    }

    if (leftUser) {
      // 通知房间内其他用户
      socket.to(projectId).emit('user-left', {
        userId: leftUser.userId,
        username: leftUser.username,
      })

      console.log(`👤 用户 ${leftUser.username} 离开项目 ${projectId}`)
    }

    // 离开Socket.IO房间
    socket.leave(projectId)

    // 如果房间为空，删除房间
    if (room.users.size === 0) {
      this.projectRooms.delete(projectId)
    }
  }

  /**
   * 处理断开连接
   */
  private handleDisconnect(socket: Socket) {
    // 遍历所有房间，移除该socket
    for (const [projectId, room] of this.projectRooms.entries()) {
      let leftUser: OnlineUser | undefined
      for (const [userId, user] of room.users.entries()) {
        if (user.socketId === socket.id) {
          leftUser = user
          room.users.delete(userId)
          break
        }
      }

      if (leftUser) {
        // 通知房间内其他用户
        socket.to(projectId).emit('user-left', {
          userId: leftUser.userId,
          username: leftUser.username,
        })

        console.log(`👤 用户 ${leftUser.username} 断开连接`)
      }

      // 如果房间为空，删除房间
      if (room.users.size === 0) {
        this.projectRooms.delete(projectId)
      }
    }
  }

  /**
   * 获取项目的在线用户
   */
  getOnlineUsers(projectId: string) {
    const room = this.projectRooms.get(projectId)
    if (!room) return []

    return Array.from(room.users.values()).map(u => ({
      userId: u.userId,
      username: u.username,
      nickname: u.nickname,
      avatar_url: u.avatar_url,
    }))
  }
}

export const websocketService = new WebSocketService()
