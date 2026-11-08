import React from 'react'
import { BrowserRouter as Router, useLocation } from 'react-router-dom'
import { Layout } from 'antd'
import Header from './components/Header'
import AppRouter from './router'
import { DesignSpaceProvider, useDesignSpace } from './contexts/DesignSpaceContext'
import './App.css'

const { Content } = Layout

const AppLayout: React.FC = () => {
  const location = useLocation()
  const isLoginPage = location.pathname === '/login'
  const isDesignSpacePage = location.pathname === '/design-space'
  
  // 获取DesignSpace Context状态
  const designSpaceContext = useDesignSpace()

  if (isLoginPage) {
    return <AppRouter />
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header 
        mode={isDesignSpacePage ? designSpaceContext.mode : undefined}
        onModeChange={isDesignSpacePage ? designSpaceContext.setMode : undefined}
      />
      <Content style={{ marginTop: '64px' }}>
        <AppRouter />
      </Content>
    </Layout>
  )
}

const App: React.FC = () => {
  return (
    <Router>
      <DesignSpaceProvider>
        <AppLayout />
      </DesignSpaceProvider>
    </Router>
  )
}

export default App

