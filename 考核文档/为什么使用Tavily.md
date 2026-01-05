# 为什么选择 Tavily 作为搜索引擎？

在构建 AI Agent 时，我们选择了 **Tavily** 而不是传统的 Google Search API 或 Bing API，主要基于以下几个核心原因，这些特性使其特别适合 LLM（大语言模型）应用场景：

## 1. 专为 LLM 设计 (Built for LLMs)
传统的搜索引擎（如 Google）返回的是给人类阅读的链接列表和简短摘要。Agent 需要点击链接、解析 HTML、清洗广告和无关内容，这不仅增加了开发复杂度，还消耗大量 Token 和时间。

**Tavily 的优势：**
*   **直接返回清洗后的文本**：Tavily 会自动抓取网页内容，去除 HTML 标签、广告、导航栏，直接返回高质量的纯文本（Raw Text）。
*   **上下文感知**：它不仅仅是关键词匹配，还能理解查询的意图，返回更相关的上下文片段。

## 2. 减少 Token 消耗与成本
*   **传统方式**：Agent 搜索 -> 获取 10 个链接 -> 爬取 10 个网页 -> LLM 读取数万字 -> 总结。这会消耗巨大的 Token，且速度极慢。
*   **Tavily 方式**：Agent 搜索 -> Tavily 返回 5 个经过压缩和提取的精准答案片段 -> LLM 读取少量文本 -> 总结。
    *   **速度快**：减少了网络爬取和 LLM 阅读的时间。
    *   **省钱**：大幅减少了输入给 LLM 的 Token 数量。

## 3. 实时性与抗反爬虫
*   **实时性**：Tavily 专注于索引最新信息，非常适合回答“今天的新闻”、“最新的股票价格”等问题。
*   **内置爬虫能力**：很多现代网站（如 Twitter, LinkedIn, 新闻网站）有严格的反爬虫策略。Tavily 封装了复杂的代理和浏览器指纹技术，能稳定获取受保护的数据，开发者无需自己维护爬虫池。

## 4. 开发便捷性 (LangChain/LangGraph 集成)
Tavily 提供了官方的 Python SDK，并且与 LangChain 生态深度集成。

在我们的代码 [graph.py](file:///d:/Users/Lenovo/Desktop/Library/软件项目实训/课程设计/backend/app/graph.py#L35) 中，集成仅需几行代码：

```python
from langchain_community.tools.tavily_search import TavilySearchResults

search_tool = TavilySearchResults(
    max_results=5,
    search_depth="advanced",
    include_answer=True,  # 让 Tavily 直接生成一个简短回答
    include_raw_content=True # 获取原始内容用于生成引用
)
```

## 5. 总结
对于本课程设计项目（只有 2 周开发时间），Tavily 是**性价比最高**的选择：
1.  **开发快**：无需写爬虫，开箱即用。
2.  **效果好**：搜索结果质量高，Agent 更容易生成准确回答。
3.  **免费额度**：Tavily 提供每月 1000 次的免费调用，足够开发调试使用。
