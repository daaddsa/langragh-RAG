import React, { useState, useEffect } from 'react';
import styled, { ThemeProvider } from 'styled-components';
import { v4 as uuidv4 } from 'uuid';
import { GlobalStyles } from './GlobalStyles';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import InputArea from './components/InputArea';
import { FiMenu } from 'react-icons/fi';
import { lightTheme, darkTheme } from './themes';

const AppContainer = styled.div`
  display: flex;
  height: 100vh;
  width: 100vw;
  background-color: var(--bg-color);
`;

const MainContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  height: 100%;
`;

const Header = styled.header`
  height: 48px;
  display: flex;
  align-items: center;
  padding: 0 20px;
  color: var(--text-secondary);
  font-size: 14px;
  
  @media (min-width: 769px) {
    /* On desktop, if sidebar is collapsed, we might want to show a menu button to expand it? 
       Actually, Sidebar component will handle the collapse toggle button internally or we pass a handler.
       Let's keep this header mainly for mobile or minimal info.
    */
    display: ${props => props.$isSidebarCollapsed ? 'flex' : 'none'};
  }
`;

const MenuButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  margin-right: 10px;
  color: var(--text-primary);
`;

import axios from 'axios';

// Move constants outside component to avoid recreation
const baseUrls = {
  "OpenAI": "https://api.openai.com/v1",
  "DeepSeek": "https://api.deepseek.com",
  "Moonshot (Kimi)": "https://api.moonshot.cn/v1",
  "Aliyun (Qwen)": "https://dashscope.aliyuncs.com/compatible-mode/v1",
};

const models = {
  "OpenAI": "gpt-3.5-turbo",
  "DeepSeek": "deepseek-chat",
  "Moonshot (Kimi)": "moonshot-v1-8k",
  "Aliyun (Qwen)": "qwen-plus",
};

function App() {

  const [isLoading, setIsLoading] = useState(false);
  
  // Mobile Sidebar State
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  // Desktop Sidebar State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // Chat History Management
  const [sessions, setSessions] = useState(() => {
    const saved = localStorage.getItem('chatSessions');
    return saved ? JSON.parse(saved) : {};
  });
  
  const [currentSessionId, setCurrentSessionId] = useState(() => {
    // Default to a new session if none exists
    return uuidv4();
  });

  const [messages, setMessages] = useState([]);

  // Load messages when currentSessionId changes
  useEffect(() => {
    if (sessions[currentSessionId]) {
      setMessages(sessions[currentSessionId].messages);
    } else {
      setMessages([]);
    }
  }, [currentSessionId, sessions]);

  // Save sessions to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('chatSessions', JSON.stringify(sessions));
  }, [sessions]);

  // Update current session messages
  const updateCurrentSession = React.useCallback((newMessages, shouldPersist = true) => {
    setMessages(newMessages);
    if (shouldPersist) {
        setSessions(prev => ({
            ...prev,
            [currentSessionId]: {
                id: currentSessionId,
                title: prev[currentSessionId]?.title || newMessages[0]?.content.slice(0, 20) || 'New Chat',
                timestamp: prev[currentSessionId]?.timestamp || Date.now(),
                messages: newMessages
            }
        }));
    }
  }, [currentSessionId]);

  const handleNewChat = React.useCallback(() => {
    const newId = uuidv4();
    setCurrentSessionId(newId);
    setMessages([]); // Clear visual messages immediately
    setIsMobileSidebarOpen(false);
  }, []);

  const handleSelectSession = React.useCallback((id) => {
    setCurrentSessionId(id);
    setIsMobileSidebarOpen(false);
  }, []);

  const handleUpdateSession = React.useCallback((sessionId, updates) => {
    setSessions(prev => ({
        ...prev,
        [sessionId]: {
            ...prev[sessionId],
            ...updates
        }
    }));
  }, []);

  const handleDeleteSession = React.useCallback((id) => {
    setSessions(prev => {
        const newSessions = { ...prev };
        delete newSessions[id];
        return newSessions;
    });
    if (id === currentSessionId) {
        // We can't call handleNewChat here easily because it depends on currentSessionId which is stale in this closure if not careful.
        // But since we are deleting, we can just set a new ID.
        const newId = uuidv4();
        setCurrentSessionId(newId);
        setMessages([]);
    }
  }, [currentSessionId]);

  const handleClearHistory = React.useCallback(() => {
    if (window.confirm('确定要删除所有历史记录吗？')) {
        setSessions({});
        const newId = uuidv4();
        setCurrentSessionId(newId);
        setMessages([]);
    }
  }, []);
  
  // Theme State
  const [currentTheme, setCurrentTheme] = useState('light'); // 'light' or 'dark'

  const toggleTheme = React.useCallback(() => {
    setCurrentTheme(prev => prev === 'light' ? 'dark' : 'light');
  }, []);
  
  const [config, setConfig] = useState({
    provider: 'OpenAI',
    apiKey: '',
    tavilyKey: '',
  });

  // Export PDF Logic moved from Sidebar
  const handleExportPDF = React.useCallback(async (reportTitle) => {
    if (messages.length === 0) {
        alert("暂无对话内容");
        return;
    }
    
    const response = await axios.post('/pdf', {
        session_id: currentSessionId,
        title: reportTitle,
        messages: messages
    }, {
        responseType: 'blob'
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${reportTitle}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }, [messages, currentSessionId]);

  const handleSend = React.useCallback(async (text) => {
    if (!config.apiKey || !config.tavilyKey) {
        alert("请先在左侧设置 API Key");
        return;
    }

    const userMsg = { role: 'user', content: text };
    // Optimistically update UI
    const newMessages = [...messages, userMsg];
    // Persist user message immediately
    updateCurrentSession(newMessages, true);
    
    setIsLoading(true);

    try {
        const response = await fetch('/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: text,
                session_id: currentSessionId, // Use currentSessionId
                openai_api_key: config.apiKey,
                tavily_api_key: config.tavilyKey,
                base_url: baseUrls[config.provider],
                model: models[config.provider]
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // Wait for the full response JSON
        const data = await response.json();
        const assistantContent = data.content;

        const assistantMsg = { role: 'assistant', content: assistantContent };
        
        // Update UI with full message
        const messagesWithAssistant = [...newMessages, assistantMsg];
        setMessages(messagesWithAssistant);
        
        // Final persist when done
        updateCurrentSession([...messagesWithAssistant], true);

    } catch (error) {
        console.error("Chat error:", error);
        const errorMsg = { role: 'assistant', content: `**Error**: ${error.message}` };
        updateCurrentSession([...newMessages, errorMsg], true);
    } finally {
        setIsLoading(false);
    }
  }, [config, currentSessionId, messages, updateCurrentSession]);

  return (
    <ThemeProvider theme={currentTheme === 'light' ? lightTheme : darkTheme}>
      <GlobalStyles />
      <AppContainer>
        <Sidebar 
            isOpen={isMobileSidebarOpen}
            isCollapsed={isSidebarCollapsed}
            toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            config={config} 
            setConfig={setConfig} 
            onNewChat={handleNewChat}
            onClearHistory={handleClearHistory}
            messages={messages}
            sessionId={currentSessionId}
            currentTheme={currentTheme}
            toggleTheme={toggleTheme}
            onCloseMobile={() => setIsMobileSidebarOpen(false)}
            
            // New Props
            sessions={sessions}
            currentSessionId={currentSessionId}
            onSelectSession={handleSelectSession}
            onDeleteSession={handleDeleteSession}
            onUpdateSession={handleUpdateSession}
            onExportPDF={handleExportPDF}
        />
        
        <MainContent>
            <Header $isSidebarCollapsed={isSidebarCollapsed}>
                <MenuButton onClick={() => {
                    // If desktop (and collapsed), expand it. 
                    // If mobile, toggle mobile menu.
                    if (window.innerWidth > 768) {
                        setIsSidebarCollapsed(!isSidebarCollapsed);
                    } else {
                        setIsMobileSidebarOpen(!isMobileSidebarOpen);
                    }
                }}>
                    <FiMenu size={20} />
                </MenuButton>
                <span>智搜研报助手</span>
            </Header>

            <ChatArea messages={messages} isLoading={isLoading} onSend={handleSend} />
            <InputArea onSend={handleSend} isLoading={isLoading} />
        </MainContent>
      </AppContainer>
    </ThemeProvider>
  );
}

export default App;
