import React, { useRef, useEffect, useState } from 'react';
import styled from 'styled-components';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { FiUser, FiCpu, FiCopy, FiCheck, FiShare2 } from 'react-icons/fi';
import { motion } from 'framer-motion';

const ChatContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding: 20px 0;
  scroll-behavior: smooth;
  background-color: var(--bg-color);
`;

const MessageWrapper = styled(motion.div)`
  display: flex;
  gap: 16px;
  padding: 20px 10%;
  width: 100%;
`;

const Avatar = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: ${props => props.isUser ? '#8e8e8e' : '#e7f0fe'};
  color: ${props => props.isUser ? '#fff' : '#0b57d0'};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 18px;
`;

const MessageContent = styled.div`
  flex: 1;
  font-size: 15px;
  line-height: 1.6;
  color: var(--text-primary);
  overflow-x: hidden;

  /* Markdown Styles */
  p { margin-bottom: 12px; }
  ul, ol { margin-bottom: 12px; padding-left: 20px; }
  h1, h2, h3 { margin-top: 20px; margin-bottom: 10px; font-weight: 600; }
  a { color: var(--accent-color); text-decoration: none; }
  a:hover { text-decoration: underline; }
  blockquote { border-left: 3px solid #ccc; padding-left: 10px; color: #666; }
  
  code {
    background-color: #f0f0f0;
    padding: 2px 4px;
    border-radius: 4px;
    font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
    font-size: 0.9em;
  }
  
  pre {
    background: transparent !important;
    padding: 0 !important;
    margin: 16px 0 !important;
  }
`;

const ActionRow = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 8px;
  opacity: 0;
  transition: opacity 0.2s;
  
  ${MessageWrapper}:hover & {
    opacity: 1;
  }
`;

const IconButton = styled.button`
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  
  &:hover {
    background-color: #e3e3e3;
    color: var(--text-primary);
  }
`;

const LoadingDots = styled.div`
  display: flex;
  gap: 4px;
  padding: 10px 0;
  
  span {
    width: 6px;
    height: 6px;
    background-color: var(--text-secondary);
    border-radius: 50%;
    animation: bounce 1.4s infinite ease-in-out both;
  }
  
  span:nth-child(1) { animation-delay: -0.32s; }
  span:nth-child(2) { animation-delay: -0.16s; }
  
  @keyframes bounce {
    0%, 80%, 100% { transform: scale(0); }
    40% { transform: scale(1); }
  }
`;

const WelcomeScreen = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-secondary);
  gap: 30px;
  padding: 20px;
  
  h1 {
    font-size: 32px;
    background: linear-gradient(90deg, #4285f4, #9b72cb, #d96570);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin-bottom: 10px;
  }
`;

const QuickPromptGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  max-width: 600px;
  width: 100%;
  
  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const QuickPromptCard = styled.button`
  background-color: var(--input-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 15px;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--text-primary);
  font-size: 14px;
  
  &:hover {
    background-color: var(--hover-bg);
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.05);
  }
`;

const quickPrompts = [
    "如何写一篇高质量的行业研报？",
    "帮我分析一下最新的人工智能发展趋势",
    "解释一下什么是量子计算",
    "制定一个学习Python的计划"
];

const MessageItem = React.memo(({ msg, index, handleCopy, handleShare, copiedId }) => (
    <MessageWrapper 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
    >
      <Avatar isUser={msg.role === 'user'}>
        {msg.role === 'user' ? <FiUser /> : <FiCpu />}
      </Avatar>
      
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, marginBottom: 4, fontSize: '13px', color: '#5f6368' }}>
            {msg.role === 'user' ? 'You' : 'Assistant'}
        </div>
        
        <MessageContent>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({node, inline, className, children, ...props}) {
                const match = /language-(\w+)/.exec(className || '')
                return !inline && match ? (
                  <SyntaxHighlighter
                    style={oneLight}
                    language={match[1]}
                    PreTag="div"
                    {...props}
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                ) : (
                  <code className={className} {...props}>
                    {children}
                  </code>
                )
              }
            }}
          >
            {msg.content}
          </ReactMarkdown>
        </MessageContent>

        <ActionRow>
            <IconButton onClick={() => handleCopy(msg.content, index)} title="Copy">
                {copiedId === index ? <FiCheck size={14} color="green" /> : <FiCopy size={14} />}
            </IconButton>
            <IconButton onClick={() => handleShare(msg.content)} title="Share">
                <FiShare2 size={14} />
            </IconButton>
        </ActionRow>
      </div>
    </MessageWrapper>
));

const ChatArea = ({ messages, isLoading, onSend }) => {
  const bottomRef = useRef(null);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleCopy = React.useCallback((text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);
  
  const handleShare = React.useCallback((text) => {
    // Simulated share action
    if (navigator.share) {
        navigator.share({
            title: '智搜研报助手 Share',
            text: text
        }).catch(console.error);
    } else {
        handleCopy(text);
        alert("链接已复制到剪贴板 (Share not supported on this browser)");
    }
  }, [handleCopy]);

  if (messages.length === 0) {
    return (
        <ChatContainer>
            <WelcomeScreen>
                <div style={{textAlign: 'center'}}>
                    <h1>你好，我是智搜研报助手</h1>
                    <p>我可以帮你搜索网络信息，并整理成专业的研报。</p>
                </div>
                
                <QuickPromptGrid>
                    {quickPrompts.map((prompt, idx) => (
                        <QuickPromptCard key={idx} onClick={() => onSend && onSend(prompt)}>
                            {prompt}
                        </QuickPromptCard>
                    ))}
                </QuickPromptGrid>
            </WelcomeScreen>
        </ChatContainer>
    )
  }

  return (
    <ChatContainer>
      {messages.map((msg, index) => (
        <MessageItem 
            key={index} 
            msg={msg} 
            index={index} 
            handleCopy={handleCopy} 
            handleShare={handleShare}
            copiedId={copiedId}
        />
      ))}

      {isLoading && (
        <MessageWrapper>
           <Avatar isUser={false}><FiCpu /></Avatar>
           <div style={{ flex: 1 }}>
                <LoadingDots>
                    <span></span><span></span><span></span>
                </LoadingDots>
           </div>
        </MessageWrapper>
      )}
      
      <div ref={bottomRef} style={{ height: '20px' }} />
    </ChatContainer>
  );
};

export default React.memo(ChatArea);
