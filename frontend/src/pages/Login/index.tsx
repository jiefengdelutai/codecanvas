import React, { useState, useEffect } from 'react'
import { Form, Input, Button, Typography } from 'antd'
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { observer } from 'mobx-react-lite'
import { userStore } from '@/store'
import Header from '@/components/Header'
import styles from './index.module.css'

const { Title, Text } = Typography

interface LoginForm {
  username: string
  password: string
}

interface RegisterForm {
  username: string
  email: string
  password: string
  nickname?: string
}

const Login: React.FC = observer(() => {
  const navigate = useNavigate()
  const [isLogin, setIsLogin] = useState(true)
  const [loginForm] = Form.useForm<LoginForm>()
  const [registerForm] = Form.useForm<RegisterForm>()

  // 检查是否已登录，如果已登录则跳转到首页
  useEffect(() => {
    if (userStore.isLoggedIn) {
      navigate('/')
    }
  }, [navigate])

  const handleLogin = async (values: LoginForm) => {
    const success = await userStore.login(values)
    if (success) {
      navigate('/')
    }
  }

  const handleRegister = async (values: RegisterForm) => {
    const registerData = {
      username: values.username,
      email: values.email,
      password: values.password,
      nickname: values.nickname || values.username,
    }
    
    const success = await userStore.register(registerData)
    if (success) {
      navigate('/')
    }
  }

  return (
    <div className={styles.loginContainer}>
      <Header />
      <div className={styles.loginBackground}></div>
      
      <div className={styles.loginContent}>
        {/* 左侧 - 欢迎信息和登录 */}
        <div className={styles.loginLeft}>
          <div className={styles.welcomeSection}>
            <Title level={1} className={styles.welcomeTitle}>
              欢迎使用可视化快速开发平台!
            </Title>
            <Text className={styles.welcomeSubtitle}>
              请登录您的账号
            </Text>
            
            {!isLogin && (
              <Button 
                type="primary" 
                size="large" 
                className={styles.switchBtn}
                onClick={() => setIsLogin(true)}
              >
                登录
              </Button>
            )}
          </div>

          {isLogin && (
            <div className={styles.formSection}>
              <Form
                form={loginForm}
                name="login"
                onFinish={handleLogin}
                layout="vertical"
                size="large"
              >
                <Form.Item
                  name="username"
                  rules={[
                    { required: true, message: '请输入用户名或邮箱!' },
                  ]}
                >
                  <Input
                    prefix={<UserOutlined />}
                    placeholder="用户名或邮箱"
                    className={styles.loginInput}
                  />
                </Form.Item>

                <Form.Item
                  name="password"
                  rules={[{ required: true, message: '请输入密码!' }]}
                >
                  <Input.Password
                    prefix={<LockOutlined />}
                    placeholder="密码"
                    className={styles.loginInput}
                  />
                </Form.Item>

                <Form.Item>
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    size="large"
                    className={styles.submitBtn}
                    loading={userStore.isLoading}
                    block
                  >
                    登录
                  </Button>
                </Form.Item>
              </Form>
            </div>
          )}
        </div>

        {/* 右侧 - 注册 */}
        <div className={styles.loginRight}>
          <div className={styles.registerSection}>
            <Title level={2} className={styles.registerTitle}>
              注册账号
            </Title>
            
            <Text className={styles.registerSubtitle}>
              使用邮箱注册
            </Text>

            {!isLogin && (
              <Form
                form={registerForm}
                name="register"
                onFinish={handleRegister}
                layout="vertical"
                size="large"
              >
                <Form.Item
                  name="username"
                  rules={[
                    { required: true, message: '请输入用户名!' },
                    { min: 3, message: '用户名至少3位!' },
                    { max: 50, message: '用户名不能超过50位!' }
                  ]}
                >
                  <Input
                    prefix={<UserOutlined />}
                    placeholder="用户名"
                    className={styles.registerInput}
                  />
                </Form.Item>

                <Form.Item
                  name="nickname"
                >
                  <Input
                    prefix={<UserOutlined />}
                    placeholder="昵称（可选）"
                    className={styles.registerInput}
                  />
                </Form.Item>

                <Form.Item
                  name="email"
                  rules={[
                    { required: true, message: '请输入邮箱!' },
                    { type: 'email', message: '请输入有效的邮箱地址!' }
                  ]}
                >
                  <Input
                    prefix={<MailOutlined />}
                    placeholder="邮箱地址"
                    className={styles.registerInput}
                  />
                </Form.Item>

                <Form.Item
                  name="password"
                  rules={[
                    { required: true, message: '请输入密码!' },
                    { min: 6, message: '密码至少6位!' }
                  ]}
                >
                  <Input.Password
                    prefix={<LockOutlined />}
                    placeholder="密码"
                    className={styles.registerInput}
                  />
                </Form.Item>

                <Form.Item>
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    size="large"
                    className={`${styles.submitBtn} ${styles.registerBtn}`}
                    loading={userStore.isLoading}
                    block
                  >
                    注册
                  </Button>
                </Form.Item>
              </Form>
            )}

            {isLogin && (
              <Button 
                type="primary" 
                size="large" 
                className={`${styles.switchBtn} ${styles.registerSwitchBtn}`}
                onClick={() => setIsLogin(false)}
              >
                注册
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
})

export default Login
