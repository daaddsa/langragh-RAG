# 智搜研报助手 (AI Research Assistant) - 前端说明文档

## 1. 项目概述

智搜研报助手是一个基于 React + Vite 开发的现代化 AI 研报生成工具。它集成了实时联网搜索、智能对话、多模型支持以及 PDF 研报导出功能，旨在帮助用户快速获取信息并整理成专业的分析报告。

**主要特性：**
*   **🤖 多模型支持**：无缝切换 OpenAI, DeepSeek, Kimi (Moonshot), Qwen (Aliyun) 等主流大模型。
*   **🌐 实时联网**：基于 Tavily API 实现深度联网搜索，提供准确、实时的信息源。
*   **💬 智能会话**：支持 Markdown 渲染、代码高亮，提供清晰的对话展示。
*   **📂 会话管理**：本地持久化存储对话历史，支持多会话切换、删除、重命名及标签管理。
*   **📄 研报导出**：一键将对话内容生成为格式规范的 PDF 研报。
*   **🌓 个性化体验**：支持深色/浅色主题切换，响应式侧边栏设计（移动端/桌面端适配）。

---

## 2. 技术栈

*   **核心框架**: React 18
*   **构建工具**: Vite
*   **样式方案**: Styled Components (CSS-in-JS)
*   **图标库**: React Icons (Feather Icons)
*   **Markdown 渲染**: React Markdown + Remark GFM
*   **代码高亮**: React Syntax Highlighter
*   **HTTP 客户端**: Axios / Fetch API
*   **状态管理**: React Hooks (useState, useEffect, useMemo, useCallback) + LocalStorage

---

## 3. 核心功能实现原理

### 3.1 智能对话交互 (Chat Interaction)
前端通过标准的 HTTP 请求与后端 AI 代理进行交互，获取完整的回答内容。

*   **实现方式**: 使用 `fetch` API 发送 POST 请求。
*   **代码逻辑**:
    1.  **发起请求**: 向后端 `/chat` 接口发送请求，包含用户输入及 API 配置。
    2.  **等待响应**: 等待后端完成所有思考步骤（包括联网搜索、整理信息等）。
    3.  **渲染内容**: 接收到完整的 JSON 响应后，一次性将 AI 回复追加到消息列表中。
    4.  **状态管理**: 使用 `isLoading` 状态控制加载动画（Loading Dots），给予用户明确的等待反馈。

### 3.2 深度联网搜索 (Deep Search Integration)
项目并不直接在前端调用搜索 API，而是通过后端代理。

*   **交互流程**:
    1.  用户发送问题（如“分析最新AI趋势”）。
    2.  后端触发 LangGraph 工作流，自动调用 Tavily 搜索工具获取信息。
    3.  **结果展示**: 后端将搜索结果整合进最终回答中，前端负责以 Markdown 格式清晰展示包含引用和链接的最终内容。

### 3.3 本地会话管理与持久化 (Session Management)
为了保证用户刷新页面后不丢失对话，实现了基于 LocalStorage 的纯前端会话管理系统。

*   **数据结构**: 使用一个对象存储所有会话，Key 为 `uuid`，Value 包含标题、时间戳、标签和消息列表。
*   **持久化机制**:
    *   **加载**: App 初始化时从 `localStorage.getItem('chatSessions')` 读取数据。
    *   **保存**: 使用 `useEffect` 监听 `sessions` 状态变化，一旦有新消息或配置变更，立即同步写入 LocalStorage。
*   **性能优化**: 将状态更新逻辑与持久化逻辑分离，对话结束后执行一次磁盘写入，减少 I/O 开销。

### 3.4 PDF 研报生成 (PDF Export)
将网页上的对话内容转换为专业的 PDF 文档。

*   **实现方式**: 前端发起请求 -> 后端生成二进制流 -> 前端下载。
*   **流程细节**:
    1.  用户点击“导出 PDF”按钮。
    2.  前端收集当前会话的完整 `messages` 数组和用户自定义的 `reportTitle`。
    3.  调用 `/pdf` 接口，设置 `responseType: 'blob'`。
    4.  **下载触发**: 接收到 Blob 数据后，在内存中创建临时的 `<a>` 标签 (`URL.createObjectURL`)，模拟点击下载，随后释放内存。

### 3.5 主题切换与样式管理 (Theming)
实现了系统级的深色/浅色模式切换。

*   **实现方式**: `styled-components` 的 `ThemeProvider`。
*   **配置**: 在 `themes.js` 中定义了 `lightTheme` 和 `darkTheme` 两个对象，包含背景色、文字颜色、边框色等变量。
*   **动态应用**: `App.jsx` 中维护 `currentTheme` 状态，切换时自动将对应的 CSS 变量注入到全局样式 (`GlobalStyles`) 中，实现一键换肤。

---

## 4. 目录结构

```
frontend-new/
├── public/              # 静态资源
├── src/
│   ├── assets/          # 项目资源文件
│   ├── components/      # UI 组件
│   │   ├── ChatArea.jsx # 对话主区域 (消息展示、Markdown渲染)
│   │   ├── InputArea.jsx# 输入区域 (自动调整高度、发送逻辑)
│   │   └── Sidebar.jsx  # 侧边栏 (配置、历史记录、标签管理)
│   ├── App.jsx          # 根组件 (路由、全局状态、主题管理)
│   ├── GlobalStyles.js  # 全局样式定义 (CSS Reset, Variables)
│   ├── themes.js        # 主题配置文件 (Light/Dark Mode)
│   └── main.jsx         # 入口文件
├── index.html           # HTML 模板
├── vite.config.js       # Vite 配置文件 (代理设置)
└── package.json         # 依赖管理
```

---

## 5. 快速开始

### 5.1 环境要求
*   Node.js >= 16.0.0
*   npm 或 yarn

### 5.2 安装依赖
在 `frontend-new` 目录下执行：
```bash
npm install
```

### 5.3 启动开发服务器
```bash
npm run dev
```
应用将运行在 `http://localhost:5173`。

> **注意**: 前端依赖后端 API 服务 (Port 8000)。请确保后端服务已启动。

---

## 6. 功能模块说明

### 6.1 侧边栏 (Sidebar)
*   **API 配置**: 设置模型厂商、API Key 和 Tavily Key。
*   **会话管理**:
    *   **新对话**: 点击 "+" 按钮创建新会话。
    *   **历史记录**: 查看最近的对话列表，按时间倒序排列。
    *   **删除**: 鼠标悬停在会话上可点击垃圾桶图标删除。
*   **当前对话设置**:
    *   **标题编辑**: 自定义当前对话的标题（导出 PDF 时用作文件名）。
    *   **标签 (Tags)**: 添加/删除标签以便于分类管理。
    *   **导出 PDF**: 将当前对话记录导出为 PDF 文件。
*   **主题切换**: 顶部切换按钮可在深色/浅色模式间切换。

### 6.2 对话区域 (ChatArea)
*   **Markdown 渲染**: 完整支持 Markdown 格式（表格、列表、引用）。
*   **代码高亮**: 自动识别代码块并进行语法高亮。
*   **交互操作**:
    *   **复制**: 每一条消息支持一键复制内容。
    *   **分享**: 支持分享文本内容。
*   **快捷指令**: 新对话空白页展示常用指令（如“如何写研报”），点击即发。

### 6.3 输入区域 (InputArea)
*   **自适应高度**: 输入框随内容自动增高。
*   **快捷发送**: 支持 `Enter` 发送，`Shift + Enter` 换行。

---

## 7. 常见问题 (FAQ)

**Q: 为什么提示 "API Key 额度已用尽"？**
A: 请检查您在侧边栏填写的 OpenAI/DeepSeek API Key 是否有余额。

**Q: 导出 PDF 失败？**
A: 请确保后端服务正常运行，且对话内容不为空。后端需要安装中文字体 (SimSun) 以正确渲染中文。

**Q: 如何连接本地 LLM (如 Ollama)？**
A: 在侧边栏选择 "OpenAI" 格式，将 Base URL 修改为 `http://localhost:11434/v1` (Ollama 默认地址)，并在 API Key 栏任意填写字符即可。

---

## 8. 贡献指南

1.  Fork 本仓库
2.  创建特性分支 (`git checkout -b feature/AmazingFeature`)
3.  提交更改 (`git commit -m 'Add some AmazingFeature'`)
4.  推送到分支 (`git push origin feature/AmazingFeature`)
5.  提交 Pull Request
