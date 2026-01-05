# OpenAI 免费额度与替代方案说明

## 1. OpenAI 还有免费额度吗？
**结论：目前（2025年）新注册账号通常不再赠送 API 免费额度。**

*   **以前**：OpenAI 曾给新用户赠送 $5 或 $18 的免费 Credit，有效期 3 个月。
*   **现在**：你需要绑定信用卡并充值（Pre-paid）至少 $5 才能开始使用 API。
*   **注意**：ChatGPT 网页版（Plus/Free）的账号与 API Platform 的计费是完全分开的。你是 ChatGPT Plus 会员并不代表你有 API 的使用额度。

## 2. 适合学生的低成本/免费替代方案

如果不想绑定国外信用卡，建议使用国内的大模型 API，它们通常兼容 OpenAI 格式，且赠送额度大方。

### 方案 A：DeepSeek (深度求索) - 推荐 🔥
*   **兼容性**：完全兼容 OpenAI SDK。
*   **价格**：`deepseek-chat` (V3) 的价格仅为 GPT-4o 的 1/10 甚至更低。
*   **赠送**：新用户注册通常赠送 10元 - 50元人民币额度，足够完成整个毕设开发。
*   **修改代码**：
    在 `backend/app/graph.py` 中，将 `model="gpt-3.5-turbo"` 改为 `model="deepseek-chat"`，并设置 `base_url="https://api.deepseek.com"`.

### 方案 B：Kimi (Moonshot AI)
*   **兼容性**：兼容 OpenAI SDK。
*   **特点**：长文本处理能力强（支持 200k 上下文），适合读长文档。
*   **赠送**：注册赠送一定额度。
*   **Base URL**: `https://api.moonshot.cn/v1`

### 方案 C：阿里通义千问 (DashScope)
*   **兼容性**：通过 `dashscope` 库或 OpenAI 兼容接口。
*   **赠送**：新用户有免费 Token 包。

## 3. 如何在本项目中切换到 DeepSeek？

只需修改 `backend/app/graph.py` 中的 LLM 初始化部分：

```python
    llm = ChatOpenAI(
        model="deepseek-chat",  # 修改模型名称
        temperature=0, 
        api_key=openai_api_key, # 这里填 DeepSeek 的 Key
        base_url="https://api.deepseek.com", # 增加 Base URL
        streaming=True
    )
```

然后，在前端侧边栏的 "OpenAI API Key" 输入框中填入 **DeepSeek API Key** (`sk-xxxx`) 即可。
