# Agent From Scratch

一个基于 Bun 的极简命令行 Agent，用于演示：

- 对话上下文持久化
- OpenAI 兼容模型调用
- 基础工具调用能力

## 使用

先创建 `.env` 文件：

```bash
OPENAI_API_KEY=your_api_key
```

安装依赖并运行：

```bash
bun install
bun run index.ts "今天天气怎么样？"
```

## 说明

- 对话历史保存在 `db.json`
- 入口文件是 `index.ts`
