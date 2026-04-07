# Agent From Scratch

一个基于 Bun + TypeScript 的命令行 Agent 示例项目。

它提供了一套足够小但完整的 Agent 骨架：命令行输入、多轮记忆、LLM 调用、工具注册与执行，以及终端中的基础状态反馈。适合用来学习“Agent 从 0 到 1 是怎么串起来的”。

## 当前能力

- 通过 `openai` SDK 调用兼容 OpenAI Chat Completions 的模型
- 将消息历史持久化到 `db.json`，跨多次运行保留上下文
- 支持模型发起 tool call，工具执行后再把结果喂回模型继续推理
- 内置 3 个示例工具
  - `dad_joke`：获取随机 dad joke
  - `reddit`：获取 Reddit `r/nba` 最新帖子
  - `generate_image`：调用图片生成接口并返回图片 URL
- 使用 `ora` 在终端展示思考中、执行工具中等状态

## 运行前提

- Bun
- 一个可用的 `OPENAI_API_KEY`
- 一个兼容 OpenAI 接口的服务地址

当前代码在 [`src/llm.ts`](/Users/aqingcyan/Documents/LearnSpace/agent-from-scratch/src/llm.ts) 中默认使用模型 `MiniMax-M2.7`，所以实际运行时需要在 `.env` 中配置 `OPENAI_BASE_URL` 指向支持该模型的兼容接口，例如：

```bash
OPENAI_BASE_URL=https://api.minimaxi.com/v1
```

## 快速开始

1. 安装依赖

```bash
bun install
```

2. 初始化环境变量

```bash
cp .env.template .env
```

编辑 `.env`：

```bash
OPENAI_API_KEY=your_api_key
OPENAI_BASE_URL=https://api.minimaxi.com/v1
```

3. 初始化本地记忆库（如果仓库里已经有 `db.json`，这一步可以跳过）

```bash
cp db.json.template db.json
```

4. 运行 Agent

```bash
bun run index.ts "给我讲个冷笑话"
bun run index.ts "再来一个，并配一张图"
```

## 它是怎么工作的

1. [`index.ts`](/Users/aqingcyan/Documents/LearnSpace/agent-from-scratch/index.ts) 读取命令行里的用户输入。
2. [`src/agent.ts`](/Users/aqingcyan/Documents/LearnSpace/agent-from-scratch/src/agent.ts) 把用户消息写入记忆，并启动 agent 循环。
3. [`src/llm.ts`](/Users/aqingcyan/Documents/LearnSpace/agent-from-scratch/src/llm.ts) 组装系统提示词、历史消息和工具定义，调用模型。
4. 如果模型返回 tool call，[`src/toolRunner.ts`](/Users/aqingcyan/Documents/LearnSpace/agent-from-scratch/src/toolRunner.ts) 会执行对应工具。
5. 工具结果通过 [`src/memory.ts`](/Users/aqingcyan/Documents/LearnSpace/agent-from-scratch/src/memory.ts) 写回 `db.json`，模型继续下一轮推理，直到产出最终回复。

## 项目结构

```text
.
├── index.ts
├── types.ts
├── db.json
├── db.json.template
├── .env.template
└── src
    ├── agent.ts
    ├── ai.ts
    ├── llm.ts
    ├── memory.ts
    ├── systemPrompt.ts
    ├── toolRunner.ts
    ├── ui.ts
    └── tools
        ├── dadJoke.ts
        ├── generateImage.ts
        ├── index.ts
        └── reddit.ts
```

各模块职责：

- [`src/ai.ts`](/Users/aqingcyan/Documents/LearnSpace/agent-from-scratch/src/ai.ts)：初始化 OpenAI SDK client
- [`src/systemPrompt.ts`](/Users/aqingcyan/Documents/LearnSpace/agent-from-scratch/src/systemPrompt.ts)：定义系统提示词
- [`src/tools/index.ts`](/Users/aqingcyan/Documents/LearnSpace/agent-from-scratch/src/tools/index.ts)：注册可暴露给模型的工具
- [`src/ui.ts`](/Users/aqingcyan/Documents/LearnSpace/agent-from-scratch/src/ui.ts)：终端输出和加载状态

## 记忆与状态

- 对话历史保存在仓库根目录的 `db.json`
- 每条消息都会写入 `id` 和 `createdAt`
- 想重置上下文时，清空 `db.json` 里的 `messages` 数组即可

## 如何扩展一个新工具

1. 在 [`src/tools`](/Users/aqingcyan/Documents/LearnSpace/agent-from-scratch/src/tools) 下新增一个工具文件，定义 `name`、`description`、`zod` 参数和工具实现。
2. 在 [`src/tools/index.ts`](/Users/aqingcyan/Documents/LearnSpace/agent-from-scratch/src/tools/index.ts) 中注册工具 definition。
3. 在 [`src/toolRunner.ts`](/Users/aqingcyan/Documents/LearnSpace/agent-from-scratch/src/toolRunner.ts) 中补上工具名到实现函数的分发逻辑。
4. 如有必要，调整 [`src/systemPrompt.ts`](/Users/aqingcyan/Documents/LearnSpace/agent-from-scratch/src/systemPrompt.ts) 让模型更稳定地使用新工具。

## 当前边界

- 这是一个命令行骨架，不是交互式聊天终端
- 工具调用当前按顺序执行，未开启并行工具调用
- 工具和模型能力都写死在代码里，适合学习和二次改造，不是开箱即用的通用 Agent 框架
