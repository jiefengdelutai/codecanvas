import express from 'express'
import http from 'http'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { connectDB } from './config/database'
import { initDatabase } from './models'
import { websocketService } from './services/websocketService'

// 路由导入
import authRoutes from './routes/auth'
import projectRoutes from './routes/projects'
import aiRoutes from './routes/ai'
import templateRoutes from './routes/templates'
import versionRoutes from './routes/versions'
import deployRoutes from './routes/deploy'
import chatRoutes from './routes/chat'
import collaboratorRoutes from './routes/collaborators'

// 加载环境变量
dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// 中间件
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

// 健康检查
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'CodeCanvas Backend is running!',
    timestamp: new Date().toISOString()
  })
})

// API路由
app.use('/api/auth', authRoutes)
app.use('/api/projects', projectRoutes)
app.use('/api/ai', aiRoutes)
app.use('/api/templates', templateRoutes)
app.use('/api/versions', versionRoutes)
app.use('/api/deploy', deployRoutes)
app.use('/api/chat', chatRoutes)
app.use('/api/collaborators', collaboratorRoutes)

// 错误处理中间件
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err.stack)
  res.status(err.status || 500).json({
    success: false,
    message: err.message || '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  })
})

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: '接口不存在'
  })
})

// 数据库连接和初始化
const initDB = async () => {
  const isConnected = await connectDB()
  if (isConnected) {
    await initDatabase()
    console.log('✅ 数据库初始化成功')
    return true
  } else {
    console.log('⚠️  数据库连接失败，将使用内存存储模式')
    return false
  }
}

// 启动服务器
const startServer = async () => {
  try {
    await initDB()
    
    // 创建HTTP服务器
    const httpServer = http.createServer(app)
    
    // 初始化WebSocket服务
    websocketService.initialize(httpServer)
    
    httpServer.listen(PORT, () => {
      console.log('========================================')
      console.log(`🚀 CodeCanvas 后端服务已启动`)
      console.log(`📍 服务地址: http://localhost:${PORT}`)
      console.log(`🏥 健康检查: http://localhost:${PORT}/health`)
      console.log(`🔌 WebSocket: ws://localhost:${PORT}`)
      console.log(`🌍 环境: ${process.env.NODE_ENV || 'development'}`)
      console.log('========================================')
    })
  } catch (error) {
    console.error('❌ 服务器启动失败:', error)
    process.exit(1)
  }
}

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('👋 收到 SIGTERM 信号，正在关闭服务...')
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('👋 收到 SIGINT 信号，正在关闭服务...')
  process.exit(0)
})

startServer().catch(console.error)

export default app

