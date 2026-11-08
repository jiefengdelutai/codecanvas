import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Home from '../pages/Home'
import MyProjects from '../pages/MyProjects'
import TemplateMarket from '../pages/TemplateMarket'
import DesignSpace from '../pages/DesignSpace'
import Profile from '../pages/Profile'
import Login from '../pages/Login'
import ProtectedRoute from '../components/ProtectedRoute'
import AuthGuard from '../components/AuthGuard'

const AppRouter: React.FC = () => {
  return (
    <Routes>
      {/* 受保护的路由 - 需要登录才能访问 */}
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/my-projects" 
        element={
          <ProtectedRoute>
            <MyProjects />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/template-market" 
        element={
          <ProtectedRoute>
            <TemplateMarket />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/design-space" 
        element={
          <ProtectedRoute>
            <DesignSpace />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/profile" 
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } 
      />
      
      {/* 认证路由 - 已登录用户访问时会重定向 */}
      <Route 
        path="/login" 
        element={
          <AuthGuard>
            <Login />
          </AuthGuard>
        } 
      />
    </Routes>
  )
}

export default AppRouter
