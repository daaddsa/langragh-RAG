import React, { useState } from 'react';
import styled from 'styled-components';
import { FiSend } from 'react-icons/fi';

const InputContainer = styled.div`
  padding: 20px 10%;
  background-color: var(--bg-color);
  position: relative;
`;

const InputWrapper = styled.div`
  position: relative;
  background-color: var(--input-bg);
  border-radius: 25px;
  padding: 10px 15px;
  display: flex;
  align-items: center;
  border: 1px solid transparent;
  transition: all 0.2s;

  &:focus-within {
    background-color: #fff;
    border-color: #d0d7de;
    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  }
`;

const StyledTextarea = styled.textarea`
  flex: 1;
  border: none;
  background: transparent;
  resize: none;
  padding: 10px;
  font-family: inherit;
  font-size: 16px;
  line-height: 1.5;
  outline: none;
  max-height: 200px;
  min-height: 24px;
  color: var(--text-primary);
  
  &::placeholder {
    color: var(--text-secondary);
  }
`;

const SendButton = styled.button`
  background: transparent;
  border: none;
  color: ${props => props.disabled ? '#ccc' : 'var(--accent-color)'};
  padding: 8px;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.1s;
  
  &:active {
    transform: scale(0.95);
  }
`;

const FooterText = styled.div`
  text-align: center;
  font-size: 11px;
  color: var(--text-secondary);
  margin-top: 10px;
`;

const InputArea = ({ onSend, isLoading }) => {
  const [input, setInput] = useState("");

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (input.trim() && !isLoading) {
      onSend(input);
      setInput("");
    }
  };

  const handleInput = (e) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = e.target.scrollHeight + 'px';
  };

  return (
    <InputContainer>
      <InputWrapper>
        <StyledTextarea
            placeholder="输入您的问题..."
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            rows={1}
        />
        <SendButton onClick={handleSend} disabled={!input.trim() || isLoading}>
            <FiSend size={20} />
        </SendButton>
      </InputWrapper>
      <FooterText>
        AI 可能会生成错误信息，请核对重要事实。
      </FooterText>
    </InputContainer>
  );
};

export default React.memo(InputArea);
