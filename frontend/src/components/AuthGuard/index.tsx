import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { observer } from 'mobx-react-lite'
import { userStore } from '@/store'

interface AuthGuardProps {
  children: React.ReactNode
}

const AuthGuard: React.FC<AuthGuardProps> = observer(({ children }) => {
  const location = useLocation()

  // 如果用户已登录，重定向到首页或之前想要访问的页面
  if (userStore.isLoggedIn) {
    const from = location.state?.from?.pathname || '/'
    return <Navigate to={from} replace />
  }

  // 如果用户未登录，渲染登录页面
  return <>{children}</>
})

export default AuthGuard
