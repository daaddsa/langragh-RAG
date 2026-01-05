import os
import requests
import streamlit as st

# Configure Page
st.set_page_config(
    page_title="智搜研报助手",
    page_icon="🤖",
    layout="wide"
)

# Constants
API_BASE_URL = "http://localhost:8000"

# Session State Initialization
if "messages" not in st.session_state:
    st.session_state.messages = []
if "session_id" not in st.session_state:
    import uuid
    st.session_state.session_id = str(uuid.uuid4())

# Sidebar Configuration
with st.sidebar:
    st.title("⚙️ 设置")
    
    # Add Provider Selector for better UX
    provider = st.selectbox(
        "选择模型厂商",
        ["OpenAI", "DeepSeek", "Moonshot (Kimi)", "Aliyun (Qwen)", "Custom"],
        index=0
    )
    
    default_base_urls = {
        "OpenAI": "https://api.openai.com/v1",
        "DeepSeek": "https://api.deepseek.com",
        "Moonshot (Kimi)": "https://api.moonshot.cn/v1",
        "Aliyun (Qwen)": "https://dashscope.aliyuncs.com/compatible-mode/v1",
        "Custom": "https://api.openai.com/v1"
    }
    
    default_models = {
        "OpenAI": "gpt-3.5-turbo",
        "DeepSeek": "deepseek-chat",
        "Moonshot (Kimi)": "moonshot-v1-8k",
        "Aliyun (Qwen)": "qwen-plus",
        "Custom": "gpt-3.5-turbo"
    }
    
    base_url = st.text_input("API Base URL", value=default_base_urls[provider])
    model_name = st.text_input("模型名称 (Model Name)", value=default_models[provider])
    openai_key = st.text_input("API Key", type="password", help=f"请输入 {provider} 的 API Key")
    tavily_key = st.text_input("Tavily API Key", type="password")
    
    st.divider()
    if st.button("🧹 清空对话"):
        st.session_state.messages = []
        import uuid
        st.session_state.session_id = str(uuid.uuid4())
        st.rerun()

    st.divider()
    st.markdown("### 📥 导出报告")
    report_title = st.text_input("报告标题", value="我的研报")
    
    # Initialize session state for PDF if not exists
    if "pdf_data" not in st.session_state:
        st.session_state.pdf_data = None
        
    if st.button("生成 PDF"):
        if not st.session_state.messages:
            st.warning("暂无对话内容")
        else:
            with st.spinner("正在生成 PDF..."):
                try:
                    payload = {
                        "session_id": st.session_state.session_id,
                        "title": report_title
                    }
                    resp = requests.post(f"{API_BASE_URL}/pdf", json=payload)
                    if resp.status_code == 200:
                        st.session_state.pdf_data = resp.content
                        st.success("PDF 生成成功！")
                    else:
                        st.error(f"生成失败: {resp.text}")
                except Exception as e:
                    st.error(f"连接错误: {e}")

    # Show download button if data is available
    if st.session_state.pdf_data:
        st.download_button(
            label="点击下载 PDF",
            data=st.session_state.pdf_data,
            file_name=f"{report_title}.pdf",
            mime="application/pdf"
        )

# Main Chat Interface
st.title("🤖 智搜研报助手 (Lite)")
st.caption("基于 LangGraph + Tavily 的实时搜索智能体")

# Display History
for msg in st.session_state.messages:
    with st.chat_message(msg["role"]):
        st.markdown(msg["content"])

# Input Handling
if prompt := st.chat_input("请输入您的问题（例如：最新的AI Agent趋势是什么？）"):
    if not openai_key or not tavily_key:
        st.error("请先在左侧侧边栏设置 API Key！")
        st.stop()

    # 1. User Message
    st.session_state.messages.append({"role": "user", "content": prompt})
    with st.chat_message("user"):
        st.markdown(prompt)

    # 2. Assistant Message (Streaming)
    with st.chat_message("assistant"):
        message_placeholder = st.empty()
        full_response = ""
        
        # Show a spinner initially to indicate connection
        with st.spinner("正在连接 Agent..."):
            try:
                # Prepare payload
                payload = {
                    "message": prompt,
                    "session_id": st.session_state.session_id,
                    "openai_api_key": openai_key,
                    "tavily_api_key": tavily_key,
                    "base_url": base_url,
                    "model": model_name
                }
                
                # Stream request
                # Add timeout to prevent indefinite hanging (connect timeout=10s, read timeout=120s)
                # Search operations can be slow, so we increase read timeout.
                with requests.post(f"{API_BASE_URL}/chat", json=payload, stream=True, timeout=(10, 120)) as response:
                    if response.status_code != 200:
                        st.error(f"API Error: {response.text}")
                    else:
                        for chunk in response.iter_content(chunk_size=None):
                            if chunk:
                                try:
                                    text_chunk = chunk.decode("utf-8")
                                    # print(f"DEBUG CHUNK: {text_chunk}") # Frontend debug log
                                    
                                    # Clear initial "Thinking..." message if it's the first real chunk
                                    if full_response == "" and "🔍" in text_chunk:
                                         full_response = text_chunk
                                    else:
                                         full_response += text_chunk
                                    message_placeholder.markdown(full_response + "▌")
                                except Exception as e:
                                    print(f"Error decoding chunk: {e}")
                                
                        message_placeholder.markdown(full_response)
                
                # Save history
                st.session_state.messages.append({"role": "assistant", "content": full_response})
                
            except Exception as e:
                st.error(f"Connection Error: {e}")
