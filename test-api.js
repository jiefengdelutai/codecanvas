// 简单的API测试脚本
const axios = require('axios')

const API_BASE = 'http://localhost:5000/api'

async function testAPI() {
  console.log('🧪 开始测试 CodeCanvas API...\n')

  try {
    // 1. 测试健康检查
    console.log('1. 测试健康检查...')
    const healthResponse = await axios.get('http://localhost:5000/health')
    console.log('✅ 健康检查通过:', healthResponse.data.message)
    console.log()

    // 2. 测试用户注册
    console.log('2. 测试用户注册...')
    const registerData = {
      username: 'testuser2024',
      email: 'testuser2024@example.com',
      password: 'test123456',
      nickname: '测试用户2024'
    }

    try {
      const registerResponse = await axios.post(`${API_BASE}/auth/register`, registerData)
      console.log('✅ 注册成功:', registerResponse.data.message)
      console.log('用户信息:', registerResponse.data.data.user.username)
      console.log('Token:', registerResponse.data.data.token.substring(0, 20) + '...')
    } catch (error) {
      if (error.response?.data?.message?.includes('已存在')) {
        console.log('ℹ️  用户已存在，跳过注册测试')
      } else {
        throw error
      }
    }
    console.log()

    // 3. 测试用户登录
    console.log('3. 测试用户登录...')
    const loginData = {
      username: 'admin',
      password: 'admin123'
    }

    const loginResponse = await axios.post(`${API_BASE}/auth/login`, loginData)
    console.log('✅ 登录成功:', loginResponse.data.message)
    console.log('用户角色:', loginResponse.data.data.user.role)
    console.log('AI配额:', `${loginResponse.data.data.user.ai_quota_used}/${loginResponse.data.data.user.ai_quota_limit}`)
    
    const token = loginResponse.data.data.token
    console.log()

    // 4. 测试获取用户信息
    console.log('4. 测试获取用户信息...')
    const userResponse = await axios.get(`${API_BASE}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    console.log('✅ 获取用户信息成功')
    console.log('用户名:', userResponse.data.data.username)
    console.log('邮箱:', userResponse.data.data.email)
    console.log('项目数量:', `${userResponse.data.data.project_count}/${userResponse.data.data.project_limit}`)
    console.log()

    // 5. 测试检查用户名
    console.log('5. 测试检查用户名可用性...')
    const checkUsernameResponse = await axios.get(`${API_BASE}/auth/check-username/newuser123`)
    console.log('✅ 检查用户名成功:', checkUsernameResponse.data.message)
    console.log()

    // 6. 测试登出
    console.log('6. 测试用户登出...')
    const logoutResponse = await axios.post(`${API_BASE}/auth/logout`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    console.log('✅ 登出成功:', logoutResponse.data.message)
    console.log()

    console.log('🎉 所有API测试通过！')

  } catch (error) {
    console.error('❌ API测试失败:')
    if (error.response) {
      console.error('状态码:', error.response.status)
      console.error('错误信息:', error.response.data?.message || error.response.data)
    } else if (error.request) {
      console.error('网络错误: 无法连接到服务器')
      console.error('请确保后端服务已启动 (npm run dev)')
    } else {
      console.error('错误:', error.message)
    }
  }
}

// 运行测试
testAPI()
