import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { observer } from 'mobx-react-lite'
import { userStore } from '@/store'

interface ProtectedRouteProps {
  children: React.ReactNode
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = observer(({ children }) => {
  const location = useLocation()

  // 如果用户未登录，重定向到登录页面，并保存当前路径
  if (!userStore.isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // 如果用户已登录，渲染子组件
  return <>{children}</>
})

export default ProtectedRoute
