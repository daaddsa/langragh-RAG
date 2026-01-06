import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FiSettings, FiTrash2, FiFileText, FiPlus, FiSun, FiMoon, FiMenu, FiX, FiTag } from 'react-icons/fi';
import axios from 'axios';

const SidebarContainer = styled.div`
  width: ${props => props.$isCollapsed ? '0' : '280px'};
  background-color: var(--sidebar-bg);
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: ${props => props.$isCollapsed ? '20px 0' : '20px 10px'};
  border-right: 1px solid var(--border-color);
  flex-shrink: 0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  opacity: ${props => props.$isCollapsed ? '0' : '1'};
  
  @media (max-width: 768px) {
    position: absolute;
    z-index: 100;
    width: 280px;
    opacity: 1;
    transform: ${props => props.$isOpen ? 'translateX(0)' : 'translateX(-100%)'};
    box-shadow: ${props => props.$isOpen ? '2px 0 8px rgba(0,0,0,0.1)' : 'none'};
  }
`;

const SidebarHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 0 10px;
`;

const NewChatButton = styled.button`
  background-color: ${props => props.theme.colors.buttonHover};
  color: ${props => props.theme.colors.buttonText};
  border: none;
  border-radius: 15px;
  padding: 15px 24px;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  margin-bottom: 20px;
  transition: all 0.2s;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  width: 100%;

  &:hover {
    filter: brightness(0.95);
    box-shadow: 0 2px 5px rgba(0,0,0,0.15);
  }
`;

const SectionTitle = styled.h3`
  font-size: 12px;
  color: var(--text-secondary);
  margin: 20px 10px 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const ConfigGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
  padding: 0 10px;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

const Label = styled.label`
  font-size: 12px;
  color: var(--text-secondary);
`;

const Input = styled.input`
  padding: 10px;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  background-color: var(--input-bg);
  color: var(--text-primary);
  font-size: 13px;
  outline: none;
  
  &:focus {
    border-color: var(--accent-color);
    box-shadow: 0 0 0 2px rgba(11, 87, 208, 0.1);
  }
`;

const Select = styled.select`
  padding: 10px;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  background-color: var(--input-bg);
  color: var(--text-primary);
  font-size: 13px;
  outline: none;
  cursor: pointer;
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  border-radius: 8px;
  border: none;
  background-color: transparent;
  color: var(--text-primary);
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
  text-align: left;
  width: 100%;

  &:hover {
    background-color: var(--hover-bg);
  }
  
  &.primary {
    background-color: var(--accent-color);
    color: white;
    justify-content: center;
    margin-top: 10px;
    
    &:hover {
        filter: brightness(1.1);
    }
  }
`;

const ThemeToggle = styled.button`
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
  
  &:hover {
    background-color: var(--hover-bg);
    color: var(--text-primary);
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: var(--text-primary);
  cursor: pointer;
  padding: 8px;
  
  @media (min-width: 769px) {
    display: flex; /* Allow closing on desktop via internal button if desired, though usually App header handles it */
  }
`;

const HistoryList = styled.div`
  flex: 1;
  overflow-y: auto;
  margin-bottom: 20px;
`;

const TagChip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  background-color: var(--accent-color);
  color: white;
  border-radius: 4px;
  font-size: 10px;
  
  svg {
    cursor: pointer;
  }
`;

const HistoryItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  margin: 4px 10px;
  border-radius: 20px;
  font-size: 13px;
  color: ${props => props.active ? 'var(--accent-color)' : 'var(--text-primary)'};
  background-color: ${props => props.active ? 'var(--ai-avatar-bg)' : 'transparent'};
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: ${props => props.active ? 'var(--ai-avatar-bg)' : 'var(--hover-bg)'};
  }
  
  .content {
    flex: 1;
    overflow: hidden;
  }

  .title {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .tags {
    display: flex;
    gap: 4px;
    margin-top: 2px;
    flex-wrap: wrap;
  }

  .tag-dot {
    font-size: 10px;
    color: var(--text-secondary);
    background: var(--input-bg);
    padding: 0 4px;
    border-radius: 4px;
  }
  
  .delete-btn {
    opacity: 0;
    margin-left: 8px;
    padding: 4px;
    color: var(--text-secondary);
    
    &:hover {
      color: #d93025;
    }
  }
  
  &:hover .delete-btn {
    opacity: 1;
  }
`;

const Sidebar = ({ 
    config, 
    setConfig, 
    onNewChat, 
    onClearHistory, 
    // messages,  <-- Removed
    sessionId, 
    isOpen, 
    isCollapsed, 
    toggleCollapse,
    currentTheme,
    toggleTheme,
    onCloseMobile,
    
    sessions = {},
    currentSessionId,
    onSelectSession,
    onDeleteSession,
    onUpdateSession,
    onExportPDF // New prop
}) => {
  const [reportTitle, setReportTitle] = useState("我的研报");
  const [isExporting, setIsExporting] = useState(false);
  const [tagInput, setTagInput] = useState("");

  const currentSession = sessions[currentSessionId];
  const tags = currentSession?.tags || [];

  // Sync report title with session title if available, otherwise default
  useEffect(() => {
    if (currentSession?.title) {
        setReportTitle(currentSession.title);
    }
  }, [currentSessionId, currentSession?.title]);

  const handleAddTag = () => {
    if (!tagInput.trim()) return;
    if (tags.includes(tagInput.trim())) {
        setTagInput("");
        return;
    }
    const newTags = [...tags, tagInput.trim()];
    onUpdateSession(currentSessionId, { tags: newTags });
    setTagInput("");
  };

  const handleRemoveTag = (tagToRemove) => {
    const newTags = tags.filter(t => t !== tagToRemove);
    onUpdateSession(currentSessionId, { tags: newTags });
  };
  
  const handleTitleChange = (e) => {
    setReportTitle(e.target.value);
    onUpdateSession(currentSessionId, { title: e.target.value });
  };

  // Sort sessions by timestamp (descending)
  const sortedSessions = React.useMemo(() => 
    Object.values(sessions).sort((a, b) => b.timestamp - a.timestamp), 
  [sessions]);

  const handleExportClick = async () => {
    try {
        setIsExporting(true);
        await onExportPDF(reportTitle);
        setIsExporting(false);
    } catch (error) {
        console.error("PDF Export failed", error);
        alert("PDF 生成失败，请重试");
        setIsExporting(false);
    }
  };

  return (
    <>
    {/* Overlay for mobile */}
    {isOpen && <div style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 90}} onClick={onCloseMobile} />}
    
    <SidebarContainer $isOpen={isOpen} $isCollapsed={isCollapsed}>
      <SidebarHeader>
        <ThemeToggle onClick={toggleTheme} title={currentTheme === 'light' ? "Switch to Dark Mode" : "Switch to Light Mode"}>
            {currentTheme === 'light' ? <FiMoon size={20} /> : <FiSun size={20} />}
        </ThemeToggle>
        
        <CloseButton onClick={toggleCollapse} title="Collapse Sidebar">
             <FiMenu size={20} />
        </CloseButton>
      </SidebarHeader>

      <NewChatButton onClick={onNewChat}>
        <FiPlus size={20} />
        新对话
      </NewChatButton>

      {/* Chat History Section */}
      <div style={{ padding: '0 10px' }}>
        <SectionTitle>最近对话</SectionTitle>
      </div>
      <HistoryList>
        {sortedSessions.length === 0 && (
            <div style={{ padding: '10px 20px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                暂无历史记录
            </div>
        )}
        {sortedSessions.map(session => (
            <HistoryItem 
                key={session.id} 
                active={session.id === currentSessionId}
                onClick={() => onSelectSession(session.id)}
            >
                <div className="content">
                    <div className="title">{session.title}</div>
                    {session.tags && session.tags.length > 0 && (
                        <div className="tags">
                            {session.tags.map(t => (
                                <span key={t} className="tag-dot">#{t}</span>
                            ))}
                        </div>
                    )}
                </div>
                <button 
                    className="delete-btn" 
                    onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSession(session.id);
                    }}
                >
                    <FiTrash2 size={12} />
                </button>
            </HistoryItem>
        ))}
      </HistoryList>

      <ConfigGroup>
        <SectionTitle>配置</SectionTitle>
        
        <InputGroup>
            <Label>模型厂商</Label>
            <Select 
                value={config.provider}
                onChange={(e) => setConfig({...config, provider: e.target.value})}
            >
                <option value="OpenAI">OpenAI</option>
                <option value="DeepSeek">DeepSeek</option>
                <option value="Moonshot (Kimi)">Moonshot (Kimi)</option>
                <option value="Aliyun (Qwen)">Aliyun (Qwen)</option>
            </Select>
        </InputGroup>

        <InputGroup>
            <Label>API Key</Label>
            <Input 
                type="password" 
                placeholder="sk-..." 
                value={config.apiKey}
                onChange={(e) => setConfig({...config, apiKey: e.target.value})}
            />
        </InputGroup>

        <InputGroup>
            <Label>Tavily API Key</Label>
            <Input 
                type="password" 
                placeholder="tvly-..." 
                value={config.tavilyKey}
                onChange={(e) => setConfig({...config, tavilyKey: e.target.value})}
            />
        </InputGroup>
      </ConfigGroup>

      <ConfigGroup>
        <SectionTitle>当前对话设置</SectionTitle>
        
        <InputGroup>
            <Label>标题</Label>
            <Input 
                value={reportTitle}
                onChange={handleTitleChange}
                placeholder="对话标题"
            />
        </InputGroup>
        
        <InputGroup>
            <Label>标签 (Tags)</Label>
            <div style={{display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '5px'}}>
                {tags.map(tag => (
                    <TagChip key={tag}>
                        {tag} <FiX size={10} onClick={() => handleRemoveTag(tag)} />
                    </TagChip>
                ))}
            </div>
            <div style={{display: 'flex', gap: '5px'}}>
                <Input 
                    placeholder="添加标签..." 
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            handleAddTag();
                        }
                    }}
                    style={{flex: 1}}
                />
                <button 
                    onClick={handleAddTag} 
                    style={{
                        background: 'none', 
                        border: 'none', 
                        cursor: 'pointer',
                        color: 'var(--accent-color)'
                    }}
                >
                    <FiPlus />
                </button>
            </div>
        </InputGroup>

        <ActionButton className="primary" onClick={handleExportClick} disabled={isExporting}>
            <FiFileText />
            {isExporting ? "生成中..." : "导出 PDF"}
        </ActionButton>

        <ActionButton onClick={onClearHistory}>
            <FiTrash2 />
            清空所有历史
        </ActionButton>
      </ConfigGroup>
    </SidebarContainer>
    </>
  );
};

export default React.memo(Sidebar);
