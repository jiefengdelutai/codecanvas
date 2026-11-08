import express from 'express'
import multer from 'multer'
import { UserService } from '../services/userService'

const router = express.Router()
const upload = multer({ storage: multer.memoryStorage() })

router.post('/register', async (req, res) => {
  try {
    const { username, email, password, nickname } = req.body
    if (!username || !email || !password) return res.status(400).json({ success: false, message: '用户名、邮箱和密码不能为空' })
    if (username.length < 3 || username.length > 50) return res.status(400).json({ success: false, message: '用户名长度必须在3-50个字符之间' })
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) return res.status(400).json({ success: false, message: '邮箱格式不正确' })
    if (password.length < 6) return res.status(400).json({ success: false, message: '密码长度不能少于6位' })
    const result = await UserService.register({ username, email, password, nickname })
    res.status(result.success ? 201 : 400).json(result)
  } catch (error: any) {
    console.error('注册接口错误:', error)
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
})

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body
    if (!username || !password) return res.status(400).json({ success: false, message: '用户名和密码不能为空' })
    const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress
    const result = await UserService.login({ username, password, ip: clientIP })
    res.status(result.success ? 200 : 401).json(result)
  } catch (error: any) {
    console.error('登录接口错误:', error)
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
})

router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) return res.status(401).json({ success: false, message: '未提供认证令牌' })
    const decoded = UserService.verifyToken(token)
    if (!decoded) return res.status(401).json({ success: false, message: '无效的认证令牌' })
    const result = await UserService.getUserById(decoded.userId)
    res.status(result.success ? 200 : 404).json(result)
  } catch (error: any) {
    console.error('获取用户信息错误:', error)
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
})

router.get('/avatar/:userId', async (req, res) => {
  try {
    const userId = Number(req.params.userId)
    const result = await UserService.getAvatarByUserId(userId)
    if (!result.success || !result.data) {
      return res.status(404).json({ success: false, message: '头像不存在' })
    }
    return res.json({ success: true, data: result.data })
  } catch (error: any) {
    console.error('获取头像错误:', error)
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
})

router.post('/avatar', upload.single('avatar'), async (req, res) => {
  try {
    console.log('🖼️ 头像上传请求到达')
    console.log('🧾 Content-Type:', req.headers['content-type'])
    console.log('📦 req.body:', req.body)
    console.log('📎 req.file exists:', !!req.file)
    console.log('📎 req.file meta:', req.file ? { originalname: req.file.originalname, mimetype: req.file.mimetype, size: req.file.size } : null)

    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) {
      console.log('❌ 头像上传失败：未提供认证令牌')
      return res.status(401).json({ success: false, message: '未提供认证令牌' })
    }
    const decoded = UserService.verifyToken(token)
    if (!decoded) {
      console.log('❌ 头像上传失败：无效的认证令牌')
      return res.status(401).json({ success: false, message: '无效的认证令牌' })
    }
    if (!req.file) {
      console.log('❌ 头像上传失败：未上传头像文件')
      return res.status(400).json({ success: false, message: '未上传头像文件' })
    }

    const fs = await import('fs')
    const path = await import('path')
    const uploadDir = path.join(__dirname, '../../uploads/avatars')
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    const ext = (req.file.originalname.split('.').pop() || 'png').toLowerCase()
    const filename = `avatar_${decoded.userId}_${Date.now()}.${ext}`
    const filePath = path.join(uploadDir, filename)
    fs.writeFileSync(filePath, req.file.buffer)
    const avatarPath = `/uploads/avatars/${filename}`

    const result = await UserService.updateUserProfile(decoded.userId, {
      avatar_url: avatarPath,
      avatar_mime: req.file.mimetype,
    })

    console.log('✅ 头像上传处理结果:', { success: result.success, message: result.message, avatarPath })
    res.status(result.success ? 200 : 400).json(result)
  } catch (error: any) {
    console.error('上传头像错误:', error)
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
})

router.put('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) return res.status(401).json({ success: false, message: '未提供认证令牌' })
    const decoded = UserService.verifyToken(token)
    if (!decoded) return res.status(401).json({ success: false, message: '无效的认证令牌' })

    const { nickname, email, phone } = req.body
    const result = await UserService.updateUserProfile(decoded.userId, { nickname, email, phone })
    res.status(result.success ? 200 : 400).json(result)
  } catch (error: any) {
    console.error('更新用户资料错误:', error)
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
})

router.post('/change-password', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) return res.status(401).json({ success: false, message: '未提供认证令牌' })
    const decoded = UserService.verifyToken(token)
    if (!decoded) return res.status(401).json({ success: false, message: '无效的认证令牌' })

    const { oldPassword, newPassword } = req.body
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ success: false, message: '旧密码和新密码不能为空' })
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: '新密码长度不能少于6位' })
    }

    const result = await UserService.changePassword(decoded.userId, oldPassword, newPassword)
    res.status(result.success ? 200 : 400).json(result)
  } catch (error: any) {
    console.error('修改密码错误:', error)
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
})

router.post('/logout', (_req, res) => {
  res.json({ success: true, message: '登出成功' })
})

router.get('/check-username/:username', async (_req, res) => res.json({ success: true, available: true, message: '用户名可用' }))
router.get('/check-email/:email', async (_req, res) => res.json({ success: true, available: true, message: '邮箱可用' }))

export default router
