# CodeCanvas 项目代码统计报告

> 统计时间: 2026-05-26

## 📊 总体统计

| 指标 | 数值 |
|------|------|
| 总文件数 | **116 个** |
| 总行数 | **19,388 行** |
| 总代码行数 | **15,733 行** |
| 总注释行数 | 1,383 行 |
| 总空白行数 | 2,272 行 |
| 平均注释率 | 8.79% |

## 📱 前端代码统计 (frontend/src)

### 基本指标

| 指标 | 数值 |
|------|------|
| 文件数量 | **86 个** |
| 总行数 | **14,826 行** |
| 代码行数 | **12,166 行** (77.33%) |
| 注释行数 | 937 行 |
| 空白行数 | 1,723 行 |
| 注释率 | 7.70% |

### 按文件类型分类

| 文件类型 | 文件数 | 代码行数 | 占比 |
|---------|--------|---------|------|
| `.tsx` (React组件) | 41 个 | 7,128 行 | 58.57% |
| `.css` (样式文件) | 26 个 | 2,909 行 | 23.91% |
| `.ts` (TypeScript) | 18 个 | 2,106 行 | 17.31% |
| `.scss` (SCSS) | 1 个 | 23 行 | 0.19% |

### 前端技术栈

- **框架**: React + TypeScript
- **状态管理**: MobX
- **UI组件库**: Ant Design
- **路由**: React Router v6
- **代码编辑器**: Monaco Editor
- **样式方案**: CSS Modules + SCSS

## 🔧 后端代码统计 (backend/src)

### 基本指标

| 指标 | 数值 |
|------|------|
| 文件数量 | **30 个** |
| 总行数 | **4,562 行** |
| 代码行数 | **3,567 行** (22.67%) |
| 注释行数 | 446 行 |
| 空白行数 | 549 行 |
| 注释率 | 12.50% |

### 按文件类型分类

| 文件类型 | 文件数 | 代码行数 | 占比 |
|---------|--------|---------|------|
| `.ts` (TypeScript) | 29 个 | 3,529 行 | 98.93% |
| `.sql` (SQL脚本) | 1 个 | 38 行 | 1.07% |

### 后端技术栈

- **运行环境**: Node.js
- **框架**: Express
- **数据库**: MySQL
- **ORM**: Sequelize
- **实时通信**: WebSocket (ws)
- **身份认证**: JWT

## 📈 代码分布分析

### 前后端代码占比

```
前端: ████████████████████████████████████████████████████████████████████████████ 77.33%
后端: ██████████████████████████ 22.67%
```

### 代码质量对比

| 维度 | 前端 | 后端 |
|------|------|------|
| 文件数 | 86 个 | 30 个 |
| 平均每文件行数 | 141.5 行 | 118.9 行 |
| 注释率 | 7.70% | 12.50% |
| 代码密度 | 82.06% | 78.18% |

## 🎯 代码结构分析

### 前端主要模块

1. **页面组件** (Pages)
   - Home - 首页
   - DesignSpace - 设计工作区
   - MyProjects - 我的项目
   - TemplateMarket - 模板市场
   - Login - 登录页面

2. **功能组件** (Components)
   - CodeMode - 代码编辑模式
   - VisualMode - 可视化编辑模式
   - StyleDrawer - 样式编辑面板
   - AIChat - AI对话组件
   - ChatHistory - 聊天历史
   - Header - 导航头部
   - WorkSpaceHeader - 工作区头部

3. **服务层** (Services)
   - authService - 认证服务
   - projectService - 项目服务
   - templateService - 模板服务
   - chatService - 聊天服务
   - aiService - AI服务
   - websocketService - WebSocket服务

4. **状态管理** (Stores)
   - userStore - 用户状态
   - projectStore - 项目状态

### 后端主要模块

1. **路由层** (Routes)
   - auth - 用户认证
   - projects - 项目管理
   - templates - 模板管理
   - versions - 版本管理
   - chat - 聊天管理
   - collaborators - 协作管理

2. **服务层** (Services)
   - AuthService - 认证服务
   - ProjectService - 项目服务
   - TemplateService - 模板服务
   - TemplateRecommendService - 模板推荐服务
   - ChatService - 聊天服务
   - WebSocketService - WebSocket服务

3. **数据模型** (Models)
   - User - 用户模型
   - Project - 项目模型
   - Template - 模板模型
   - Version - 版本模型
   - ChatSession - 聊天会话模型
   - ChatMessage - 聊天消息模型
   - ProjectCollaborator - 协作者模型

4. **中间件** (Middleware)
   - authMiddleware - 身份验证中间件
   - errorHandler - 错误处理中间件

## 💡 关键特性实现

### 1. 智能推荐系统
- **位置**: `backend/src/services/templateRecommendService.ts`
- **代码量**: ~400行
- **算法**: 混合推荐策略（热度、新鲜度、语义相关性、用户偏好、项目上下文）

### 2. 检索增强生成 (RAG)
- **位置**: 前端AI对话集成
- **功能**: 基于项目上下文的智能对话

### 3. 实时协作
- **位置**: `backend/src/services/websocketService.ts`
- **功能**: WebSocket实时通信、在线状态同步

### 4. 可视化编辑
- **位置**: `frontend/src/components/VisualMode`
- **功能**: 元素选中、样式编辑、实时预览

### 5. 版本管理
- **位置**: `backend/src/services/versionService.ts`
- **功能**: 版本创建、回滚、差异对比

## 📝 代码质量评估

### 优点

✅ **代码组织清晰**: 前后端分离，模块化设计
✅ **类型安全**: 全面使用TypeScript
✅ **注释适中**: 平均注释率8.79%，符合行业标准
✅ **组件复用**: React组件化开发，代码复用率高
✅ **API规范**: RESTful API设计规范

### 改进建议

💡 **提高注释率**: 前端注释率可提升至10%以上
💡 **单元测试**: 建议添加测试代码
💡 **文档完善**: 增加API文档和组件文档

## 📊 统计方法说明

- **统计工具**: 自定义Node.js脚本
- **统计范围**: 
  - 前端: `frontend/src` 目录
  - 后端: `backend/src` 目录
- **包含文件类型**:
  - 前端: `.ts`, `.tsx`, `.js`, `.jsx`, `.css`, `.scss`, `.less`
  - 后端: `.ts`, `.js`, `.sql`
- **排除目录**: `node_modules`, `dist`, `build`, `.next`
- **代码行定义**: 排除空行和纯注释行

---

**报告生成时间**: 2026-05-26
**项目名称**: CodeCanvas - AI辅助可视化快速开发平台
